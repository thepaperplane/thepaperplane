/** Shapes shared by the quote engine, the pages and the console. */

export type Period = 'once' | 'month' | 'year';
export type CategoryId = 'start' | 'tax' | 'web' | 'brand' | 'auto';

export const CATEGORIES: { id: CategoryId; label: string; line: string }[] = [
  {
    id: 'start',
    label: 'Start & register',
    line: 'Registrations and licences to start and run your business legally.',
  },
  {
    id: 'tax',
    label: 'Tax & accounts',
    line: 'Returns, accounts and notices handled so you stay compliant.',
  },
  {
    id: 'web',
    label: 'Websites',
    line: 'From a single page to a full custom platform.',
  },
  {
    id: 'brand',
    label: 'Brand & design',
    line: 'A look and feel that makes your business memorable.',
  },
  { id: 'auto', label: 'Automation & AI', line: 'Smart tools and automation that save you hours.' },
];

/** What a client is asked for: a scan or photo, something to tell us, a picture, or a map pin. */
export type ChecklistKind = 'doc' | 'info' | 'photo' | 'location';
export type ChecklistItem = { t: string; kind: ChecklistKind; note?: string };
export type ChecklistGroup = { title: string; items: ChecklistItem[] };

export type CatalogVariant = { id: string; label: string; price: number; period: Period };

/** A government charge paid at actual cost, shown beside our fee and never mixed into it. */
export type GovFee = {
  label: string;
  /** null: depends on the state or the case, confirmed before we file. */
  amount: number | null;
  per: Period;
  note?: string;
  /** Applies only to these variants of the service. */
  variants?: string[];
};

export type CatalogService = {
  id: string;
  cat: CategoryId;
  name: string;
  line: string;
  unit: string;
  /** "From ₹x": the price is a starting point and the final fee depends on the work. */
  from: boolean;
  note: string;
  what: string[];
  docsTitle: string;
  docs: string[];
  steps: { t: string; d: string }[];
  variants: CatalogVariant[];
  /** The variant a quotation starts with. */
  defaultVariant: string;
  /** What the public request form asks about this service, if anything. */
  ask: 'variant' | 'qty' | null;
  askLabel: string;
  /** Services this one already includes — never offered or charged separately beside it. */
  includes: string[];
  /** Services suggested alongside this one. */
  related: string[];
  /** One line on why the price is worth it. */
  value: string;
  passThrough: string;
  govFees: GovFee[];
};

/** A catalogue service with the owner's overrides applied. */
export type PricedService = CatalogService & {
  active: boolean;
  /** The note as written, with `{price:id}` tokens unresolved. `note` has them filled in. */
  noteTemplate: string;
};

export type QuoteItem = {
  /** Stable within a quote. */
  key: string;
  kind: 'service' | 'custom';
  serviceId?: string;
  variantId?: string;
  name: string;
  label: string;
  unit: string;
  qty: number;
  unitPrice: number;
  amount: number;
  period: Period;
  from: boolean;
  note?: string;
  value?: string;
  /** Government charges for this line, at actual cost, kept apart from the fee. */
  gov?: { label: string; amount: number | null; per: Period; note?: string }[];
  /** Names of the allied services included in this line's fee. */
  includes?: string[];
  /** Added by the client from a suggestion on the quote page. Priced in the final quotation. */
  addedByClient?: boolean;
  /** The lowest and highest starting price across the options of a client-added line. */
  range?: { min: number; max: number };
};

/**
 * The life of a quotation (see docs/QUOTATION-SOP.md):
 *
 *   draft → pending_review → sent → viewed → final_requested → (final) sent → viewed → accepted
 *
 * An automated quotation is `kind: 'indicative'`: every price on it is a
 * starting price. Only a quotation the team has approved and issued —
 * `kind: 'final'` — carries fixed amounts, and only a final quotation can be
 * accepted.
 */
export type QuoteStatus =
  | 'draft'
  | 'pending_review'
  | 'sent'
  | 'viewed'
  | 'final_requested'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'void';

export type QuoteRow = {
  id: string;
  token: string;
  number: string;
  status: QuoteStatus;
  kind: 'indicative' | 'final';
  source: 'console' | 'website' | 'whatsapp' | 'assistant';
  name: string;
  email: string | null;
  phone: string | null;
  wa_id: string | null;
  company: string | null;
  enquiry_id: string | null;
  client_id: string | null;
  requirement: string | null;
  answers: Record<string, unknown>;
  items: QuoteItem[];
  discount: number;
  note_to_client: string | null;
  score: number;
  hold_reason: string | null;
  utm: Record<string, string>;
  valid_until: string;
  max_views: number;
  view_count: number;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  sent_at: string | null;
  sent_via: string[];
  accepted_at: string | null;
  accepted_by: string | null;
  decline_reason: string | null;
  invoice_id: string | null;
  /** When the client asked the team for the final quotation. */
  final_requested_at: string | null;
  /** Who approved and issued the final quotation, and when. */
  approved_by: string | null;
  approved_at: string | null;
  /** Bumped each time the team issues a revised final quotation. */
  revision: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteViewRow = {
  id: number;
  quote_id: string;
  at: string;
  ip_hash: string | null;
  user_agent: string | null;
};

export type QuoteEventRow = {
  id: number;
  quote_id: string;
  at: string;
  actor: string;
  type: string;
  detail: string | null;
};

export type QuoteAddonRow = {
  id: string;
  quote_id: string;
  title: string;
  details: string | null;
  amount: number;
  status: 'proposed' | 'approved' | 'declined' | 'billed';
  requested_by: 'team' | 'client';
  created_at: string;
  decided_at: string | null;
  billed_at: string | null;
};

export type QuoteServiceRow = {
  service_id: string;
  prices: Record<string, number>;
  note: string | null;
  value_note: string | null;
  related: string[] | null;
  active: boolean;
  updated_at: string;
};

export type Totals = {
  once: number;
  month: number;
  year: number;
  discount: number;
  /** What is payable now: one-time work after discount. Recurring is shown apart. */
  dueNow: number;
};
