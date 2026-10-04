import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireConsoleApi } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { connectGoogle, logGoogle } from '@/lib/integrations/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(request: Request) {
  const auth = await requireConsoleApi();
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const back = (q: string) => {
    const res = NextResponse.redirect(new URL(`/admin/meetings?google=${q}`, url.origin));
    res.cookies.delete({ name: 'pp_google_state', path: '/api/admin/integrations/google' });
    return res;
  };
  const state = url.searchParams.get('state') ?? '';
  const expected = (await cookies()).get('pp_google_state')?.value ?? '';
  if (!state || !expected || !same(state, expected)) return back('state-mismatch');
  if (url.searchParams.get('error')) {
    await logGoogle('connect', false, url.searchParams.get('error') ?? 'denied');
    return back('denied');
  }
  const code = url.searchParams.get('code');
  if (!code) return back('no-code');
  try {
    await connectGoogle(code, url.origin);
    await audit(auth.email, 'integrations.google.connect', 'integrations', 'google');
    return back('connected');
  } catch (e) {
    await logGoogle('connect', false, e instanceof Error ? e.message : String(e));
    return back('failed');
  }
}
