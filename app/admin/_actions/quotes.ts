'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { requireRole } from '@/lib/auth';
import { DEFAULT_CATALOG } from '@/lib/quotes/catalog-data';
import {
  acceptQuote,
  createQuote,
  dateIN,
  deliverQuote,
  ensureClient,
  getAddons,
  inr,
  newToken,
  quoteUrl,
  statement,
  summarise,
  updateQuoteItems,
} from '@/lib/quotes/engine';
import type { QuoteRow } from '@/lib/quotes/types';
import { sendNotice } from '@/lib/email';
import { SETTINGS_TAG } from '@/lib/settings';
import { serviceClient } from '@/lib/supabase';

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('Supabase service key is not configured.');
  return supabase;
}

const uuid = z.string().uuid();

async function load(id: string): Promise<QuoteRow> {
  const { data } = await db().from('quotes').select('*').eq('id', id).maybeSingle();
  if (!data) throw new Error('Quotation not found.');
  return data;
}

const touch = (id?: string) => {
  revalidatePath('/admin/quotes');
  if (id) revalidatePath(`/admin/quotes/${id}`);
};

/* ------------------------------------------------------- build and send --- */

const ItemSchema = z.object({
  serviceId: z.string().max(40).optional(),
  variantId: z.string().max(40).optional(),
  qty: z.coerce.number().int().min(1).max(99).optional(),
  unitPrice: z.coerce.number().min(0).max(1e8).optional(),
  name: z.string().max(160).optional(),
  unit: z.string().max(60).optional(),
  period: z.enum(['once', 'month', 'year']).optional(),
  note: z.string().max(300).optional(),
});

const SaveSchema = z.object({
  id: uuid.optional().or(z.literal('')),
  name: z.string().trim().min(2, 'Name is required.').max(160),
  email: z.string().trim().toLowerCase().email().max(320).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  enquiry_id: uuid.optional().or(z.literal('')),
  client_id: uuid.optional().or(z.literal('')),
  requirement: z.string().trim().max(4000).optional(),
  note_to_client: z.string().trim().max(1500).optional(),
  kind: z.enum(['indicative', 'final']).default('indicative'),
  validDays: z.coerce.number().int().min(1).max(180).default(14),
  discount: z.string().trim().optional(),
  items: z.string().min(2),
  intent: z.enum(['draft', 'send']).default('draft'),
});

export async function saveQuote(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  const parsed = SaveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/admin/quotes?error=invalid');
  const d = parsed.data;
  let items: z.infer<typeof ItemSchema>[];
  try {
    items = z.array(ItemSchema).min(1).max(40).parse(JSON.parse(d.items));
  } catch {
    redirect('/admin/quotes?error=items');
  }
  const discount =
    d.discount !== undefined && d.discount !== '' ? Math.max(0, Number(d.discount)) : undefined;

  let q: QuoteRow;
  if (d.id) {
    q = await updateQuoteItems(d.id, items, {
      name: d.name,
      email: d.email || null,
      phone: d.phone || null,
      company: d.company || null,
      note_to_client: d.note_to_client || null,
      kind: d.kind,
      valid_until: new Date(Date.now() + d.validDays * 86_400_000).toISOString(),
      ...(discount !== undefined ? { discount } : {}),
    });
    await db()
      .from('quotes')
      .update({ requirement: d.requirement || null })
      .eq('id', q.id);
  } else {
    q = await createQuote({
      source: 'console',
      draft: true,
      allowOverride: true,
      name: d.name,
      email: d.email || null,
      phone: d.phone || null,
      company: d.company || null,
      requirement: d.requirement || null,
      enquiryId: d.enquiry_id || null,
      clientId: d.client_id || null,
      noteToClient: d.note_to_client || null,
      kind: d.kind,
      validDays: d.validDays,
      discount,
      items,
      createdBy: profile.email,
    });
  }
  await audit(profile.email, d.id ? 'quote.update' : 'quote.create', 'quotes', q.id, {
    number: q.number,
  });

  let sent = '';
  if (d.intent === 'send') {
    const r = await deliverQuote(q);
    sent =
      [r.email ? 'email' : '', r.whatsapp ? 'whatsapp' : ''].filter(Boolean).join('+') || 'none';
    if (sent === 'none') await recordFailure(q.id, r.error);
  }
  touch(q.id);
  redirect(`/admin/quotes/${q.id}${sent ? `?sent=${sent}` : '?saved=1'}`);
}

