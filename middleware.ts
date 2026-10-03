import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { EDITOR_COOKIE, isConsoleEmail, MFA_REQUIRED } from '@/lib/console';

/**
 * The console's front door.
 *
 * Runs before any /admin page or /api/admin handler and decides where the
 * request is allowed to go:
 *
 *   no session                → /admin/login
 *   any address but the owner → signed out on the spot, back to login
 *   password only, 2FA set up → /admin/verify   (enter the six-digit code)
 *   password only, no 2FA yet → /admin/setup-2fa (enrol an authenticator)
 *   fully verified            → through
 *
 * This is a gate, not the authorisation boundary — lib/auth.ts repeats the
 * check before any data is touched, and row level security in Postgres repeats
 * it again. A forged cookie gets through none of the three.
 */

const OPEN = new Set(['/admin/login']);
const STEP_UP = new Set(['/admin/verify', '/admin/setup-2fa']);

function deny(request: NextRequest, path: string, api: boolean, status: number) {
  if (api) {
    return NextResponse.json(
      { error: status === 401 ? 'Sign in to the console first.' : 'Not permitted.' },
      { status, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  const url = new URL(path, request.url);
  if (path === '/admin/login' && request.nextUrl.pathname.startsWith('/admin/')) {
    url.searchParams.set('next', request.nextUrl.pathname);
  }
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const api = pathname.startsWith('/api/admin');
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without credentials the console cannot work at all; the login screen
  // explains what is missing.
  if (!url || !key) {
    if (api) return deny(request, '', true, 503);
    if (pathname !== '/admin/login') return deny(request, '/admin/login', false, 302);
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items: { name: string; value: string; options?: Record<string, unknown> }[]) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as never),
        );
      },
    },
  });

  // getUser() revalidates the token with Supabase — getSession() would only
  // decode whatever the cookie claims.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const finish = (res: NextResponse, editor: boolean) => {
    // Session cookies refreshed above must survive whatever we return.
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    if (editor) {
      res.cookies.set(EDITOR_COOKIE, '1', {
        path: '/',
        sameSite: 'lax',
        secure: true,
        httpOnly: false,
        maxAge: 60 * 60 * 12,
      });
    } else if (request.cookies.has(EDITOR_COOKIE)) {
      res.cookies.set(EDITOR_COOKIE, '', { path: '/', maxAge: 0 });
    }
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  };

  if (!user) {
    if (OPEN.has(pathname)) return finish(response, false);
    return finish(deny(request, '/admin/login', api, 401), false);
  }

  // Any account that is not the console owner is signed out immediately.
  if (!isConsoleEmail(user.email) || !user.email_confirmed_at) {
    await supabase.auth.signOut();
    const target = new URL('/admin/login', request.url);
    target.searchParams.set('denied', '1');
    return finish(api ? deny(request, '', true, 403) : NextResponse.redirect(target), false);
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const needsChallenge = aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2';
  const needsEnrol = !needsChallenge && MFA_REQUIRED && aal?.currentLevel !== 'aal2';

  if (needsChallenge) {
    if (pathname === '/admin/verify') return finish(response, false);
    return finish(deny(request, '/admin/verify', api, 403), false);
  }
  if (needsEnrol) {
    if (pathname === '/admin/setup-2fa') return finish(response, false);
    return finish(deny(request, '/admin/setup-2fa', api, 403), false);
  }

  // Fully verified: the step-up screens and the login form have nothing to do.
  if (OPEN.has(pathname) || STEP_UP.has(pathname)) {
    return finish(NextResponse.redirect(new URL('/admin', request.url)), true);
  }

  return finish(response, true);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
