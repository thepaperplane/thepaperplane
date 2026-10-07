import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { sendNotice } from '@/lib/email';
import {
  normaliseWaId,
  sendText,
  WINDOW_MS,
  whatsappConfigured,
} from '@/lib/integrations/whatsapp';
import { getSettings, type SiteSettings } from '@/lib/settings';
import { SITE } from '@/lib/site';
import { serviceClient } from '@/lib/supabase';
import { DEFAULT_CATALOG } from './catalog-data';
import { checklistFor } from './checklists';
import type {
  CatalogService,
  Period,
  PricedService,
  QuoteAddonRow,
  QuoteItem,
  QuoteRow,
  QuoteServiceRow,
  Totals,
} from './types';

/**
 * Quotations.
 *
 * Prices live in two places only: the default catalogue in code and the
 * owner's overrides in the database. Neither is ever rendered on a public
 * page. A price reaches a person inside a quotation addressed to them, behind
 * an unguessable link, and every amount on it is computed here on the server
 * from the catalogue — the browser never supplies one.
 */

function db() {
  const supabase = serviceClient();
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

/* ---------------------------------------------------------- catalogue ---- */

export async function getCatalog(): Promise<PricedService[]> {
  const supabase = serviceClient();
  const rows = new Map<string, QuoteServiceRow>();
  if (supabase) {
    const { data } = await supabase.from('quote_services').select('*');
    (data ?? []).forEach((r) => rows.set(r.service_id, r));
  }
  return DEFAULT_CATALOG.map((svc) => {
    const o = rows.get(svc.id);
    if (!o) return { ...svc, active: true };
    return {
      ...svc,
      active: o.active,
      note: o.note ?? svc.note,
      value: o.value_note ?? svc.value,
      related: o.related ?? svc.related,
      variants: svc.variants.map((v) => {
        const p = o.prices?.[v.id];
        return typeof p === 'number' && p >= 0 ? { ...v, price: p } : v;
      }),
      govFees: svc.govFees.map((g, i) => {
        const p = o.prices?.[`gov:${i}`];
        return typeof p === 'number' && p >= 0 ? { ...g, amount: p } : g;
      }),
    };
  });
}

export const defaultVariant = (svc: CatalogService) =>
  svc.variants.find((v) => v.id === svc.defaultVariant) ?? svc.variants[0]!;

export const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(n));

export const dateIN = (d: string | Date) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeZone: 'Asia/Kolkata' }).format(
    new Date(d),
  );

/* -------------------------------------------------------------- items ---- */

export type ItemInput = {
  serviceId?: string;
  variantId?: string;
  qty?: number;
  /** Console only: a negotiated amount. Never accepted from a public request. */
  unitPrice?: number;
  /** Custom lines only. */
  name?: string;
  unit?: string;
  period?: Period;
  note?: string;
};

const clampQty = (n: unknown) => Math.min(99, Math.max(1, Math.round(Number(n) || 1)));

