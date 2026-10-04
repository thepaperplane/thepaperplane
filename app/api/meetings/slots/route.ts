import { apiError, apiOk, clientIp, rateLimit } from '@/lib/api';
import { availableSlots, schedulingReady } from '@/lib/scheduling';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Open consultation slots, straight from the owner's calendar. */
export async function GET(request: Request) {
  const limit = rateLimit(`slots:${clientIp(request)}`, { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return apiError('Too many requests.', 429);
  if (!(await schedulingReady())) return apiOk({ ready: false, slots: [] });
  try {
    return apiOk({ ready: true, slots: await availableSlots(40) });
  } catch (e) {
    console.error('[meetings/slots]', e);
    return apiOk({ ready: false, slots: [] });
  }
}
