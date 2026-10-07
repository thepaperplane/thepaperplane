import { z } from 'zod';
import { apiError, apiOk, clientIp, rateLimit, readJson, sameOrigin } from '@/lib/api';
import {
  acceptQuote,
  addServiceToQuote,
  hashIp,
  notifyOwner,
  openQuote,
  sendChecklist,
  summarise,
} from '@/lib/quotes/engine';
import { serviceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('accept'), name: z.string().trim().min(2).max(160) }),
  z.object({ action: z.literal('decline'), reason: z.string().trim().max(600).optional() }),
  z.object({ action: z.literal('message'), text: z.string().trim().min(2).max(1500) }),
  z.object({ action: z.literal('upsell'), serviceId: z.string().trim().max(40) }),
  z.object({
    action: z.literal('addon'),
    id: z.string().uuid(),
    decision: z.enum(['approve', 'decline']),
  }),
]);

/** Everything a client can do on their own quotation page. The link is the credential. */
export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!sameOrigin(request)) return apiError('Invalid request.', 403);
  const { token } = await ctx.params;
  const limit = rateLimit(`quote-act:${clientIp(request)}:${token.slice(0, 8)}`, {
    limit: 20,
    windowMs: 600_000,
  });
  if (!limit.ok) return apiError('Too many actions. Please wait a few minutes.', 429);

  const body = Body.safeParse(await readJson(request));
  if (!body.success) return apiError('Please check what you entered.');
  const access = await openQuote(token, { ipHash: hashIp(clientIp(request)), record: false });
  if (!access.ok) return apiError('This quotation is no longer available.', 410);
  const q = access.quote;
  const supabase = serviceClient();
  if (!supabase) return apiError('Unavailable right now.', 503);
  const open = q.status === 'sent' || q.status === 'viewed';
  const d = body.data;

  switch (d.action) {
    case 'accept': {
      if (!open) return apiError('This quotation can no longer be accepted.', 409);
      await acceptQuote(q, d.name);
      // The list of what we need, straight away — they are at their most willing right now.
      await sendChecklist({ ...q, status: 'accepted' }).catch(() => undefined);
      await notifyOwner(
        `Quotation accepted: ${q.name}`,
        [
          `${q.number} · ${summarise(q.items)}`,
          `Accepted by: ${d.name}. ${q.email ?? ''} ${q.phone ?? ''}`.trim(),
          'A client record has been created and onboarding started. Call them to confirm the final scope.',
        ],
        `/admin/quotes/${q.id}`,
      );
      return apiOk({ ok: true });
    }
    case 'decline': {
      if (!open) return apiError('This quotation can no longer be changed.', 409);
      await supabase
        .from('quotes')
        .update({ status: 'declined', decline_reason: d.reason ?? null })
        .eq('id', q.id);
      await notifyOwner(
        `Quotation declined: ${q.name}`,
        [
          `${q.number} · ${summarise(q.items)}`,
          d.reason ? `Reason: ${d.reason}` : 'No reason given.',
        ],
        `/admin/quotes/${q.id}`,
      );
      return apiOk({ ok: true });
    }
    case 'message': {
      await notifyOwner(
        `Message on quotation ${q.number} from ${q.name}`,
        [d.text, '', `${q.email ?? ''} ${q.phone ?? ''}`.trim()],
        `/admin/quotes/${q.id}`,
      );
      return apiOk({ ok: true });
    }
    case 'upsell': {
      if (!open) return apiError('This quotation can no longer be changed.', 409);
      try {
        const updated = await addServiceToQuote(q, d.serviceId);
        if (updated !== q) {
          await notifyOwner(
            `${q.name} added a service to quotation ${q.number}`,
            [`Added: ${updated.items.at(-1)?.name}`, `Now: ${summarise(updated.items)}`],
            `/admin/quotes/${q.id}`,
          );
        }
        return apiOk({ ok: true });
      } catch {
        return apiError('That service could not be added.', 400);
      }
    }
    case 'addon': {
      const { data: addon } = await supabase
        .from('quote_addons')
        .select('*')
        .eq('id', d.id)
        .eq('quote_id', q.id)
        .maybeSingle();
      if (!addon || addon.status !== 'proposed') return apiError('Already decided.', 409);
      await supabase
        .from('quote_addons')
        .update({
          status: d.decision === 'approve' ? 'approved' : 'declined',
          decided_at: new Date().toISOString(),
        })
        .eq('id', addon.id);
      await notifyOwner(
        `${q.name} ${d.decision === 'approve' ? 'approved' : 'declined'} an add-on`,
        [`${q.number}: ${addon.title} — ₹${Number(addon.amount).toLocaleString('en-IN')}`],
        `/admin/quotes/${q.id}`,
      );
      return apiOk({ ok: true });
    }
  }
}
