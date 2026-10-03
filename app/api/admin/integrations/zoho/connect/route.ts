import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireConsoleApi } from '@/lib/auth';
import { zohoAuthUrl, zohoConfigured } from '@/lib/integrations/zoho';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Starts the Zoho consent flow. The `state` value is kept in a short-lived,
 * http-only cookie and checked on the way back, so a callback this console
 * did not start is refused.
 */
export async function GET(request: Request) {
  const auth = await requireConsoleApi();
  if (!auth.ok) return auth.response;
  const origin = new URL(request.url).origin;
  if (!zohoConfigured()) {
    return NextResponse.redirect(new URL('/admin/integrations?zoho=not-configured', origin));
  }
  const state = randomBytes(24).toString('base64url');
  const res = NextResponse.redirect(zohoAuthUrl(origin, state));
  res.cookies.set('pp_zoho_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/admin/integrations/zoho',
    maxAge: 600,
  });
  return res;
}
