import 'server-only';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { serviceClient } from '@/lib/supabase';
import { sendPortalCode } from '@/lib/email';
import { getSettings } from '@/lib/settings';
import { normaliseWaId, sendAuthCode, whatsappConfigured } from '@/lib/integrations/whatsapp';

/**
 * Client portal sign-in.
 *
 * A client signs in with the email or phone number the practice has on file
 * for them (on the client record, or as one of its contact people — which is
 * how Zoho Books contact persons become portal users). A six-digit code goes
 * to that email, or to that number on WhatsApp from the assistant number.
 *
 * Deliberately separate from the console's authentication: no database user
 * is created, so a portal session can never reach the console or anything
 * behind row-level security. A session is a random token in an http-only
 * cookie; only its hash is stored, and it can be revoked from either side.
 */

export const PORTAL_COOKIE = 'pp_portal';
const SESSION_DAYS = 14;
const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const sha = (v: string) => createHash('sha256').update(v).digest('hex');
const pepper = () => process.env.INTEGRATIONS_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'pp';
const last10 = (v: string | null | undefined) => (v ?? '').replace(/\D/g, '').slice(-10);

export type Identifier = { kind: 'email' | 'phone'; value: string };

export function parseIdentifier(raw: string): Identifier | null {
  const v = raw.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { kind: 'email', value: v.toLowerCase() };
  const d = v.replace(/\D/g, '');
  if (d.length >= 10 && d.length <= 15)
    return { kind: 'phone', value: d.length === 10 ? `91${d}` : d };
  return null;
}

const key = (id: Identifier) => (id.kind === 'email' ? id.value : `+${id.value}`);

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('The portal is not available right now.');
  return supabase;
}

export type PortalClient = { id: string; name: string; email: string | null };

/** Client records this email or phone may open. */
export async function clientsFor(id: Identifier): Promise<PortalClient[]> {
  const supabase = db();
  const [{ data: clients }, { data: contacts }, { data: portal }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, email, phone, status')
      .neq('status', 'closed')
      .limit(10000),
    supabase.from('client_contacts').select('client_id, email, phone').limit(20000),
    supabase.from('client_portal').select('client_id, enabled').eq('enabled', false),
  ]);
  const disabled = new Set((portal ?? []).map((p) => p.client_id));
  const match = (email: string | null, phone: string | null) =>
    id.kind === 'email'
      ? (email ?? '').toLowerCase() === id.value
      : last10(phone).length === 10 && last10(phone) === last10(id.value);
  const ids = new Set<string>();
  (clients ?? []).forEach((c) => match(c.email, c.phone) && ids.add(c.id));
  (contacts ?? []).forEach((c) => match(c.email, c.phone) && ids.add(c.client_id));
  return (clients ?? [])
    .filter((c) => ids.has(c.id) && !disabled.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, email: c.email }));
}

export type StartResult = { ok: true; channel: 'email' | 'whatsapp' | 'none'; hint?: string };

