import { after } from 'next/server';
import { z } from 'zod';
import { apiError, apiOk, clientIp, rateLimit, readJson } from '@/lib/api';
import { serviceClient } from '@/lib/supabase';
import { sendEnquiryNotification } from '@/lib/email';
import { autoPushLead } from '@/lib/integrations/zoho';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ContactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(320),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  serviceId: z.string().trim().max(80).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Please tell us a little more.').max(5000),
  budget: z.enum(['', 'under-25k', '25k-75k', '75k-2l', '2l-plus', 'retainer']).optional(),
  timeline: z.enum(['', 'urgent', 'month', 'quarter', 'exploring']).optional(),
  landing: z.string().max(200).optional(),
  utmSource: z.string().max(80).optional(),
  utmMedium: z.string().max(80).optional(),
  utmCampaign: z.string().max(120).optional(),
  /** Honeypot. Any value means a bot filled a field humans never see. */
  website: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const limit = rateLimit(`contact:${clientIp(request)}`, { limit: 4, windowMs: 300_000 });
  if (!limit.ok) {
    return apiError(
      'Too many messages sent. Please try again shortly, or email us directly.',
      429,
      {
        retryAfter: limit.retryAfter,
      },
    );
  }

  const body = await readJson(request);
  if (!body) return apiError('Invalid request body.');

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Please check the form and try again.');
  }

  const { name, email, phone, company, serviceId, message, website } = parsed.data;
  const meta = parsed.data;

  // Honeypot: accept silently so bots get no signal.
  if (website) {
    return apiOk({ message: 'Thank you — we will be in touch within one working day.' });
  }

  const supabase = serviceClient();

  if (supabase) {
    const { data: inserted, error } = await supabase
      .from('enquiries')
      .insert({
        name,
        email,
        phone: phone || null,
        company: company || null,
        service_id: serviceId || null,
        message,
        state: 'new',
        user_agent: request.headers.get('user-agent')?.slice(0, 400) ?? null,
        referrer: request.headers.get('referer')?.slice(0, 400) ?? null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[contact] insert failed', error);
      return apiError(
        'We could not record your message. Please email us directly so nothing is lost.',
        500,
      );
    }

    // Attribution and qualification, beside the enquiry. Best-effort: the
    // enquiry itself is already safe.
    const clean = (v?: string) => (v ? v.replace(/[^\w .:/-]/g, '').slice(0, 120) : null);
    if (inserted?.id) {
      const enquiryId = inserted.id;
      // Into Zoho CRM too, if the owner has switched that on — after the
      // visitor has their answer.
      after(() => autoPushLead(enquiryId));
      await supabase
        .from('enquiry_meta')
        .insert({
          enquiry_id: inserted.id,
          utm_source: clean(meta.utmSource),
          utm_medium: clean(meta.utmMedium),
          utm_campaign: clean(meta.utmCampaign),
          landing_path: meta.landing?.startsWith('/') ? clean(meta.landing) : null,
          budget: meta.budget || null,
          timeline: meta.timeline || null,
        })
        .then(
          () => undefined,
          () => undefined,
        );
    }
  } else {
    // No database configured. Never return a cheerful "thank you" we cannot
    // honour — a silently dropped enquiry is a lost client. Attempt the
    // notification email, and if that is unavailable too, say so plainly and
    // hand over a channel that definitely works.
    console.warn('[contact] Supabase not configured; enquiry not persisted', { email });

    const notified = await sendEnquiryNotification({
      name,
      email,
      phone,
      company,
      serviceId,
      message,
    }).catch(() => ({ sent: false }));

    if (!notified.sent) {
      return apiError(
        'We could not deliver your message right now. Please email contact@thepaperplane.co.in or message us on WhatsApp — we do not want to lose it.',
        503,
      );
    }

    return apiOk({ message: 'Thank you — we will be in touch within one working day.' });
  }

  // Notification is best-effort: the enquiry is already safely stored, so a
  // mail provider outage must not surface as a failure to the sender.
  await sendEnquiryNotification({ name, email, phone, company, serviceId, message }).catch(
    (error) => console.error('[contact] notification failed', error),
  );

  return apiOk({
    message: 'Thank you — we will be in touch within one working day.',
  });
}
