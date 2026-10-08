import 'server-only';

/**
 * Can a client's site be shown live inside our page?
 *
 * A site decides that, not us: `X-Frame-Options` or a CSP `frame-ancestors`
 * directive that does not name this domain means an <iframe> renders an empty
 * box. Checked from the server (a browser cannot read another origin's
 * headers), cached for six hours, and any failure counts as "no" — the frame
 * then simply shows the capture, which is never worse than a blank.
 *
 * To make a site built here frameable, it should send
 *   Content-Security-Policy: frame-ancestors 'self' https://www.thepaperplane.co.in https://thepaperplane.co.in
 * and no X-Frame-Options header.
 */

const OURS = ['thepaperplane.co.in', 'www.thepaperplane.co.in'];

export function allowsFraming(headers: Headers): boolean {
  const xfo = headers.get('x-frame-options');
  if (xfo && /deny|sameorigin/i.test(xfo)) return false;

  const csp = headers.get('content-security-policy') ?? '';
  const directive = csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.toLowerCase().startsWith('frame-ancestors'));
  if (!directive) return true;

  const sources = directive.split(/\s+/).slice(1);
  if (sources.includes("'none'")) return false;
  return sources.some((s) => {
    if (s === '*' || s === 'https:') return true;
    const host = s.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (host.startsWith('*.')) return OURS.some((o) => o.endsWith(host.slice(1)));
    return OURS.includes(host);
  });
}

export async function isFrameable(url: string | null | undefined): Promise<boolean> {
  if (!url || !/^https:\/\//i.test(url)) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'PaperPlaneBot/1.0 (+https://www.thepaperplane.co.in)' },
      next: { revalidate: 21600 },
    });
    if (!res.ok) return false;
    return allowsFraming(res.headers);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Why a site can or cannot be shown inside our page, in words for the owner.
 * Not cached: it runs only when the console's portfolio page is opened.
 */
export async function inspectFraming(
  url: string | null | undefined,
): Promise<{ allowed: boolean; reason: string }> {
  if (!url || !/^https:\/\//i.test(url))
    return { allowed: false, reason: 'The address is not an https:// address.' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'User-Agent': 'PaperPlaneBot/1.0 (+https://www.thepaperplane.co.in)' },
    });
    if (!res.ok) return { allowed: false, reason: `the site answered HTTP ${res.status}.` };
    if (allowsFraming(res.headers)) return { allowed: true, reason: '' };
    const xfo = res.headers.get('x-frame-options');
    if (xfo) return { allowed: false, reason: `it sends X-Frame-Options: ${xfo}.` };
    const csp = (res.headers.get('content-security-policy') ?? '')
      .split(';')
      .map((d) => d.trim())
      .find((d) => d.toLowerCase().startsWith('frame-ancestors'));
    return {
      allowed: false,
      reason: `it sends ${csp ?? 'a frame policy'}, which does not include this website.`,
    };
  } catch {
    return { allowed: false, reason: 'the site could not be reached to check.' };
  } finally {
    clearTimeout(timer);
  }
}
