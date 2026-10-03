/**
 * Console identity constants, importable from middleware (edge), server code
 * and client components alike — so nothing here may import server-only code.
 */

/** The one address that may operate the console. Mirrored in Postgres. */
export const CONSOLE_EMAIL = 'contact@thepaperplane.co.in';

export function isConsoleEmail(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === CONSOLE_EMAIL;
}

/**
 * Two-factor sign-in is required unless explicitly switched off with
 * CONSOLE_REQUIRE_MFA=false — an escape hatch for a lost authenticator, to be
 * set in Vercel only for as long as it takes to enrol a new one.
 */
export const MFA_REQUIRED = process.env.CONSOLE_REQUIRE_MFA !== 'false';

/**
 * A hint cookie, not a credential: it tells the public site to load the
 * visual editor's code for the owner. Every save is re-authorised on the
 * server, so forging it gets you a toolbar that cannot save anything.
 */
export const EDITOR_COOKIE = 'pp_editor';