/** Keeps the real reason a send failed where the console can show it. */
async function recordFailure(id: string, error?: string) {
  await db()
    .from('quotes')
    .update({ hold_reason: `Not delivered: ${(error ?? 'unknown error').slice(0, 200)}` })
    .eq('id', id);
}

/** Releases a held request, or sends a quotation again. */
export async function sendQuoteNow(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('id'));
  if (!id.success) return;
  const q = await load(id.data);
  const r = await deliverQuote(q);
  await audit(profile.email, 'quote.send', 'quotes', q.id, {
    email: r.email,
    whatsapp: r.whatsapp,
    error: r.error,
  });
  const sent =
    [r.email ? 'email' : '', r.whatsapp ? 'whatsapp' : ''].filter(Boolean).join('+') || 'none';
  if (sent === 'none') await recordFailure(q.id, r.error);
  touch(q.id);
  redirect(`/admin/quotes/${q.id}?sent=${sent}`);
}

export async function setQuoteStatus(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('id'));
  const status = z
    .enum(['void', 'accepted', 'declined', 'draft'])
    .safeParse(formData.get('status'));
  if (!id.success || !status.success) return;
  const q = await load(id.data);
  if (status.data === 'accepted') await acceptQuote(q, 'Recorded by the team');
  else
    await db()
      .from('quotes')
      .update({ status: status.data, updated_at: new Date().toISOString() })
      .eq('id', q.id);
  await audit(profile.email, `quote.${status.data}`, 'quotes', q.id);
  touch(q.id);
}

/** A new private link and a fresh clock. The old link stops working at once. */
export async function renewQuote(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('id'));
  if (!id.success) return;
  const days = Number(formData.get('days')) || 14;
  await db()
    .from('quotes')
    .update({
      token: newToken(),
      view_count: 0,
      first_viewed_at: null,
      last_viewed_at: null,
      valid_until: new Date(Date.now() + Math.min(180, days) * 86_400_000).toISOString(),
      status: 'sent',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id.data);
  await audit(profile.email, 'quote.renew', 'quotes', id.data);
  touch(id.data);
}

export async function deleteQuote(formData: FormData): Promise<void> {
  const profile = await requireRole('admin');
  const id = uuid.safeParse(formData.get('id'));
  if (!id.success) return;
  await db().from('quotes').delete().eq('id', id.data);
  await audit(profile.email, 'quote.delete', 'quotes', id.data);
  touch();
  redirect('/admin/quotes');
}

/* ------------------------------------------------------------- add-ons --- */

const AddonSchema = z.object({
  quote_id: uuid,
  title: z.string().trim().min(2, 'Describe the add-on.').max(200),
  details: z.string().trim().max(1000).optional(),
  amount: z.coerce.number().min(0).max(1e8),
  requested_by: z.enum(['team', 'client']).default('client'),
  already_agreed: z.string().optional(),
});

/**
 * Work asked for after the quotation. Recorded with its price; if the client
 * has not yet agreed, they are asked to approve it from their quotation page.
 */
export async function addAddon(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  const parsed = AddonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  const agreed = d.already_agreed === 'on';
  const { data: row } = await db()
    .from('quote_addons')
    .insert({
      quote_id: d.quote_id,
      title: d.title,
      details: d.details || null,
      amount: d.amount,
      requested_by: d.requested_by,
      status: agreed ? 'approved' : 'proposed',
      decided_at: agreed ? new Date().toISOString() : null,
    })
    .select('id')
    .single();
  await audit(profile.email, 'quote.addon.add', 'quote_addons', row?.id, {
    title: d.title,
    amount: d.amount,
    agreed,
  });
  if (!agreed && formData.get('notify') === 'on') await askApproval(d.quote_id, d.title, d.amount);
  touch(d.quote_id);
}

