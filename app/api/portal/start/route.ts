import { createHash } from 'node:crypto';
import { z } from 'zod';
import { apiError, apiOk, clientIp, rateLimit, readJson } from '@/lib/api';
import { parseIdentifier, startSignIn } from '@/lib/portal/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ identifier: z.string().trim().min(5).max(320) });

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`portal-start:${ip}`, { limit: 6, windowMs: 600_000 });
  if (!limit.ok) return apiError('Too many attempts. Please wait a few minutes.', 429);
  const parsed = Body.safeParse(await readJson(request));
  const id = parsed.success ? parseIdentifier(parsed.data.identifier) : null;
  if (!id) return apiError('Enter the email address or mobile number we have for you.');
  try {
    const r = await startSignIn(id, createHash('sha256').update(ip).digest('hex').slice(0, 32));
    return apiOk({
      ok: true,
      channel: r.channel === 'none' ? (id.kind === 'email' ? 'email' : 'whatsapp') : r.channel,
      hint: r.hint ?? null,
    });
  } catch (e) {
    console.error('[portal/start]', e);
    return apiError('The portal is not available right now. Please try again shortly.', 503);
  }
}
