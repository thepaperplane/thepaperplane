import 'server-only';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { serverClient, serviceClient } from './supabase';
import { CONSOLE_EMAIL, isConsoleEmail, MFA_REQUIRED } from './console';
import type { AppRole, ProfileRow } from './database.types';

export { CONSOLE_EMAIL, isConsoleEmail, MFA_REQUIRED };

/**
 * Who may use the console, decided in one place.
 *
 * Exactly one account can: contact@thepaperplane.co.in, with its address
 * confirmed, and — once a second factor exists, which the console insists on —
 * signed in at assurance level 2. The same rule is enforced three times,
 * deliberately: in middleware before any page code runs, here before any
 * server action or route handler touches data, and in Postgres, where
 * is_console_owner() sits under every row level security policy. Any one of
 * them is enough to keep a stranger out; all three have to fail together.
 */

export type ConsoleAccess =
  | { state: 'anon' }
  | { state: 'denied' }
  | { state: 'challenge' }
  | { state: 'enroll' }
  | { state: 'inactive' }
  | { state: 'ok'; profile: ProfileRow; email: string };

export async function consoleAccess(): Promise<ConsoleAccess> {
  let supabase;
  try {
    supabase = await serverClient();
  } catch {
    return { state: 'anon' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { state: 'anon' };
  if (!isConsoleEmail(user.email) || !user.email_confirmed_at) return { state: 'denied' };

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') return { state: 'challenge' };
  if (MFA_REQUIRED && aal?.currentLevel !== 'aal2') return { state: 'enroll' };

  // Read the profile with the service key: the identity has already been
  // verified above, and this keeps the console working in the window between
  // a password sign-in and the second factor, when RLS would (correctly)
  // refuse the session.
  const admin = serviceClient();
  const { data: profile } = admin
    ? await admin.from('profiles').select('*').eq('id', user.id).maybeSingle()
    : await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  if (!profile || !profile.is_active) return { state: 'inactive' };
  return { state: 'ok', profile, email: user.email! };
}

/** The signed-in console profile, or null. */
export async function currentProfile(): Promise<ProfileRow | null> {
  const access = await consoleAccess();
  return access.state === 'ok' ? access.profile : null;
}

/** Require full console access. Redirects to the right step otherwise. */
export async function requireProfile(): Promise<ProfileRow> {
  const access = await consoleAccess();
  if (access.state === 'ok') return access.profile;
  if (access.state === 'challenge') redirect('/admin/verify');
  if (access.state === 'enroll') redirect('/admin/setup-2fa');
  if (access.state === 'denied' || access.state === 'inactive') redirect('/admin/login?denied=1');
  redirect('/admin/login');
}

const RANK: Record<AppRole, number> = { viewer: 0, editor: 1, admin: 2, owner: 3 };

export function atLeast(role: AppRole, minimum: AppRole): boolean {
  return RANK[role] >= RANK[minimum];
}

/** Require a minimum role. Returns the profile so callers can use it. */
export async function requireRole(minimum: AppRole): Promise<ProfileRow> {
  const profile = await requireProfile();
  if (!atLeast(profile.role, minimum)) redirect('/admin?denied=1');
  return profile;
}

export function canEdit(role: AppRole): boolean {
  return atLeast(role, 'editor');
}

export function canAdminister(role: AppRole): boolean {
  return atLeast(role, 'admin');
}

/**
 * The same gate for route handlers, which must answer with a status code
 * rather than a redirect.
 */
export async function requireConsoleApi(): Promise<
  { ok: true; profile: ProfileRow; email: string } | { ok: false; response: NextResponse }
> {
  const access = await consoleAccess();
  if (access.state === 'ok' && atLeast(access.profile.role, 'editor')) {
    return { ok: true, profile: access.profile, email: access.email };
  }
  const status = access.state === 'anon' ? 401 : 403;
  return {
    ok: false,
    response: NextResponse.json(
      { error: status === 401 ? 'Sign in to the console first.' : 'Not permitted.' },
      { status, headers: { 'Cache-Control': 'no-store' } },
    ),
  };
}