async function askApproval(quoteId: string, title: string, amount: number) {
  const q = await load(quoteId);
  if (!q.email || q.email.endsWith('.invalid')) return;
  await sendNotice({
    to: q.email,
    subject: `Approval needed: ${title} (${q.number})`,
    eyebrow: 'Additional work',
    heading: `${q.name.split(' ')[0]}, we need your approval`,
    paragraphs: [
      `You asked for something beyond your original quotation: ${title}.`,
      `We would charge ${inr(amount)} for it. We only begin once you approve — you can do that on your quotation page, where it will also appear on your running statement.`,
    ],
    cta: { label: 'Review and approve', href: quoteUrl(q.token) },
  });
}

export async function setAddonStatus(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('id'));
  const status = z.enum(['approved', 'declined', 'proposed']).safeParse(formData.get('status'));
  if (!id.success || !status.success) return;
  const { data: a } = await db()
    .from('quote_addons')
    .update({
      status: status.data,
      decided_at: status.data === 'proposed' ? null : new Date().toISOString(),
    })
    .eq('id', id.data)
    .select('quote_id')
    .maybeSingle();
  await audit(profile.email, `quote.addon.${status.data}`, 'quote_addons', id.data);
  if (a) touch(a.quote_id);
}

export async function removeAddon(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('id'));
  if (!id.success) return;
  const { data: a } = await db()
    .from('quote_addons')
    .delete()
    .eq('id', id.data)
    .neq('status', 'billed')
    .select('quote_id')
    .maybeSingle();
  await audit(profile.email, 'quote.addon.remove', 'quote_addons', id.data);
  if (a) touch(a.quote_id);
}

export async function remindAddon(formData: FormData): Promise<void> {
  await requireRole('editor');
  const id = uuid.safeParse(formData.get('id'));
  if (!id.success) return;
  const { data: a } = await db().from('quote_addons').select('*').eq('id', id.data).maybeSingle();
  if (a) await askApproval(a.quote_id, a.title, Number(a.amount));
}

/* ------------------------------------------------------------- invoice --- */

/**
 * The final invoice: the original quotation, then every approved add-on, each
 * with its date and price — so the bill shows exactly what was asked for
 * beyond the first quotation. Recurring services are billed monthly or
 * yearly, not here.
 */
export async function createInvoiceFromQuote(formData: FormData): Promise<void> {
  const profile = await requireRole('editor');
  const id = uuid.safeParse(formData.get('id'));
  const number = z.string().trim().min(2).max(40).safeParse(formData.get('number'));
  if (!id.success || !number.success) return;
  const due = String(formData.get('due_on') ?? '');
  const tax = Math.max(0, Number(formData.get('tax_amount')) || 0);
  const q = await load(id.data);
  const addons = await getAddons(q.id);
  const st = statement(q, addons);
  const clientId = await ensureClient(q);
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    `Quotation ${q.number}${q.accepted_at ? `, accepted ${dateIN(q.accepted_at)}` : ''}`,
    ...q.items
      .filter((i) => i.period === 'once')
      .map(
        (i) =>
          `  • ${i.name}${i.label ? ` (${i.label})` : ''}${i.qty > 1 ? ` ×${i.qty}` : ''} — ${inr(i.amount)}`,
      ),
    ...(st.base.discount ? [`  • Combination saving — −${inr(st.base.discount)}`] : []),
    `  Quotation total — ${inr(st.base.dueNow)}`,
    ...(st.approved.length
      ? [
          'Added after the quotation, at the client’s request and with their approval:',
          ...st.approved.map(
            (a) =>
              `  • ${dateIN(a.decided_at ?? a.created_at)} — ${a.title} — ${inr(Number(a.amount))}`,
          ),
          `  Add-ons total — ${inr(st.addonTotal)}`,
        ]
      : []),
    'Government fees and recurring services are billed separately.',
  ];
  const { data: inv, error } = await db()
    .from('invoices')
    .insert({
      client_id: clientId,
      number: number.data,
      description:
        `${summarise(q.items.filter((i) => i.period === 'once'))}${st.approved.length ? ` + ${st.approved.length} add-on${st.approved.length === 1 ? '' : 's'}` : ''}`.slice(
          0,
          480,
        ),
      issued_on: today,
      due_on: /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : null,
      amount: st.grand,
      tax_amount: tax,
      status: 'draft',
      notes: lines.join('\n'),
    })
    .select('id')
    .single();
  if (error || !inv) redirect(`/admin/quotes/${q.id}?invoice=failed`);
  await db()
    .from('quote_addons')
    .update({ status: 'billed', billed_at: new Date().toISOString() })
    .eq('quote_id', q.id)
    .eq('status', 'approved');
  await db().from('quotes').update({ invoice_id: inv.id }).eq('id', q.id);
  await audit(profile.email, 'quote.invoice', 'invoices', inv.id, {
    quote: q.number,
    amount: st.grand,
  });
  touch(q.id);
  revalidatePath('/admin/invoices');
  redirect(`/admin/quotes/${q.id}?invoice=created`);
}

