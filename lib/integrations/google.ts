import 'server-only';
import { randomUUID } from 'node:crypto';
import { serviceClient } from '@/lib/supabase';
import { open, seal } from './secret-box';
import type { IntegrationRow } from '@/lib/database.types';

/**
 * Google Calendar — the owner's own calendar is the diary for every meeting
 * booked on the website or on WhatsApp.
 *
 * One OAuth connection (offline access) with the two narrowest scopes that do
 * the job: read free/busy, and create events. Busy times come from the real
 * calendar, so a personal appointment blocks a slot exactly like a client
 * call does; every booking gets a Google Meet link and an invitation the
 * client can add to their own calendar. Tokens are encrypted at rest.
 */

const SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
].join(' ');

const CAL = 'https://www.googleapis.com/calendar/v3';

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(origin: string): string {
  return `${process.env.GOOGLE_REDIRECT_ORIGIN || origin}/api/admin/integrations/google/callback`;
}

export function googleAuthUrl(origin: string, state: string): string {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: googleRedirectUri(origin),
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`;
}

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('Supabase service key is not configured.');
  return supabase;
}

export async function logGoogle(action: string, ok: boolean, detail?: string) {
  await db()
    .from('integration_log')
    .insert({ provider: 'google', action, ok, detail: detail?.slice(0, 1000) ?? null })
    .then(
      () => undefined,
      () => undefined,
    );
}

export async function getGoogle(): Promise<IntegrationRow | null> {
  const supabase = serviceClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from('integrations')
    .select('*')
    .eq('provider', 'google')
    .maybeSingle();
  return data ?? null;
}

type Token = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  id_token?: string;
  error?: string;
  error_description?: string;
};

async function token(params: Record<string, string>): Promise<Token> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      ...params,
    }),
    cache: 'no-store',
  });
  return (await res.json().catch(() => ({ error: `HTTP ${res.status}` }))) as Token;
}

function emailFromIdToken(idToken?: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from((idToken ?? '').split('.')[1] ?? '', 'base64url').toString('utf8'),
    ) as { email?: string };
    return payload.email ?? null;
  } catch {
    return null;
  }
}

export async function connectGoogle(code: string, origin: string): Promise<void> {
  const t = await token({
    grant_type: 'authorization_code',
    code,
    redirect_uri: googleRedirectUri(origin),
  });
  if (!t.access_token || !t.refresh_token) {
    throw new Error(t.error_description ?? t.error ?? 'Google returned no token.');
  }
  const now = Date.now();
  await db()
    .from('integrations')
    .upsert({
      provider: 'google',
      status: 'connected',
      scopes: SCOPES,
      account_label: emailFromIdToken(t.id_token) ?? 'Google Calendar',
      refresh_token_enc: seal(t.refresh_token),
      access_token_enc: seal(t.access_token),
      access_expires_at: new Date(now + (t.expires_in ?? 3600) * 1000 - 60_000).toISOString(),
      connected_at: new Date(now).toISOString(),
      last_error: null,
      settings: { calendar_id: 'primary' },
      updated_at: new Date(now).toISOString(),
    });
  await logGoogle('connect', true);
}

async function accessToken(): Promise<string> {
  const row = await getGoogle();
  if (!row || row.status === 'disconnected') throw new Error('Google Calendar is not connected.');
  const cached = open(row.access_token_enc);
  if (cached && row.access_expires_at && new Date(row.access_expires_at).getTime() > Date.now()) {
    return cached;
  }
  const refresh = open(row.refresh_token_enc);
  if (!refresh) throw new Error('The stored Google token could not be read. Reconnect Google.');
  const t = await token({ grant_type: 'refresh_token', refresh_token: refresh });
  if (!t.access_token) {
    await db()
      .from('integrations')
      .update({ status: 'error', last_error: t.error ?? 'Refresh failed' })
      .eq('provider', 'google');
    throw new Error(`Google token refresh failed: ${t.error ?? 'unknown'}. Reconnect Google.`);
  }
  await db()
    .from('integrations')
    .update({
      status: 'connected',
      access_token_enc: seal(t.access_token),
      access_expires_at: new Date(
        Date.now() + (t.expires_in ?? 3600) * 1000 - 60_000,
      ).toISOString(),
      last_error: null,
    })
    .eq('provider', 'google');
  return t.access_token;
}

async function gcal<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${CAL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (res.status === 204) return {} as T;
  const body = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Google ${res.status}: ${body.error?.message ?? 'request failed'}`);
  return body;
}

export async function googleReady(): Promise<boolean> {
  const row = await getGoogle();
  return Boolean(row && row.status === 'connected' && googleConfigured());
}

/** Busy intervals on the owner's calendar between two instants. */
export async function busyBetween(from: Date, to: Date): Promise<{ start: number; end: number }[]> {
  const res = await gcal<{
    calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
  }>('/freeBusy', {
    method: 'POST',
    body: JSON.stringify({
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      timeZone: 'Asia/Kolkata',
      items: [{ id: 'primary' }],
    }),
  });
  return (res.calendars?.primary?.busy ?? []).map((b) => ({
    start: new Date(b.start).getTime(),
    end: new Date(b.end).getTime(),
  }));
}

export async function createEvent(input: {
  start: Date;
  end: Date;
  summary: string;
  description: string;
  attendeeEmail?: string | null;
}): Promise<{ id: string; meetLink: string | null; htmlLink: string | null }> {
  const res = await gcal<{
    id: string;
    hangoutLink?: string;
    htmlLink?: string;
    conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
  }>(`/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: 'POST',
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start.toISOString(), timeZone: 'Asia/Kolkata' },
      end: { dateTime: input.end.toISOString(), timeZone: 'Asia/Kolkata' },
      attendees: input.attendeeEmail ? [{ email: input.attendeeEmail }] : [],
      conferenceData: {
        createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
      },
      reminders: { useDefault: true },
    }),
  });
  const meet =
    res.hangoutLink ??
    res.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ??
    null;
  return { id: res.id, meetLink: meet, htmlLink: res.htmlLink ?? null };
}

export async function cancelEvent(eventId: string): Promise<void> {
  await gcal(`/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`, {
    method: 'DELETE',
  });
}

export async function disconnectGoogle(): Promise<void> {
  const row = await getGoogle();
  const refresh = open(row?.refresh_token_enc);
  if (refresh) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refresh)}`, {
      method: 'POST',
      cache: 'no-store',
    }).catch(() => undefined);
  }
  await db()
    .from('integrations')
    .update({
      status: 'disconnected',
      refresh_token_enc: null,
      access_token_enc: null,
      access_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('provider', 'google');
  await logGoogle('disconnect', true);
}
