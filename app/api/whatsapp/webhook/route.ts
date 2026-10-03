import { timingSafeEqual } from 'node:crypto';
import { ingestWebhook, verifySignature, whatsappConfigured } from '@/lib/integrations/whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Meta's webhook for the WhatsApp Business number.
 *
 * GET  — the one-time subscription check: echo hub.challenge if the verify
 *        token matches the one configured here.
 * POST — message and delivery-status events, accepted only with a valid
 *        X-Hub-Signature-256 over the exact bytes received. Anything unsigned
 *        is refused before it is parsed.
 */

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token') ?? '';
  const challenge = url.searchParams.get('hub.challenge') ?? '';
  const expected = process.env.WHATSAPP_VERIFY_TOKEN ?? '';
  const ok =
    mode === 'subscribe' &&
    expected.length > 0 &&
    token.length === expected.length &&
    timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  if (!ok) return new Response('Forbidden', { status: 403 });
  return new Response(challenge.replace(/[^\w-]/g, ''), {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

export async function POST(request: Request) {
  if (!whatsappConfigured()) return new Response('Not configured', { status: 503 });
  const raw = await request.text();
  if (raw.length > 1_000_000) return new Response('Too large', { status: 413 });
  if (!verifySignature(raw, request.headers.get('x-hub-signature-256'))) {
    return new Response('Invalid signature', { status: 401 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  try {
    await ingestWebhook(payload);
  } catch (error) {
    // Still 200: Meta retries failures for days, and a poison message would
    // otherwise block the queue. The error is in the server log.
    console.error('[whatsapp] ingest failed', error);
  }
  return new Response('OK', { status: 200 });
}
