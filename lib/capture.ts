import { serviceClient } from './supabase';
import { normalizeSiteUrl } from './utils';
export { deriveProjectDefaults } from './capture-client';
import type { CaptureStatus } from './database.types';

/**
 * Portfolio preview capture.
 *
 * Captures are the default because they load an order of magnitude faster
 * than a live site and are unaffected by the client's header policy. Where a
 * client site allows framing (lib/embed.ts) the /work frame also offers the
 * real, interactive site on demand.
 *
 * Provider: ScreenshotOne. Swapping providers means changing `buildShotUrl`
 * only — everything else is provider-agnostic.
 */

const BUCKET = 'previews';

export type Reachability = {
  reachable: boolean;
  status: number | null;
  reason?: string;
};

/**
 * Pre-flight check before spending a capture credit.
 *
 * Catches the three failure modes we have actually hit: a domain that does
 * not resolve, a storefront behind a password gate, and a site that returns
 * an error page with a 200.
 */
export async function checkReachable(url: string): Promise<Reachability> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'PaperPlaneBot/1.0 (+https://www.thepaperplane.co.in; portfolio preview check)',
        Accept: 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
    });

    const finalUrl = response.url;

    // Shopify and similar gates redirect to a password/login interstitial.
    if (/\/(password|login|challenge)(\/|$|\?)/i.test(new URL(finalUrl).pathname)) {
      return {
        reachable: false,
        status: response.status,
        reason: 'Site is behind a password or login gate, so there is no public page to capture.',
      };
    }

    if (!response.ok) {
      return {
        reachable: false,
        status: response.status,
        reason: `Site responded with HTTP ${response.status}.`,
      };
    }

    return { reachable: true, status: response.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const dnsFailure = /ENOTFOUND|EAI_AGAIN|getaddrinfo|fetch failed/i.test(message);

    return {
      reachable: false,
      status: null,
      reason: dnsFailure
        ? 'Domain does not resolve. Check that it is registered and DNS points somewhere.'
        : `Could not reach the site: ${message}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

type Viewport = 'desktop' | 'mobile' | 'desktop-full' | 'mobile-full';

/**
 * Injected into the page before the shutter. Most modern sites hide sections
 * until they scroll into view and fade them in; a capture taken mid-fade (or
 * of a section the scroll never "revealed") comes out blank or ghosted. This
 * lands every common reveal library on its finished state.
 */
const SETTLE_CSS = [
  '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;scroll-behavior:auto!important;caret-color:transparent!important}',
  '.reveal,[data-reveal],[data-aos],.aos-init,.wow,.fade-in,.fade-up,[data-animate],[data-scroll],[data-sal],.sal-animate{opacity:1!important;transform:none!important;visibility:visible!important;filter:none!important;clip-path:none!important}',
].join('');

/**
 * For sites whose desktop layout locks the page (`overflow:hidden` on the
 * document) and scrolls inside an inner panel: a screenshot only ever sees the
 * first screen. This unlocks the document and any tall inner scroller so the
 * page takes its natural height, then scrolls through it once so lazy images
 * load. Used only as a second attempt, when the first capture came back about
 * one screen tall.
 */
const UNLOCK_JS = `(async()=>{
  const H = innerHeight;
  const free = (e) => { for (const p of ['height','max-height','overflow','overflow-y']) e.style.setProperty(p, p==='max-height'?'none':p.startsWith('overflow')?'visible':'auto','important'); };
  const scrollers = [...document.querySelectorAll('body *')].filter((e) => {
    const cs = getComputedStyle(e);
    return /(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + H * 0.5 && e.clientHeight > H * 0.5;
  });
  for (const e of [document.documentElement, document.body, ...scrollers]) {
    free(e);
    for (let p = e.parentElement; p && p !== document.documentElement; p = p.parentElement) free(p);
  }
  document.documentElement.classList.remove('lenis-stopped','lenis-smooth');
  const total = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += H * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 220)); }
  scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 400));
})()`;

/** Pixel size of a WebP, read from its header (no image library needed). */
export function webpSize(buf: Buffer): { w: number; h: number } | null {
  if (
    buf.length < 30 ||
    buf.toString('ascii', 0, 4) !== 'RIFF' ||
    buf.toString('ascii', 8, 12) !== 'WEBP'
  )
    return null;
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8 ')
    return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  if (kind === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
  }
  if (kind === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  return null;
}

function buildShotUrl(
  target: string,
  viewport: Viewport,
  accessKey: string,
  opts: { unlock?: boolean } = {},
): string {
  const params = new URLSearchParams({
    access_key: accessKey,
    url: target,
    format: 'webp',
    image_quality: '86',
    block_ads: 'true',
    block_cookie_banners: 'true',
    block_banners_by_heuristics: 'true',
    block_chats: 'true',
    block_trackers: 'true',
    // Sites that respect it skip their entrance animations entirely.
    reduced_motion: 'true',
    styles: SETTLE_CSS,
    // Wait for the network to go quiet (fonts, hero images), then a beat more.
    wait_until: 'networkidle0',
    delay: '2',
    timeout: '60',
    cache: 'false',
  });

  if (viewport === 'desktop-full' || viewport === 'mobile-full') {
    // The whole page, top to bottom, for the scrollable browser frame on
    // /work. Scrolled first so lazy-loaded sections are actually rendered,
    // capped in height so one endless page cannot produce a 60 MB image, and
    // taken at a lower pixel ratio than the hero shots because the frame shows
    // it at well under half its natural width.
    const mobile = viewport === 'mobile-full';
    params.set('viewport_width', mobile ? '390' : '1440');
    params.set('viewport_height', mobile ? '844' : '900');
    params.set('device_scale_factor', mobile ? '2' : '1');
    if (mobile) params.set('viewport_mobile', 'true');
    params.set('full_page', 'true');
    // Stitch the page section by section at a fixed window height. The default
    // stretches the browser to the whole page, which makes every 100vh hero
    // enormous and the layout look oversized.
    params.set('full_page_algorithm', 'by_sections');
    params.set('full_page_scroll', 'true');
    // Scroll in steps and pause at each, so lazy images actually load.
    params.set('full_page_scroll_by', mobile ? '700' : '800');
    params.set('full_page_scroll_delay', '450');
    params.set('full_page_max_height', mobile ? '14000' : '9000');
    params.set('image_quality', '80');
  } else if (viewport === 'desktop') {
    params.set('viewport_width', '1440');
    params.set('viewport_height', '900');
    params.set('device_scale_factor', '2');
    // Above-the-fold only — the frame crops to 16:10 anyway.
    params.set('full_page', 'false');
  } else {
    params.set('viewport_width', '390');
    params.set('viewport_height', '844');
    params.set('device_scale_factor', '3');
    params.set('viewport_mobile', 'true');
    params.set('full_page', 'false');
  }

  if (opts.unlock) params.set('scripts', UNLOCK_JS);

  return `https://api.screenshotone.com/take?${params.toString()}`;
}

