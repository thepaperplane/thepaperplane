import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { serviceClient } from '@/lib/supabase';

/**
 * WhatsApp Business, through Meta's Cloud API — on a DEDICATED ASSISTANT
 * NUMBER. The practice's own number (+91 90255 65526) stays on the WhatsApp
 * Business app exactly as it is: registering a number with the Cloud API
 * takes it off the app, so that number must never be used here.
 *
 * Inbound messages arrive at /api/whatsapp/webhook, signed with the app
 * secret; the assistant (lib/whatsapp-bot.ts) answers them, and the console
 * can step in. Meta's rule that shapes everything: a free-form message can
 * only be sent within 24 hours of the customer's last message. Outside that
 * window — or to start a conversation — only a pre-approved template can be
 * sent.
 *
 * Configuration is environment-only (nothing secret in the database):
 *   WHATSAPP_TOKEN            permanent system-user access token
 *   WHATSAPP_PHONE_NUMBER_ID  the business number's id
 *   WHATSAPP_WABA_ID          WhatsApp Business Account id (for templates)
 *   WHATSAPP_VERIFY_TOKEN     any string; typed into Meta when adding the webhook
 *   WHATSAPP_APP_SECRET       the Meta app's secret, to verify webhook signatures
 */

const VERSION = process.env.WHATSAPP_API_VERSION || 'v23.0';
const GRAPH = `https://graph.facebook.com/${VERSION}`;
export const WINDOW_MS = 24 * 3600_000;

export function whatsappConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_APP_SECRET &&
    process.env.WHATSAPP_VERIFY_TOKEN,
  );
}

/** Constant-time check of Meta's X-Hub-Signature-256 over the raw body. */
export function verifySignature(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
  const given = header.slice('sha256='.length);
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given, 'hex'), Buffer.from(expected, 'hex'));
}

/** WhatsApp ids are digits only, country code first. */
export function normaliseWaId(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

async function graph<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GRAPH}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(body.error?.message ?? `WhatsApp API ${res.status}`);
  return body;
}

type SendResult = { messages?: { id: string }[] };

async function send(payload: Record<string, unknown>): Promise<string> {
  const res = await graph<SendResult>(`/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      ...payload,
    }),
  });
  const id = res.messages?.[0]?.id;
  if (!id) throw new Error('WhatsApp did not accept the message.');
  return id;
}

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Up to three tap-to-reply buttons under a message. */
export async function sendButtons(
  to: string,
  body: string,
  buttons: { id: string; title: string }[],
): Promise<string> {
  return send({
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: cut(body, 1024) },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: 'reply',
          reply: { id: cut(b.id, 256), title: cut(b.title, 20) },
        })),
      },
    },
  });
}

/** A list the customer opens and picks one row from (at most ten rows). */
export async function sendList(
  to: string,
  body: string,
  button: string,
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[],
): Promise<string> {
  let budget = 10;
  const trimmed = sections
    .map((sec) => {
      const rows = sec.rows.slice(0, Math.max(0, budget));
      budget -= rows.length;
      return {
        title: cut(sec.title, 24),
        rows: rows.map((r) => ({
          id: cut(r.id, 200),
          title: cut(r.title, 24),
          ...(r.description ? { description: cut(r.description, 72) } : {}),
        })),
      };
    })
    .filter((sec) => sec.rows.length);
  return send({
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: cut(body, 1024) },
      action: { button: cut(button, 20), sections: trimmed },
    },
  });
}

/** "Typing…" on the customer's screen while the reply is written; marks it read too. */
export async function typing(messageId: string): Promise<void> {
  await graph(`/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
      typing_indicator: { type: 'text' },
    }),
  }).catch(() => markRead(messageId));
}

/**
 * A one-time sign-in code, through an approved AUTHENTICATION template
 * (Meta's required category for codes; it carries a copy-code button).
 */
export async function sendAuthCode(
  to: string,
  code: string,
  template: string,
  language: string,
): Promise<string> {
  return send({
    to,
    type: 'template',
    template: {
      name: template,
      language: { code: language },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: code }] },
        { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
      ],
    },
  });
}

/** Fetches a media file a customer sent, for the console to open. */
export async function fetchMedia(
  mediaId: string,
): Promise<{ bytes: ArrayBuffer; mime: string } | null> {
  try {
    const meta = await graph<{ url?: string; mime_type?: string }>(
      `/${encodeURIComponent(mediaId)}`,
    );
    if (!meta.url) return null;
    const res = await fetch(meta.url, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return { bytes: await res.arrayBuffer(), mime: meta.mime_type ?? 'application/octet-stream' };
  } catch {
    return null;
  }
}

export async function sendText(to: string, text: string): Promise<string> {
  const res = await graph<SendResult>(`/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: true, body: text },
    }),
  });
  const id = res.messages?.[0]?.id;
  if (!id) throw new Error('WhatsApp did not accept the message.');
  return id;
}

export async function sendTemplate(
  to: string,
  name: string,
  language: string,
  params: string[],
): Promise<string> {
  const res = await graph<SendResult>(`/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name,
        language: { code: language },
        ...(params.length
          ? {
              components: [
                { type: 'body', parameters: params.map((p) => ({ type: 'text', text: p })) },
              ],
            }
          : {}),
      },
    }),
  });
  const id = res.messages?.[0]?.id;
  if (!id) throw new Error('WhatsApp did not accept the template.');
  return id;
}