const mask = (email: string) =>
  email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${'•'.repeat(Math.min(6, b.length))}${c}`);

/**
 * Sends a code if — and only if — the identifier belongs to a client. The
 * answer to the browser is the same either way, so the form cannot be used to
 * find out who is a client.
 */
export async function startSignIn(id: Identifier, ipHash: string): Promise<StartResult> {
  const supabase = db();
  const since = new Date(Date.now() - 15 * 60_000).toISOString();
  const { count } = await supabase
    .from('portal_codes')
    .select('id', { count: 'exact', head: true })
    .eq('identifier', key(id))
    .gte('created_at', since);
  if ((count ?? 0) >= 3) return { ok: true, channel: 'none' };

  const clients = await clientsFor(id);
  if (!clients.length) return { ok: true, channel: 'none' };

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await supabase.from('portal_codes').insert({
    identifier: key(id),
    code_hash: sha(`${pepper()}:${key(id)}:${code}`),
    expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
    ip_hash: ipHash,
  });

  if (id.kind === 'email') {
    await sendPortalCode(id.value, code);
    return { ok: true, channel: 'email' };
  }
  const { automations } = await getSettings();
  const to = normaliseWaId(id.value);
  if (to && whatsappConfigured() && automations.otpTemplate) {
    try {
      await sendAuthCode(to, code, automations.otpTemplate, automations.templateLanguage || 'en');
      return { ok: true, channel: 'whatsapp' };
    } catch (e) {
      console.error('[portal] whatsapp code failed', e instanceof Error ? e.message : e);
    }
  }
  // No WhatsApp route: fall back to the email on file for that client.
  const email = clients.find((c) => c.email)?.email;
  if (email) {
    await sendPortalCode(email, code);
    return { ok: true, channel: 'email', hint: mask(email) };
  }
  return { ok: true, channel: 'none' };
}

/** Checks a code; on success opens a session and sets the cookie. */
export async function verifyCode(
  id: Identifier,
  code: string,
  userAgent: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = db();
  const { data: row } = await supabase
    .from('portal_codes')
    .select('*')
    .eq('identifier', key(id))
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) return { ok: false, error: 'That code has expired. Ask for a new one.' };
  if (row.attempts >= MAX_ATTEMPTS)
    return { ok: false, error: 'Too many tries. Ask for a new code.' };

  const given = Buffer.from(sha(`${pepper()}:${key(id)}:${code.replace(/\D/g, '')}`));
  const stored = Buffer.from(row.code_hash);
  if (given.length !== stored.length || !timingSafeEqual(given, stored)) {
    await supabase
      .from('portal_codes')
      .update({ attempts: row.attempts + 1 })
      .eq('id', row.id);
    return { ok: false, error: 'That code is not right. Check it and try again.' };
  }
  await supabase.from('portal_codes').delete().eq('identifier', key(id));

  const clients = await clientsFor(id);
  if (!clients.length)
    return { ok: false, error: 'Portal access is not available for this account.' };

  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await supabase.from('portal_sessions').insert({
    token_hash: sha(token),
    identifier: key(id),
    client_ids: clients.map((c) => c.id),
    active_client_id: clients[0]!.id,
    user_agent: userAgent?.slice(0, 300) ?? null,
    expires_at: expires.toISOString(),
  });
  for (const c of clients) {
    const { data: p } = await supabase
      .from('client_portal')
      .select('logins')
      .eq('client_id', c.id)
      .maybeSingle();
    await supabase.from('client_portal').upsert({
      client_id: c.id,
      last_login_at: new Date().toISOString(),
      logins: (p?.logins ?? 0) + 1,
      updated_at: new Date().toISOString(),
    });
  }
  (await cookies()).set(PORTAL_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  });
  return { ok: true };
}

export type PortalSession = {
  id: string;
  identifier: string;
  clients: PortalClient[];
  active: PortalClient;
};

/** The signed-in client, or null. Re-checks access on every request. */
export async function getPortalSession(): Promise<PortalSession | null> {
  const token = (await cookies()).get(PORTAL_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const supabase = serviceClient();
  if (!supabase) return null;
  const { data: s } = await supabase
    .from('portal_sessions')
    .select('*')
    .eq('token_hash', sha(token))
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (!s) return null;
  const parsed = parseIdentifier(s.identifier.replace(/^\+/, ''));
  if (!parsed) return null;
  // Access is re-derived each time, so removing a contact or disabling the
  // portal for a client takes effect immediately.
  const allowed = (await clientsFor(parsed)).filter((c) => s.client_ids.includes(c.id));
  if (!allowed.length) return null;
  const active = allowed.find((c) => c.id === s.active_client_id) ?? allowed[0]!;
  if (Date.now() - new Date(s.last_seen_at).getTime() > 3600_000) {
    await supabase
      .from('portal_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', s.id);
  }
  return { id: s.id, identifier: s.identifier, clients: allowed, active };
}

export async function switchClient(sessionId: string, clientId: string): Promise<void> {
  await db().from('portal_sessions').update({ active_client_id: clientId }).eq('id', sessionId);
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(PORTAL_COOKIE)?.value;
  if (token) {
    await serviceClient()
      ?.from('portal_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', sha(token));
  }
  jar.delete(PORTAL_COOKIE);
}
