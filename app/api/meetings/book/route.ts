import { after } from 'next/server';
import { z } from 'zod';
import { apiError, apiOk, clientIp, rateLimit, readJson } from '@/lib/api';
import { bookMeeting } from '@/lib/scheduling';
import { serviceClient } from '@/lib/supabase';
import { sendEnquiryNotification } from '@/lib/email';
import { autoPushLead } from '@/lib/integrations/zoho';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const Body = z.object({
  start: z.string().datetime(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  topic: z.string().trim().min(5, 'Tell us briefly what the call is about.').max(1500),
  website: z.string().max(200).optional(),
});

/**
 * Books a consultation from the website. The booking becomes an enquiry too,
 * so it shows in the pipeline, and the Google invitation (with the Meet
 * link) goes to the visitor's email from the owner's own calendar.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`book:${clientIp(request)}`, { limit: 3, windowMs: 600_000 });
  if (!limit.ok) return apiError('Too many bookings from here. Please try again later.', 429);

  const parsed = Body.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Please check the form and try again.');
  }
  const b = parsed.data;
  if (b.website) return apiOk({ ok: true, label: '', meetLink: null });

  const db = serviceClient();
  let enquiryId: string | null = null;
  if (db) {
    const { data } = await db
      .from('enquiries')
      .insert({
        name: b.name,
        email: b.email,
        phone: b.phone || null,
        message: `Consultation booked online.\n\n${b.topic}`,
        state: 'new',
        user_agent: request.headers.get('user-agent')?.slice(0, 400) ?? null,
        referrer: '/book',
      })
      .select('id')
      .single();
    enquiryId = data?.id ?? null;
  }

  try {
    const booked = await bookMeeting({
      start: b.start,
      name: b.name,
      email: b.email,
      phone: b.phone || null,
      topic: b.topic,
      source: 'website',
      enquiryId,
    });
    after(async () => {
      if (enquiryId) await autoPushLead(enquiryId);
      await sendEnquiryNotification({
        name: b.name,
        email: b.email,
        phone: b.phone || undefined,
        message: `Consultation booked for ${booked.label}.\n\n${b.topic}`,
      }).catch(() => undefined);
    });
    return apiOk({ ok: true, label: booked.label, meetLink: booked.meetLink });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : 'That time could not be booked.', 409);
  }
}
