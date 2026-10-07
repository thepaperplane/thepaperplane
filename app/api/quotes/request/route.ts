import { after } from 'next/server';
import { z } from 'zod';
import { apiError, apiOk, clientIp, rateLimit, readJson, sameOrigin } from '@/lib/api';
import { autoPushLead } from '@/lib/integrations/zoho';
import { createQuote, deliverQuote, notifyOwner, summarise } from '@/lib/quotes/engine';
import { serviceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const Schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(320),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  message: z.string().trim().max(3000).optional().or(z.literal('')),
  timeline: z.enum(['', 'urgent', 'month', 'quarter', 'exploring']).optional(),
  services: z
    .array(
      z.object({
        id: z.string().trim().max(40),
        variant: z.string().trim().max(40).optional(),
        qty: z.coerce.number().int().min(1).max(20).optional(),
      }),
    )
    .min(1, 'Choose at least one service.')
    .max(10),
  src: z
    .object({
      source: z.string().max(80).optional(),
      medium: z.string().max(80).optional(),
      campaign: z.string().max(120).optional(),
    })
    .optional(),
  /** Honeypot. */
  website: z.string().max(200).optional(),
});

const clean = (v?: string) => (v ? v.replace(/[^\w .:/-]/g, '').slice(0, 120) : '');

/**
 * Someone asks for a quotation. The answer to the browser never contains a
 * price or the link: the quotation goes to the address they gave, so the
 * request itself is the proof that they are a real person with a real inbox.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError('Invalid request.', 403);
  const limit = rateLimit(`quote:${clientIp(request)}`, { limit: 4, windowMs: 600_000 });
  if (!limit.ok)
    return apiError('Too many requests. Please try again in a few minutes.', 429, {
      retryAfter: limit.retryAfter,
    });

  const body = await readJson(request);
  if (!body) return apiError('Invalid request body.');
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Please check the form.');
  const d = parsed.data;
  if (d.website) return apiOk({ status: 'sent', email: d.email }); // honeypot: no signal to bots

  const supabase = serviceClient();
  if (!supabase)
    return apiError('Quotations are unavailable right now. Please message us instead.', 503);

  try {
    const utm = {
      source: clean(d.src?.source),
      medium: clean(d.src?.medium),
      campaign: clean(d.src?.campaign),
    };
    const requirement = d.message || '';

    // The enquiry first, so the lead is on file even if the quotation fails.
    const { data: enquiry } = await supabase
      .from('enquiries')
      .insert({
        name: d.name,
        email: d.email,
        phone: d.phone || null,
        company: d.company || null,
        service_id: null,
        message:
          `Quotation request via the website.\nServices: ${d.services.map((s) => s.id).join(', ')}\n${requirement}`.trim(),
        state: 'new',
        user_agent: request.headers.get('user-agent')?.slice(0, 400) ?? null,
        referrer: 'quote-request',
      })
      .select('id')
      .single();
    if (enquiry?.id) {
      await supabase
        .from('enquiry_meta')
        .insert({
          enquiry_id: enquiry.id,
          utm_source: utm.source || null,
          utm_medium: utm.medium || null,
          utm_campaign: utm.campaign || null,
          landing_path: '/get-quote',
          timeline: d.timeline || null,
        })
        .then(
          () => undefined,
          () => undefined,
        );
      after(() => autoPushLead(enquiry.id));
    }

    const q = await createQuote({
      source: 'website',
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      company: d.company || null,
      requirement,
      answers: { timeline: d.timeline ?? '', services: d.services },
      utm: Object.fromEntries(Object.entries(utm).filter(([, v]) => v)),
      enquiryId: enquiry?.id ?? null,
      items: d.services.map((s) => ({ serviceId: s.id, variantId: s.variant, qty: s.qty })),
    });

    let sent = false;
    if (q.status === 'sent') {
      const r = await deliverQuote(q, { skipWhatsApp: true });
      sent = r.email;
      if (!sent) {
        await supabase
          .from('quotes')
          .update({ status: 'pending_review', hold_reason: 'The email could not be delivered' })
          .eq('id', q.id);
        q.hold_reason = 'The email could not be delivered';
      }
    }

    after(() =>
      notifyOwner(
        sent
          ? `Quotation sent automatically: ${q.name}`
          : `Quotation waiting for your review: ${q.name}`,
        [
          `${q.number} · ${summarise(q.items)}`,
          `${q.name} · ${q.email}${q.phone ? ` · ${q.phone}` : ''}${q.company ? ` · ${q.company}` : ''}`,
          q.requirement ? `They wrote: ${q.requirement}` : '',
          `Score ${q.score}.${q.hold_reason ? ` Held because: ${q.hold_reason}.` : ''}`,
        ].filter(Boolean),
        `/admin/quotes/${q.id}`,
      ),
    );
    return apiOk({ status: sent ? 'sent' : 'review', email: d.email });
  } catch (e) {
    console.error('[quotes] request failed', e instanceof Error ? e.message : e);
    return apiError(
      'We could not prepare your quotation just now. Please message us on WhatsApp and we will send it.',
      500,
    );
  }
}