async function fetchShot(
  target: string,
  viewport: Viewport,
  accessKey: string,
  opts: { unlock?: boolean } = {},
): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(buildShotUrl(target, viewport, accessKey, opts), {
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Capture provider returned ${response.status}: ${detail.slice(0, 200)}`);
    }

    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

export type CaptureResult = {
  status: CaptureStatus;
  desktopPath?: string;
  mobilePath?: string;
  /** Full-length captures; best-effort, absent if the provider refused them. */
  desktopFullPath?: string;
  mobileFullPath?: string;
  /** Something worth telling the owner even though the capture succeeded. */
  notes?: string[];
  httpStatus: number | null;
  error?: string;
};

/**
 * Check, capture at both viewports, upload, and return storage paths.
 * Callers persist the result against the project row.
 */
export async function captureProject(slug: string, rawUrl: string): Promise<CaptureResult> {
  const url = normalizeSiteUrl(rawUrl);
  if (!url) {
    return { status: 'failed', httpStatus: null, error: 'That does not look like a valid URL.' };
  }

  const reach = await checkReachable(url);
  if (!reach.reachable) {
    return { status: 'unreachable', httpStatus: reach.status, error: reach.reason };
  }

  const accessKey = process.env.SCREENSHOT_API_KEY;
  if (!accessKey) {
    return {
      status: 'pending',
      httpStatus: reach.status,
      error:
        'SCREENSHOT_API_KEY is not set, so no capture was taken. The site is reachable and will capture once the key is configured.',
    };
  }

  const supabase = serviceClient();
  if (!supabase) {
    return { status: 'failed', httpStatus: reach.status, error: 'Supabase is not configured.' };
  }

  try {
    const [desktop, mobile] = await Promise.all([
      fetchShot(url, 'desktop', accessKey),
      fetchShot(url, 'mobile', accessKey),
    ]);

    // Version the filename so CDN caches pick up a re-capture immediately.
    const stamp = Date.now();
    const desktopPath = `${slug}/desktop-${stamp}.webp`;
    const mobilePath = `${slug}/mobile-${stamp}.webp`;

    const uploads = await Promise.all([
      supabase.storage
        .from(BUCKET)
        .upload(desktopPath, desktop, { contentType: 'image/webp', upsert: true }),
      supabase.storage
        .from(BUCKET)
        .upload(mobilePath, mobile, { contentType: 'image/webp', upsert: true }),
    ]);

    const failed = uploads.find((u) => u.error);
    if (failed?.error) throw new Error(`Upload failed: ${failed.error.message}`);

    // Full-length pages are a bonus, not a requirement: if the provider
    // times out on a very long page, the project still publishes with its
    // viewport captures and the frame simply does not scroll.
    const notes: string[] = [];
    const full = await Promise.allSettled(
      (['desktop-full', 'mobile-full'] as const).map(async (kind) => {
        let bytes = await fetchShot(url, kind, accessKey);
        if (kind === 'desktop-full') {
          // About one screen tall means the page did not expand: take it again
          // with inner scroll panels unlocked, and keep whichever is taller.
          const first = webpSize(bytes);
          if (first && first.h < 1500) {
            try {
              const retry = await fetchShot(url, kind, accessKey, { unlock: true });
              const second = webpSize(retry);
              if (second && second.h > first.h * 1.15) bytes = retry;
            } catch {
              /* the first capture still stands */
            }
            const final = webpSize(bytes);
            if (final && final.h < 1100)
              notes.push(
                'The desktop page came back only one screen tall, so there is nothing to scroll in the desktop view. The site probably scrolls inside a fixed panel. Upload a tall screenshot under “Scrollable preview” to replace it.',
              );
          }
        }
        const path = `${slug}/${kind}-${stamp}.webp`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, bytes, { contentType: 'image/webp', upsert: true });
        if (error) throw error;
        return path;
      }),
    );
    const [desktopFull, mobileFull] = full.map((r) =>
      r.status === 'fulfilled' ? r.value : undefined,
    );

    return {
      status: 'ready',
      desktopPath,
      mobilePath,
      desktopFullPath: desktopFull,
      mobileFullPath: mobileFull,
      notes,
      httpStatus: reach.status,
    };
  } catch (error) {
    return {
      status: 'failed',
      httpStatus: reach.status,
      error: error instanceof Error ? error.message : 'Capture failed.',
    };
  }
}