export function buildItems(
  catalog: PricedService[],
  inputs: ItemInput[],
  opts: { allowOverride?: boolean; onlyActive?: boolean } = {},
): QuoteItem[] {
  const out: QuoteItem[] = [];
  const seen = new Set<string>();
  for (const [i, input] of inputs.entries()) {
    if (input.serviceId) {
      const svc = catalog.find((s) => s.id === input.serviceId);
      if (!svc || (opts.onlyActive && !svc.active)) continue;
      const variant = svc.variants.find((v) => v.id === input.variantId) ?? defaultVariant(svc);
      const dedupe = `${svc.id}:${variant.id}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      const qty = clampQty(input.qty);
      const unitPrice =
        opts.allowOverride && typeof input.unitPrice === 'number' && input.unitPrice >= 0
          ? input.unitPrice
          : variant.price;
      out.push({
        key: `${svc.id}-${variant.id}`,
        kind: 'service',
        serviceId: svc.id,
        variantId: variant.id,
        name: svc.name,
        label: variant.label,
        unit: svc.unit,
        qty,
        unitPrice,
        amount: unitPrice * qty,
        period: variant.period,
        from: svc.from,
        note: input.note || svc.note || undefined,
        value: svc.value || undefined,
        gov: svc.govFees
          .filter((g) => !g.variants || g.variants.includes(variant.id))
          .map((g) => ({
            label: g.label,
            amount: g.amount === null ? null : g.amount * qty,
            per: g.per,
            note: g.note,
          })),
      });
    } else if (opts.allowOverride && input.name?.trim()) {
      const unitPrice = Math.max(0, Number(input.unitPrice) || 0);
      const qty = clampQty(input.qty);
      out.push({
        key: `custom-${i}`,
        kind: 'custom',
        name: input.name.trim().slice(0, 160),
        label: '',
        unit: input.unit?.trim().slice(0, 60) || '',
        qty,
        unitPrice,
        amount: unitPrice * qty,
        period: input.period ?? 'once',
        from: false,
        note: input.note?.slice(0, 300),
      });
    }
  }
  return applyIncludes(catalog, out);
}

/**
 * A service that another chosen service already includes (the deed and firm
 * PAN inside a partnership registration, GST inside a company incorporation)
 * is not a separate line: it would charge the client twice for one piece of
 * work. It is dropped, and named on the line that includes it.
 */
export function applyIncludes(catalog: PricedService[], items: QuoteItem[]): QuoteItem[] {
  const names = new Map(catalog.map((s) => [s.id, s.name]));
  const included = new Set<string>();
  for (const it of items) {
    if (it.kind !== 'service' || !it.serviceId) continue;
    catalog.find((s) => s.id === it.serviceId)?.includes.forEach((x) => included.add(x));
  }
  return items
    .filter((it) => !(it.kind === 'service' && it.serviceId && included.has(it.serviceId)))
    .map((it) => {
      const svc = it.serviceId ? catalog.find((s) => s.id === it.serviceId) : undefined;
      return svc?.includes.length
        ? { ...it, includes: svc.includes.map((x) => names.get(x) ?? x) }
        : it;
    });
}

export function comboDiscount(items: QuoteItem[], s: SiteSettings['quotes']): number {
  if (!s.comboPercent || s.comboPercent <= 0) return 0;
  const services = items.filter((i) => i.kind === 'service' && i.period === 'once');
  if (services.length < s.comboMinServices) return 0;
  const once = services.reduce((n, i) => n + i.amount, 0);
  return Math.round((once * Math.min(s.comboPercent, 30)) / 100);
}

export function computeTotals(items: QuoteItem[], discount: number): Totals {
  const sum = (p: Period) => items.filter((i) => i.period === p).reduce((n, i) => n + i.amount, 0);
  const once = sum('once');
  return {
    once,
    month: sum('month'),
    year: sum('year'),
    discount,
    dueNow: Math.max(0, once - discount),
  };
}

/** Government charges across a quotation: the known amounts, and how many are still "at actual". */
export function govTotals(items: QuoteItem[]) {
  const lines = items.flatMap((i) => (i.gov ?? []).map((g) => ({ ...g, for: i.name })));
  const known = lines.filter((g) => g.amount !== null && g.amount > 0);
  return {
    lines,
    once: known.filter((g) => g.per === 'once').reduce((n, g) => n + (g.amount ?? 0), 0),
    year: known.filter((g) => g.per === 'year').reduce((n, g) => n + (g.amount ?? 0), 0),
    atActual: lines.filter((g) => g.amount === null).length,
  };
}

/** What the client has agreed to pay for one-time work, add-ons included. */
export function statement(q: Pick<QuoteRow, 'items' | 'discount'>, addons: QuoteAddonRow[]) {
  const base = computeTotals(q.items, Number(q.discount));
  const approved = addons.filter((a) => a.status === 'approved' || a.status === 'billed');
  const proposed = addons.filter((a) => a.status === 'proposed');
  const addonTotal = approved.reduce((n, a) => n + Number(a.amount), 0);
  return {
    base,
    approved,
    proposed,
    addonTotal,
    grand: base.dueNow + addonTotal,
  };
}

/* ----------------------------------------------------------- screening --- */

const FREE_MAIL = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.in',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'rediffmail.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
]);
const DISPOSABLE = new Set([
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
  'dispostable.com',
  'throwawaymail.com',
  'maildrop.cc',
  'fakeinbox.com',
]);

export function splitTerms(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 3);
}

export type Screen = { score: number; hold: string | null };

/**
 * Decides whether a request is sent straight away or waits for the owner.
 * The score is a rough read of how likely a request is to be a real prospect;
 * it only ever *holds* a request for a person to look at — nothing is
 * discarded, so a mistaken hold costs minutes, not a client.
 */
export async function screenRequest(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  answers?: Record<string, unknown>;
  source: QuoteRow['source'];
  items: QuoteItem[];
  utmSource?: string | null;
  settings: SiteSettings['quotes'];
}): Promise<Screen> {
  const s = input.settings;
  const email = (input.email ?? '').toLowerCase();
  const domain = email.split('@')[1] ?? '';
  let score = 0;
  let hold: string | null = null;

  if (domain && DISPOSABLE.has(domain)) hold = 'Disposable email address';
  else if (domain && !FREE_MAIL.has(domain)) score += 20;
  else if (domain) score += 8;

  const digits = (input.phone ?? '').replace(/\D/g, '');
  if (digits.length >= 10) score += 15;
  if (input.source === 'whatsapp') score += 15; // the number is verified by WhatsApp itself
  if (input.company && input.company.trim().length > 1) score += 10;
  const msg = (input.message ?? '').trim();
  if (msg.length > 40) score += 10;
  if (msg.length > 120) score += 5;
  const once = input.items.filter((i) => i.period === 'once').reduce((n, i) => n + i.amount, 0);
  const recurring = input.items
    .filter((i) => i.period !== 'once')
    .reduce((n, i) => n + i.amount, 0);
  if (once >= 10_000) score += 10;
  if (once >= 50_000) score += 10;
  if (recurring >= 1_000) score += 5;
  const timeline = String(input.answers?.timeline ?? '');
  if (timeline === 'urgent') score += 10;
  else if (timeline === 'month') score += 5;
  if (input.utmSource) score += 5;
  score = Math.min(100, score);

  if (!hold) {
    const terms = splitTerms(s.blockedTerms);
    const hay = [input.name, input.email, input.company, msg].join(' ').toLowerCase();
    const hit = terms.find((t) => hay.includes(t));
    if (hit) hold = `Matches a blocked term (“${hit}”)`;
  }

  if (!hold && email) {
    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { count } = await db()
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .ilike('email', email)
      .gte('created_at', since);
    if ((count ?? 0) >= 3) hold = 'Repeated requests from the same address today';
  }

  if (!hold && s.mode === 'manual') hold = 'Manual approval is switched on';
  if (!hold && s.mode === 'qualified' && score < s.minScore)
    hold = `Score ${score} is below the minimum of ${s.minScore}`;

  return { score, hold };
}

/* -------------------------------------------------------------- tokens --- */

export const newToken = () => randomBytes(18).toString('base64url');
export const validToken = (t: string) => /^[A-Za-z0-9_-]{20,40}$/.test(t);
export const quoteUrl = (token: string) => `${SITE.url}/q/${token}`;

export function hashIp(ip: string): string {
  return createHash('sha256')
    .update(`${process.env.ASSISTANT_SALT ?? 'pp'}:${ip}`)
    .digest('hex')
    .slice(0, 32);
}

async function nextNumber(offset = 0): Promise<string> {
  const ist = new Date(Date.now() + 5.5 * 3600_000);
  const yymm = `${String(ist.getUTCFullYear()).slice(2)}${String(ist.getUTCMonth() + 1).padStart(2, '0')}`;
  const prefix = `PP-Q-${yymm}-`;
  const { count } = await db()
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .like('number', `${prefix}%`);
  return `${prefix}${String((count ?? 0) + 1 + offset).padStart(3, '0')}`;
}

/* ------------------------------------------------------------ creation --- */

export type CreateInput = {
  source: QuoteRow['source'];
  name: string;
  email?: string | null;
  phone?: string | null;
  waId?: string | null;
  company?: string | null;
  requirement?: string | null;
  answers?: Record<string, unknown>;
  utm?: Record<string, string>;
  enquiryId?: string | null;
  clientId?: string | null;
  items: ItemInput[];
  noteToClient?: string | null;
  kind?: 'indicative' | 'final';
  createdBy?: string | null;
  /** Console: leave as a draft. Otherwise screened and sent. */
  draft?: boolean;
  discount?: number;
  validDays?: number;
  allowOverride?: boolean;
};

export async function createQuote(input: CreateInput): Promise<QuoteRow> {
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);
  const s = settings.quotes;
  const items = buildItems(catalog, input.items, {
    allowOverride: input.allowOverride,
    onlyActive: !input.allowOverride,
  });
  if (!items.length) throw new Error('Choose at least one service.');
  const discount =
    typeof input.discount === 'number' ? Math.max(0, input.discount) : comboDiscount(items, s);

  let status: QuoteRow['status'] = 'draft';
  let score = 0;
  let hold: string | null = null;
  if (!input.draft) {
    const screen = await screenRequest({
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      message: input.requirement,
      answers: input.answers,
      source: input.source,
      items,
      utmSource: input.utm?.source,
      settings: s,
    });
    score = screen.score;
    hold = screen.hold;
    status = hold ? 'pending_review' : 'sent';
  }

  const validUntil = new Date(Date.now() + (input.validDays ?? s.validDays) * 86_400_000);
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await db()
      .from('quotes')
      .insert({
        token: newToken(),
        number: await nextNumber(attempt),
        status,
        kind: input.kind ?? 'indicative',
        source: input.source,
        name: input.name.trim().slice(0, 160),
        email: input.email?.trim().toLowerCase() || null,
        phone: input.phone?.trim() || null,
        wa_id: input.waId || null,
        company: input.company?.trim() || null,
        enquiry_id: input.enquiryId ?? null,
        client_id: input.clientId ?? null,
        requirement: input.requirement?.slice(0, 4000) ?? null,
        answers: (input.answers ?? {}) as never,
        items: items as never,
        discount,
        note_to_client: input.noteToClient?.slice(0, 1500) || null,
        score,
        hold_reason: hold,
        utm: (input.utm ?? {}) as never,
        valid_until: validUntil.toISOString(),
        max_views: s.maxViews,
        created_by: input.createdBy ?? null,
      })
      .select('*')
      .single();
    if (!error && data) return data;
    if (error && error.code !== '23505') throw new Error(error.message);
  }
  throw new Error('Could not allocate a quote number. Please try again.');
}

/** Replaces a quote's items (console edit); recomputes the discount unless one is given. */
export async function updateQuoteItems(
  id: string,
  inputs: ItemInput[],
  patch: Partial<
    Pick<
      QuoteRow,
      'name' | 'email' | 'phone' | 'company' | 'note_to_client' | 'kind' | 'valid_until'
    >
  > & { discount?: number },
): Promise<QuoteRow> {
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);
  const items = buildItems(catalog, inputs, { allowOverride: true });
  if (!items.length) throw new Error('A quotation needs at least one line.');
  const discount =
    typeof patch.discount === 'number'
      ? Math.max(0, patch.discount)
      : comboDiscount(items, settings.quotes);
  const { discount: _d, ...rest } = patch;
  void _d;
  const { data, error } = await db()
    .from('quotes')
    .update({ ...rest, items: items as never, discount, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Could not save the quotation.');
  return data;
}

/* ------------------------------------------------------------ delivery --- */

async function whatsappIfOpen(to: string | null | undefined, text: string): Promise<boolean> {
  if (!to || !whatsappConfigured()) return false;
  const wa = normaliseWaId(to);
  if (!wa) return false;
  const { data: c } = await db()
    .from('wa_contacts')
    .select('last_inbound_at')
    .eq('wa_id', wa)
    .maybeSingle();
  // Free-form messages are only allowed inside Meta's 24-hour window, and
  // sending outside it costs money — so outside it the email is the delivery.
  if (!c?.last_inbound_at || Date.now() - new Date(c.last_inbound_at).getTime() >= WINDOW_MS)
    return false;
  try {
    const id = await sendText(wa, text);
    const now = new Date().toISOString();
    await db()
      .from('wa_messages')
      .insert({
        wa_message_id: id,
        wa_id: wa,
        direction: 'out',
        kind: 'text',
        body: text.slice(0, 4000),
        status: 'sent',
        sent_by: 'quotations',
        created_at: now,
      });
    await db().from('wa_contacts').update({ last_message_at: now }).eq('wa_id', wa);
    return true;
  } catch {
    return false;
  }
}

/** Emails (and, if the chat is open, WhatsApps) the quotation link. Prices are never in the message. */
export async function deliverQuote(
  q: QuoteRow,
  opts: { skipWhatsApp?: boolean } = {},
): Promise<{ email: boolean; whatsapp: boolean; error?: string }> {
  const url = quoteUrl(q.token);
  const first = q.name.split(' ')[0] || 'there';
  const until = dateIN(q.valid_until);
  let email = false;
  let error: string | undefined;
  if (!q.email || q.email.endsWith('.invalid')) error = 'This quotation has no email address.';
  else {
    const r = await sendNotice({
      to: q.email,
      subject: `Your quotation from ${SITE.name} (${q.number})`,
      eyebrow: 'Your quotation',
      heading: `${first}, your quotation is ready`,
      paragraphs: [
        'We have put together a personalised quotation from what you told us.',
        ...(q.note_to_client ? [q.note_to_client] : []),
        `Every business is different, so please read it as our starting estimate — we confirm the final figure once we understand your needs fully. The link is private to you and stays open until ${until}.`,
      ],
      cta: { label: 'View my quotation', href: url },
    });
    email = r.sent;
    if (!r.sent) error = r.error ?? 'The email service did not accept the message.';
  }
  const whatsapp = opts.skipWhatsApp
    ? false
    : await whatsappIfOpen(
        q.wa_id ?? q.phone,
        `Hello ${first}, your personalised quotation from ${SITE.name} is ready: ${url}\n\nEvery business is different, so it is our starting estimate; we confirm the final figure once we understand your needs fully. It is open until ${until}.`,
      );
  const via = [email ? 'email' : '', whatsapp ? 'whatsapp' : ''].filter(Boolean);
  if (via.length) {
    await db()
      .from('quotes')
      .update({
        status: q.status === 'draft' || q.status === 'pending_review' ? 'sent' : q.status,
        sent_at: new Date().toISOString(),
        sent_via: via,
        hold_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', q.id);
  }
  return { email, whatsapp, error: email || whatsapp ? undefined : error };
}

export async function notifyOwner(subject: string, lines: string[], path = '/admin/quotes') {
  await sendNotice({
    to: process.env.ENQUIRY_NOTIFY_TO ?? SITE.email,
    subject,
    eyebrow: 'Quotations',
    heading: subject,
    paragraphs: [lines.join('\n')],
    cta: { label: 'Open in the console', href: `${SITE.url}${path}` },
  }).catch(() => undefined);
}

export const summarise = (items: QuoteItem[]) =>
  items
    .map((i) => `${i.name}${i.label ? ` (${i.label})` : ''}${i.qty > 1 ? ` ×${i.qty}` : ''}`)
    .join(', ');

/* ------------------------------------------------------------- access --- */

export type Access =
  | { ok: true; quote: QuoteRow }
  | { ok: false; reason: 'missing' | 'unavailable' | 'expired' | 'limit' | 'void' };

/**
 * Looks a quotation up by its link. Enforces the lifetime and the open
 * limit, and records the view (once per address per five minutes, so a
 * reload or a re-render after a button press is not counted as a new open).
 */
export async function openQuote(
  token: string,
  opts: { ipHash?: string; userAgent?: string; record?: boolean } = {},
): Promise<Access> {
  if (!validToken(token)) return { ok: false, reason: 'missing' };
  const supabase = serviceClient();
  if (!supabase) return { ok: false, reason: 'missing' };
  const { data: q } = await supabase.from('quotes').select('*').eq('token', token).maybeSingle();
  if (!q) return { ok: false, reason: 'missing' };
  if (q.status === 'draft' || q.status === 'pending_review')
    return { ok: false, reason: 'unavailable' };
  if (q.status === 'void') return { ok: false, reason: 'void' };

  const accepted = q.status === 'accepted';
  if (!accepted && new Date(q.valid_until).getTime() < Date.now()) {
    if (q.status !== 'expired')
      await supabase.from('quotes').update({ status: 'expired' }).eq('id', q.id);
    return { ok: false, reason: 'expired' };
  }
  if (!accepted && q.view_count >= q.max_views) return { ok: false, reason: 'limit' };

  if (opts.record !== false) {
    const since = new Date(Date.now() - 5 * 60_000).toISOString();
    let fresh = true;
    if (opts.ipHash) {
      const { count } = await supabase
        .from('quote_views')
        .select('id', { count: 'exact', head: true })
        .eq('quote_id', q.id)
        .eq('ip_hash', opts.ipHash)
        .gte('at', since);
      fresh = (count ?? 0) === 0;
    }
    if (fresh) {
      const now = new Date().toISOString();
      await supabase.from('quote_views').insert({
        quote_id: q.id,
        ip_hash: opts.ipHash ?? null,
        user_agent: opts.userAgent?.slice(0, 300) ?? null,
      });
      await supabase
        .from('quotes')
        .update({
          view_count: q.view_count + 1,
          first_viewed_at: q.first_viewed_at ?? now,
          last_viewed_at: now,
          status: q.status === 'sent' ? 'viewed' : q.status,
        })
        .eq('id', q.id);
      q.view_count += 1;
    }
  }
  return { ok: true, quote: q };
}

export async function getAddons(quoteId: string): Promise<QuoteAddonRow[]> {
  const { data } = await db()
    .from('quote_addons')
    .select('*')
    .eq('quote_id', quoteId)
    .order('created_at');
  return data ?? [];
}

/* -------------------------------------------------------------- clients --- */

/** The client record a quotation belongs to — created from the quotation if there is none yet. */
export async function ensureClient(q: QuoteRow): Promise<string> {
  const supabase = db();
  if (q.client_id) return q.client_id;
  if (q.enquiry_id) {
    const { data: e } = await supabase
      .from('enquiries')
      .select('client_id')
      .eq('id', q.enquiry_id)
      .maybeSingle();
    if (e?.client_id) {
      await supabase.from('quotes').update({ client_id: e.client_id }).eq('id', q.id);
      return e.client_id;
    }
  }
  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      name: q.company || q.name,
      email: q.email && !q.email.endsWith('.invalid') ? q.email : null,
      phone: q.phone,
      status: 'onboarding',
      entity_type: 'other',
      source: `Quotation ${q.number}`,
      notes: q.requirement,
    })
    .select('id')
    .single();
  if (error || !client) throw new Error(error?.message ?? 'Could not create the client.');
  await supabase.rpc('seed_onboarding', { target_client: client.id });
  await supabase.from('quotes').update({ client_id: client.id }).eq('id', q.id);
  if (q.enquiry_id)
    await supabase
      .from('enquiries')
      .update({ client_id: client.id, state: 'converted' })
      .eq('id', q.enquiry_id);
  return client.id;
}

/* ---------------------------------------------------- client actions ---- */

/** The client adds a suggested service to their own quotation. Priced from the catalogue, never from the browser. */
export async function addServiceToQuote(q: QuoteRow, serviceId: string): Promise<QuoteRow> {
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);
  const svc = catalog.find((s) => s.id === serviceId && s.active);
  if (!svc) throw new Error('That service is not available.');
  if (q.items.some((i) => i.serviceId === serviceId)) return q;
  const [added] = buildItems(catalog, [{ serviceId }], { onlyActive: true });
  if (!added) throw new Error('That service is not available.');
  const items = applyIncludes(catalog, [...q.items, { ...added, addedByClient: true }]);
  if (items.length === q.items.length && !items.some((i) => i.serviceId === serviceId)) return q;
  const discount = comboDiscount(items, settings.quotes);
  const { data, error } = await db()
    .from('quotes')
    .update({
      items: items as never,
      // Keep a discount the owner set by hand; otherwise recompute the combination one.
      discount: Math.max(Number(q.discount), discount),
      kind: 'indicative',
      updated_at: new Date().toISOString(),
    })
    .eq('id', q.id)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Could not update the quotation.');
  return data;
}

export async function acceptQuote(q: QuoteRow, by: string): Promise<void> {
  const supabase = db();
  await supabase
    .from('quotes')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by: by.slice(0, 160),
      updated_at: new Date().toISOString(),
    })
    .eq('id', q.id);
  if (q.enquiry_id)
    await supabase
      .from('enquiries')
      .update({ state: 'qualified' })
      .eq('id', q.enquiry_id)
      .neq('state', 'converted');
  await ensureClient({ ...q, status: 'accepted' }).catch((e) =>
    console.error('[quotes] could not create the client', e instanceof Error ? e.message : e),
  );
}

/* ------------------------------------------- the checklist message ------- */

/**
 * The practice's work-order message for an accepted quotation: for each
 * service the numbered documents and details, then — only on a final
 * quotation — the fee and how to pay, and the usual processing time. The
 * same text goes by email and, inside the 24-hour window, on WhatsApp.
 */
export function checklistMessage(
  q: QuoteRow,
  settings: SiteSettings['quotes'],
  addons: QuoteAddonRow[] = [],
): string {
  const final = q.kind === 'final';
  const blocks: string[] = [];
  for (const it of q.items) {
    if (it.kind !== 'service' || !it.serviceId) continue;
    const cl = checklistFor(it.serviceId, it.variantId);
    if (!cl) continue;
    const head = `${it.name}${it.label ? ` – ${it.label}` : ''}`.toUpperCase();
    const lines = [head, '', 'Please share the following documents/details:', ''];
    let n = 0;
    for (const grp of cl.groups) for (const x of grp.items) lines.push(`${++n}. ${x.t}`);
    if (it.includes?.length)
      lines.push('', `Also included in this fee: ${it.includes.join(', ')}.`);
    if (final && it.period === 'once') lines.push('', `💰 ${it.name} Fee: ${inr(it.amount)}`);
    else if (final)
      lines.push(
        '',
        `💰 ${it.name} Fee: ${inr(it.amount)}${it.period === 'month' ? ' per month' : ' per year'}`,
      );
    lines.push('', `⏱️ Processing Time: ${cl.timeline}`);
    blocks.push(lines.join('\n'));
  }
  if (final && settings.upiId) {
    const st = statement(q, addons);
    blocks.push(
      [
        `Total to begin: ${inr(st.grand)}`,
        '',
        'Payment to be made through UPI to:',
        settings.upiId,
        '',
        'Please make the payment to initiate the work.',
        'Government fees, where applicable, are paid at actual cost and are not included above.',
      ].join('\n'),
    );
  }
  return blocks.join('\n\n————————————\n\n');
}

export async function sendChecklist(
  q: QuoteRow,
): Promise<{ email: boolean; whatsapp: boolean; error?: string }> {
  const [settings, addons] = await Promise.all([getSettings(), getAddons(q.id)]);
  const text = checklistMessage(q, settings.quotes, addons);
  if (!text)
    return { email: false, whatsapp: false, error: 'There is no checklist for these services.' };
  let email = false;
  let error: string | undefined;
  if (q.email && !q.email.endsWith('.invalid')) {
    const r = await sendNotice({
      to: q.email,
      subject: `What we need from you — ${q.number}`,
      eyebrow: 'Documents and details',
      heading: `${q.name.split(' ')[0]}, here is what to send us`,
      paragraphs: [
        ...text.split('\n\n————————————\n\n'),
        'You can reply to this email with the documents, send them on WhatsApp, or see them laid out with pictures on your quotation page.',
      ],
      cta: { label: 'Open my quotation', href: quoteUrl(q.token) },
    });
    email = r.sent;
    if (!r.sent) error = r.error;
  } else error = 'This quotation has no email address.';
  const whatsapp = await whatsappIfOpen(q.wa_id ?? q.phone, text.slice(0, 3800));
  return { email, whatsapp, error: email || whatsapp ? undefined : error };
}