/* ------------------------------------------------------------- pricing --- */

const PricingSchema = z.object({
  service_id: z.string().min(2).max(40),
  note: z.string().trim().max(400).optional(),
  value_note: z.string().trim().max(400).optional(),
  related: z.string().trim().max(300).optional(),
});

export async function savePricing(formData: FormData): Promise<void> {
  const profile = await requireRole('admin');
  const parsed = PricingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  const svc = DEFAULT_CATALOG.find((s) => s.id === d.service_id);
  if (!svc) return;

  const prices: Record<string, number> = {};
  for (const v of svc.variants) {
    const raw = String(formData.get(`price_${v.id}`) ?? '').trim();
    if (raw === '') continue;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0 && n !== v.price) prices[v.id] = Math.round(n);
  }
  svc.govFees.forEach((g, i) => {
    const raw = String(formData.get(`gov_${i}`) ?? '').trim();
    if (raw === '') return;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0 && n !== g.amount) prices[`gov:${i}`] = Math.round(n);
  });
  const ids = new Set(DEFAULT_CATALOG.map((s) => s.id));
  const related = (d.related ?? '').split(/[\s,]+/).filter((x) => ids.has(x) && x !== svc.id);
  const sameRelated = related.join(',') === svc.related.join(',');

  await db()
    .from('quote_services')
    .upsert({
      service_id: svc.id,
      prices: prices as never,
      note: d.note && d.note !== svc.note ? d.note : null,
      value_note: d.value_note && d.value_note !== svc.value ? d.value_note : null,
      related: sameRelated || !related.length ? null : related,
      active: formData.get('active') === 'on',
      updated_at: new Date().toISOString(),
    });
  await audit(profile.email, 'pricing.save', 'quote_services', svc.id, { prices });
  revalidatePath('/admin/pricing');
}

export async function resetPricing(formData: FormData): Promise<void> {
  const profile = await requireRole('admin');
  const id = z.string().min(2).max(40).safeParse(formData.get('service_id'));
  if (!id.success) return;
  await db().from('quote_services').delete().eq('service_id', id.data);
  await audit(profile.email, 'pricing.reset', 'quote_services', id.data);
  revalidatePath('/admin/pricing');
}

/* ------------------------------------------------------------ settings --- */

const SettingsSchema = z.object({
  mode: z.enum(['auto', 'qualified', 'manual']),
  minScore: z.coerce.number().int().min(0).max(100),
  validDays: z.coerce.number().int().min(1).max(180),
  maxViews: z.coerce.number().int().min(1).max(200),
  blockedTerms: z.string().max(4000),
  comboMinServices: z.coerce.number().int().min(2).max(10),
  comboPercent: z.coerce.number().min(0).max(30),
  taxNote: z.string().trim().min(5).max(500),
});

export async function saveQuoteSettings(formData: FormData): Promise<void> {
  const profile = await requireRole('admin');
  const parsed = SettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await db()
    .from('site_settings')
    .upsert({ key: 'quotes', value: parsed.data, updated_at: new Date().toISOString() } as never);
  // Follow-ups live with the other automations.
  const { data: cur } = await db()
    .from('site_settings')
    .select('value')
    .eq('key', 'automations')
    .maybeSingle();
  await db()
    .from('site_settings')
    .upsert({
      key: 'automations',
      value: {
        ...((cur?.value as Record<string, unknown>) ?? {}),
        quoteFollowUps: formData.get('followUps') === 'on',
      },
      updated_at: new Date().toISOString(),
    } as never);
  await audit(profile.email, 'quotes.settings', 'site_settings', 'quotes', {
    mode: parsed.data.mode,
  });
  revalidateTag(SETTINGS_TAG);
  revalidatePath('/admin/quotes');
}
