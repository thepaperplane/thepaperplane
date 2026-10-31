import { z } from 'zod';
import { apiError, apiOk, clientIp, rateLimit, readJson, sameOrigin } from '@/lib/api';
import {
  acceptQuote,
  acknowledgeFinalRequest,
  addServiceToQuote,
  hashIp,
  logEvent,
  notifyOwner,
  openQuote,
  requestAddonFromSuggestion,
  requestFinal,
  sendChecklist,
  summarise,
} from '@/lib/quotes/engine';
import { serviceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('accept'), name: z.string().trim().min(2).max(160) }),
  z.object({ action: z.literal('request_final'), note: z.string().trim().max(600).optional() }),
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
  const open = q.status === 'sent' || q.status === 'viewed' || q.status === 'final_requested';
  const d = body.data;

  switch (d.action) {
    case 'request_final': {
      // An automated quotation is only an estimate: the client asks, the team approves.
      if (q.kind === 'final') return apiError('This is already your final quotation.', 409);
      if (!open) return apiError('This quotation can no longer be changed.', 409);
      if (q.status === 'final_requested') return apiOk({ ok: true });
      const updated = await requestFinal(q, d.note);
      await acknowledgeFinalRequest(updated);
      await notifyOwner(
        `Final quotation requested: ${q.name}`,
        [
          `${q.number} · ${summarise(q.items)}`,
          `${q.name} · ${q.email ?? ''} ${q.phone ?? ''}`.trim(),
          d.note ? `They wrote: ${d.note}` : '',
          q.items.some((i) => i.addedByClient)
            ? `Added by the client: ${q.items
                .filter((i) => i.addedByClient)
                .map((i) => i.name)
                .join(', ')}`
            : '',
          'Call them, confirm the scope and amounts, then approve and issue the final quotation. Reply due within one working day.',
        ].filter(Boolean),
        `/admin/quotes/${q.id}`,
      );
      return apiOk({ ok: true });
    }
    case 'accept': {
      if (q.kind !== 'final')
        return apiError(
          'This is an automated quotation with starting prices. Ask for your final quotation first; you can accept that once we have approved and sent it.',
          409,
        );
      if (q.status !== 'sent' && q.status !== 'viewed')
        return apiError('This quotation can no longer be accepted.', 409);
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
      await logEvent(q.id, 'client', 'declined', d.reason);
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
      await logEvent(q.id, 'client', 'message_from_client', d.text);
      await notifyOwner(
        `Message on quotation ${q.number} from ${q.name}`,
        [d.text, '', `${q.email ?? ''} ${q.phone ?? ''}`.trim()],
        `/admin/quotes/${q.id}`,
      );
      return apiOk({ ok: true });
    }
    case 'upsell': {
      try {
        // On a final or accepted quotation nothing in it changes: the request
        // becomes an add-on the team prices and the client then approves.
        if (q.kind === 'final' || q.status === 'accepted') {
          if (q.status !== 'accepted' && !open)
            return apiError('This quotation can no longer be changed.', 409);
          const r = await requestAddonFromSuggestion(q, d.serviceId);
          if (r.created)
            await notifyOwner(
              `${q.name} asked for an add-on on ${q.number}`,
              [
                `Asked for: ${r.title}`,
                'Set its price on the quotation; they approve it from their page.',
              ],
              `/admin/quotes/${q.id}`,
            );
          return apiOk({ ok: true });
        }
        if (!open) return apiError('This quotation can no longer be changed.', 409);
        const updated = await addServiceToQuote(q, d.serviceId);
        if (updated !== q) {
          await notifyOwner(
            `${q.name} added a service to quotation ${q.number}`,
            [
              `Added: ${updated.items.at(-1)?.name} (shown to them as a starting price only)`,
              `Now: ${summarise(updated.items)}`,
              'Price it in the final quotation after you confirm the scope with them.',
            ],
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
      if (Number(addon.amount) === 0 && addon.requested_by === 'client')
        return apiError('We are still pricing this. We will tell you as soon as it is ready.', 409);
      await supabase
        .from('quote_addons')
        .update({
          status: d.decision === 'approve' ? 'approved' : 'declined',
          decided_at: new Date().toISOString(),
        })
        .eq('id', addon.id);
      await logEvent(
        q.id,
        'client',
        d.decision === 'approve' ? 'addon_approved' : 'addon_declined',
        `${addon.title} — ₹${Number(addon.amount).toLocaleString('en-IN')}`,
      );
      await notifyOwner(
        `${q.name} ${d.decision === 'approve' ? 'approved' : 'declined'} an add-on`,
        [`${q.number}: ${addon.title} — ₹${Number(addon.amount).toLocaleString('en-IN')}`],
        `/admin/quotes/${q.id}`,
      );
      return apiOk({ ok: true });
    }
  }
}
