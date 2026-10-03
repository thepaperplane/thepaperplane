import { z } from 'zod';
import { clientIp, rateLimit, readJson } from '@/lib/api';
import { serviceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cookieless, aggregate page-view counting.
 *
 * What is stored is a counter per day for a combination of: the page, the
 * referring site's hostname, campaign tags from the URL, a device class and a
 * country. No IP address, no cookie, no identifier, no user agent string —
 * nothing that can be tied back to a person or linked across visits. Bots and
 * the console are not counted, and neither is anyone sending Do Not Track or
 * Global Privacy Control (the beacon checks before it sends).
 */

const Body = z.object({
  path: z.string().max(200).regex(/^\//),
  ref: z.string().max(120).optional().default(''),
  source: z.string().max(80).optional().nullable(),
  medium: z.string().max(80).optional().nullable(),
  campaign: z.string().max(120).optional().nullable(),
});

const BOT =
  /bot|crawl|spider|slurp|preview|monitor|lighthouse|headless|playwright|curl|wget|python|axios|node-fetch/i;

function device(ua: string): string {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'tablet';
  if (/mobi|iphone|android/i.test(ua)) return 'mobile';
  return 'desktop';
}

const clean = (v: string | null | undefined) =>
  (v ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9._ -]/g, '')
    .trim()
    .slice(0, 80);

export async function POST(request: Request) {
  const ua = request.headers.get('user-agent') ?? '';
  if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });

  const limit = rateLimit(`track:${clientIp(request)}`, { limit: 60, windowMs: 60_000 });
  if (!limit.ok) return new Response(null, { status: 204 });

  const parsed = Body.safeParse(await readJson(request));
  if (!parsed.success) return new Response(null, { status: 204 });
  const { path, ref, source, medium, campaign } = parsed.data;
  if (path.startsWith('/admin') || path.startsWith('/api'))
    return new Response(null, { status: 204 });

  const supabase = serviceClient();
  if (!supabase) return new Response(null, { status: 204 });

  const referrer = clean(ref).replace(/^www\./, '');
  const self = new URL(request.url).host.replace(/^www\./, '');

  await supabase
    .rpc('track_view', {
      p_path: path.split('?')[0]!.slice(0, 200),
      p_referrer: referrer === self ? '' : referrer,
      p_source: clean(source),
      p_medium: clean(medium),
      p_campaign: clean(campaign),
      p_device: device(ua),
      p_country: (request.headers.get('x-vercel-ip-country') ?? '').slice(0, 2).toUpperCase(),
    })
    .then(
      () => undefined,
      () => undefined,
    );

  return new Response(null, { status: 204 });
}