export async function markRead(messageId: string): Promise<void> {
  await graph(`/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: messageId }),
  }).catch(() => undefined);
}

export type Template = { name: string; language: string; body: string; params: number };

export async function listTemplates(): Promise<Template[]> {
  if (!process.env.WHATSAPP_WABA_ID) return [];
  try {
    const res = await graph<{
      data?: {
        name: string;
        language: string;
        status: string;
        components?: { type: string; text?: string }[];
      }[];
    }>(
      `/${process.env.WHATSAPP_WABA_ID}/message_templates?status=APPROVED&limit=100&fields=name,language,status,components`,
    );
    return (res.data ?? []).map((t) => {
      const body = t.components?.find((c) => c.type === 'BODY')?.text ?? '';
      return {
        name: t.name,
        language: t.language,
        body,
        params: (body.match(/\{\{\d+\}\}/g) ?? []).length,
      };
    });
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------- webhook ---- */

type WebhookValue = {
  metadata?: { phone_number_id?: string };
  contacts?: { wa_id: string; profile?: { name?: string } }[];
  messages?: {
    id: string;
    from: string;
    timestamp: string;
    type: string;
    text?: { body?: string };
    image?: { id: string; caption?: string };
    document?: { id: string; filename?: string; caption?: string };
    audio?: { id: string };
    video?: { id: string; caption?: string };
    button?: { text?: string };
    interactive?: {
      button_reply?: { id?: string; title?: string };
      list_reply?: { id?: string; title?: string; description?: string };
    };
    location?: { latitude: number; longitude: number; name?: string };
  }[];
  statuses?: { id: string; status: string; errors?: { title?: string; message?: string }[] }[];
};

function describe(m: NonNullable<WebhookValue['messages']>[number]): {
  body: string;
  media: string | null;
} {
  switch (m.type) {
    case 'text':
      return { body: m.text?.body ?? '', media: null };
    case 'image':
      return {
        body: m.image?.caption ? `📷 ${m.image.caption}` : '📷 Photo',
        media: m.image?.id ?? null,
      };
    case 'document':
      return {
        body: `📄 ${m.document?.filename ?? 'Document'}${m.document?.caption ? ` — ${m.document.caption}` : ''}`,
        media: m.document?.id ?? null,
      };
    case 'audio':
      return { body: '🎤 Voice message', media: m.audio?.id ?? null };
    case 'video':
      return {
        body: m.video?.caption ? `🎬 ${m.video.caption}` : '🎬 Video',
        media: m.video?.id ?? null,
      };
    case 'button':
      return { body: m.button?.text ?? '', media: null };
    case 'interactive':
      return {
        body: m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? '',
        media: null,
      };
    case 'location':
      return {
        body: `📍 ${m.location?.name ?? 'Location'} (${m.location?.latitude}, ${m.location?.longitude})`,
        media: null,
      };
    default:
      return { body: `[${m.type} message]`, media: null };
  }
}

export type Inbound = {
  waId: string;
  messageId: string;
  text: string;
  kind: string;
  /** The id behind a tapped button or list row, e.g. "slot:2026-10-06T05:30:00.000Z". */
  replyId: string | null;
};

/**
 * Stores what Meta delivered and returns the inbound messages that are new
 * (Meta retries deliveries; a repeat is dropped by the unique message id).
 * Events for any other number on the same WhatsApp account are ignored.
 */
export async function ingestWebhook(payload: unknown): Promise<Inbound[]> {
  const fresh: Inbound[] = [];
  const db = serviceClient();
  if (!db) return fresh;
  const entries = (payload as { entry?: { changes?: { value?: WebhookValue }[] }[] })?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) continue;
      const ours = process.env.WHATSAPP_PHONE_NUMBER_ID;
      if (ours && value.metadata?.phone_number_id && value.metadata.phone_number_id !== ours) {
        continue;
      }
      const names = new Map((value.contacts ?? []).map((c) => [c.wa_id, c.profile?.name ?? null]));

      for (const m of value.messages ?? []) {
        const at = new Date(Number(m.timestamp) * 1000 || Date.now()).toISOString();
        const { body, media } = describe(m);
        const { error } = await db.from('wa_messages').insert({
          wa_message_id: m.id,
          wa_id: m.from,
          direction: 'in',
          kind: m.type,
          body: body.slice(0, 4000),
          media_id: media,
          status: 'received',
          created_at: at,
        });
        // A duplicate delivery (Meta retries) is a unique violation; skip it.
        if (error) continue;
        fresh.push({
          waId: m.from,
          messageId: m.id,
          text: body,
          kind: m.type,
          replyId: m.interactive?.button_reply?.id ?? m.interactive?.list_reply?.id ?? null,
        });
        const { data: existing } = await db
          .from('wa_contacts')
          .select('unread, name')
          .eq('wa_id', m.from)
          .maybeSingle();
        await db.from('wa_contacts').upsert({
          wa_id: m.from,
          name: names.get(m.from) ?? existing?.name ?? null,
          last_message_at: at,
          last_inbound_at: at,
          unread: (existing?.unread ?? 0) + 1,
        });
      }

      for (const s of value.statuses ?? []) {
        await db
          .from('wa_messages')
          .update({
            status: s.status,
            error: s.errors?.[0]?.message ?? s.errors?.[0]?.title ?? null,
          })
          .eq('wa_message_id', s.id);
      }
    }
  }
  return fresh;
}
