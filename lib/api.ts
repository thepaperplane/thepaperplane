import { NextResponse } from 'next/server';

/** Standard JSON error shape for every route handler. */
export function apiError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function apiOk<T extends Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}

/**
 * Best-effort client IP. Vercel sets `x-forwarded-for`; the leftmost entry is
 * the original client. Falls back to a constant so rate limiting still groups
 * unknown callers rather than letting them all through.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * In-memory fixed-window rate limiter.
 *
 * Deliberately simple. On serverless this is per-instance, so it throttles
 * the common case (one bot hammering one warm instance) without adding a
 * Redis dependency. The honeypot and Supabase's own limits are the second
 * and third lines of defence. Swap in Upstash if abuse becomes real.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

// Keep the map from growing without bound on a long-lived instance.
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(key);
    }
  }, 300_000);
  // Do not hold the process open for this.
  if (typeof timer === 'object' && 'unref' in timer) timer.unref();
}

/**
 * Guard for /api/cron/* routes.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. A manual trigger
 * can pass the same header. If CRON_SECRET is unset we refuse rather than
 * defaulting open — an unauthenticated cron endpoint is a free way for
 * anyone to make us hammer third-party feeds.
 */
export function authorizeCron(request: Request): { ok: true } | { ok: false; response: Response } {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return {
      ok: false,
      response: apiError('CRON_SECRET is not configured on this deployment.', 503),
    };
  }

  const header = request.headers.get('authorization');
  if (header !== `Bearer ${secret}`) {
    return { ok: false, response: apiError('Unauthorized', 401) };
  }

  return { ok: true };
}

/** Parse a JSON body without throwing on malformed input. */
export async function readJson<T = unknown>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Refuse state-changing requests that a browser sent from another origin.
 * Session cookies are SameSite=Lax already; this is the second lock.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
