import { serviceClient } from './supabase';
import { normalizeSiteUrl } from './utils';
export { deriveProjectDefaults } from './capture-client';
import type { CaptureStatus } from './database.types';

/**
 * Portfolio preview capture.
 *
 * Why screenshots rather than live iframes: all three current client sites
 * send frame-blocking headers (`X-Frame-Options: SAMEORIGIN` or `DENY` with
 * `frame-ancestors 'none'`), so an embedded live preview renders an empty
 * box. Captures are visually identical, load an order of magnitude faster,
 * and are unaffected by the client's header policy.
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

function buildShotUrl(target: string, viewport: Viewport, accessKey: string): string {
  const params = new URLSearchParams({
    access_key: accessKey,
    url: target,
    format: 'webp',
    image_quality: '82',
    block_ads: 'true',
    block_cookie_banners: 'true',
    block_trackers: 'true',
    // Give slow sites a moment to settle before the shutter.
    delay: '3',
    timeout: '40',
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
    params.set('full_page_scroll', 'true');
    params.set('full_page_max_height', mobile ? '14000' : '9000');
    params.set('image_quality', '76');
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

  return `https://api.screenshotone.com/take?${params.toString()}`;
}

async function fetchShot(target: string, viewport: Viewport, accessKey: string): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(buildShotUrl(target, viewport, accessKey), {
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
    const full = await Promise.allSettled(
      (['desktop-full', 'mobile-full'] as const).map(async (kind) => {
        const bytes = await fetchShot(url, kind, accessKey);
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
