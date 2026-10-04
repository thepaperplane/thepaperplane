import { z } from 'zod';
import { apiError, apiOk, clientIp, rateLimit, readJson } from '@/lib/api';
import { parseIdentifier, verifyCode } from '@/lib/portal/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  identifier: z.string().trim().min(5).max(320),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the six-digit code.'),
});

export async function POST(request: Request) {
  const limit = rateLimit(`portal-verify:${clientIp(request)}`, { limit: 12, windowMs: 600_000 });
  if (!limit.ok) return apiError('Too many attempts. Please wait a few minutes.', 429);
  const parsed = Body.safeParse(await readJson(request));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Check the code.');
  const id = parseIdentifier(parsed.data.identifier);
  if (!id) return apiError('Enter the email address or mobile number we have for you.');
  const r = await verifyCode(id, parsed.data.code, request.headers.get('user-agent'));
  if (!r.ok) return apiError(r.error ?? 'That did not work.', 401);
  return apiOk({ ok: true });
}
