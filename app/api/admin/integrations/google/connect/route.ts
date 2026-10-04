import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireConsoleApi } from '@/lib/auth';
import { googleAuthUrl, googleConfigured } from '@/lib/integrations/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Starts the Google consent flow; `state` is checked on the way back. */
export async function GET(request: Request) {
  const auth = await requireConsoleApi();
  if (!auth.ok) return auth.response;
  const origin = new URL(request.url).origin;
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL('/admin/meetings?google=not-configured', origin));
  }
  const state = randomBytes(24).toString('base64url');
  const res = NextResponse.redirect(googleAuthUrl(origin, state));
  res.cookies.set('pp_google_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/admin/integrations/google',
    maxAge: 600,
  });
  return res;
}
