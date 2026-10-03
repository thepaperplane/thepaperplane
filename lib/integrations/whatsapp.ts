import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { serviceClient } from '@/lib/supabase';

/**
 * WhatsApp Business, through Meta's Cloud API.
 *
 * Inbound messages arrive at /api/whatsapp/webhook, signed with the app
 * secret; replies go out from the console. Meta's rule that shapes the UI:
 * a free-form message can only be sent within 24 hours of the customer's
 * last message. Outside that window — or to start a conversation — only a
 * pre-approved template can be sent.
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
    interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
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

export async function ingestWebhook(payload: unknown): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const entries = (payload as { entry?: { changes?: { value?: WebhookValue }[] }[] })?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) continue;
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
}
