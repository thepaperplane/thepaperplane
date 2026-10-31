/**
 * Pure quotation helpers: money, totals, wording and the "starting from" rules.
 * No server-only imports, so the quotation page, the PDF layout and the
 * console all share one set of rules.
 */
import type {
  CatalogService,
  Period,
  PricedService,
  QuoteAddonRow,
  QuoteItem,
  QuoteRow,
  Totals,
} from './types';

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

export const PER: Record<Period, string> = { once: '', month: ' / month', year: ' / year' };

/* --------------------------------------------------------------- tokens --- */

/**
 * Text on a quotation may mention another service's price — "Care plan
 * ₹5,000 per year" — without freezing it. Write `{price:careplan}` and the
 * live price is filled in wherever the text is shown, so changing the Care
 * Plan's price on the Pricing page changes every note that mentions it.
 *
 * Inside a quotation that itself contains that service, the amount agreed for
 * it on that quotation wins over the list price.
 */
export const PRICE_TOKEN = /\{price:([a-z0-9_-]+)(?::([a-z0-9_-]+))?\}/gi;

export function resolveTokens(
  text: string | null | undefined,
  catalog: Pick<CatalogService, 'id' | 'defaultVariant' | 'variants'>[],
  items: Pick<QuoteItem, 'serviceId' | 'variantId' | 'unitPrice'>[] = [],
): string {
  if (!text) return '';
  return text.replace(PRICE_TOKEN, (whole, id: string, variant?: string) => {
    const svc = catalog.find((s) => s.id === id);
    if (!svc) return whole;
    const v = svc.variants.find((x) => x.id === (variant ?? svc.defaultVariant)) ?? svc.variants[0];
    if (!v) return whole;
    const inQuote = items.find((i) => i.serviceId === id && (!variant || i.variantId === v.id));
    return inr(inQuote ? inQuote.unitPrice : v.price);
  });
}

/* -------------------------------------------------------- starting price --- */

/**
 * What a service costs "to start with": the lowest option, and the highest if
 * the options differ. A suggestion on an automated quotation shows this — a
 * range, never a promise — and the real figure arrives with the final
 * quotation.
 */
export function startingPrice(svc: Pick<CatalogService, 'variants'>) {
  const prices = svc.variants.map((v) => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const period = svc.variants[0]?.period ?? 'once';
  return { min, max, period, ranged: max > min };
}

export function startingText(svc: Pick<CatalogService, 'variants'>): string {
  const p = startingPrice(svc);
  return p.ranged
    ? `${inr(p.min)} – ${inr(p.max)}${PER[p.period]}`
    : `from ${inr(p.min)}${PER[p.period]}`;
}

/* ------------------------------------------------------------- the state --- */

export const isFinal = (q: Pick<QuoteRow, 'kind'>) => q.kind === 'final';

/** The client can still act on it: read, add suggestions, ask for the final, accept the final. */
export const CLIENT_OPEN: QuoteRow['status'][] = ['sent', 'viewed', 'final_requested'];

export function quoteLabel(q: Pick<QuoteRow, 'kind' | 'source'>): string {
  if (q.kind === 'final') return 'Final quotation';
  return q.source === 'console'
    ? 'Estimate · starting prices'
    : 'Automated quotation · starting prices';
}

/** The sentence every automated quotation carries, on screen and in the PDF. */
export const AUTOMATED_NOTICE =
  'This is an automated quotation. Every price on it is a starting price, not a fixed offer. Your final quotation, with the actual amounts we have discussed and agreed, is issued by our team after you ask for it and we approve it.';

/** Price of one line, as the client reads it. Starting prices carry "from"; only a final quotation is exact. */
export function priceText(i: QuoteItem, final: boolean): string {
  const from = final ? '' : 'from ';
  const per = PER[i.period];
  if (i.range && !final && i.range.max > i.range.min)
    return `${inr(i.range.min)} – ${inr(i.range.max)}${per}`;
  return i.qty > 1
    ? `${from}${inr(i.unitPrice)} × ${i.qty} = ${inr(i.amount)}${per}`
    : `${from}${inr(i.unitPrice)}${per}`;
}

/* --------------------------------------------------------------- totals --- */

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

/** A client-requested add-on the team has not priced yet. */
export const isUnpriced = (a: Pick<QuoteAddonRow, 'requested_by' | 'status' | 'amount'>) =>
  a.requested_by === 'client' && a.status === 'proposed' && Number(a.amount) === 0;

export type { PricedService };
