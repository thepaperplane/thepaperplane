-- =============================================================================
-- Quotations: private, per-client price pages, editable prices, and a ledger of
-- add-ons requested after the quotation was accepted.
--
-- Additive only. RLS is on and there are deliberately no policies: prices live
-- here and nowhere public, and these tables are reachable only through the
-- server's service key (the quote page itself is looked up server-side by an
-- unguessable token). One new nullable column on testimonials, for the video
-- link shown on the Our Work page.
-- =============================================================================

-- Admin overrides of the default catalogue (lib/quotes/catalog-data.ts).
create table if not exists public.quote_services (
  service_id text primary key,
  -- { "<variantId>": <price> } — only variants the owner has changed.
  prices jsonb not null default '{}'::jsonb,
  note text,
  value_note text,
  related text[],
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.quote_services enable row level security;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  -- 144 bits, base64url. The link is the only way in.
  token text not null unique,
  number text not null unique,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'void')),
  -- indicative: generated from what the client told us; final: confirmed by the practice.
  kind text not null default 'indicative' check (kind in ('indicative', 'final')),
  source text not null default 'console' check (source in ('console', 'website', 'whatsapp', 'assistant')),
  name text not null,
  email text,
  phone text,
  wa_id text,
  company text,
  enquiry_id uuid,
  client_id uuid,
  requirement text,
  answers jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  note_to_client text,
  score integer not null default 0,
  hold_reason text,
  utm jsonb not null default '{}'::jsonb,
  valid_until timestamptz not null,
  max_views integer not null default 12,
  view_count integer not null default 0,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  sent_at timestamptz,
  sent_via text[] not null default '{}',
  accepted_at timestamptz,
  accepted_by text,
  decline_reason text,
  invoice_id uuid,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.quotes enable row level security;
create index if not exists quotes_status_idx on public.quotes (status, created_at desc);
create index if not exists quotes_email_idx on public.quotes (lower(email));
create index if not exists quotes_enquiry_idx on public.quotes (enquiry_id);

-- Every open of a quote page: lets the owner see when it was read, and spot a
-- link that is being passed around (many distinct hashed addresses).
create table if not exists public.quote_views (
  id bigint generated always as identity primary key,
  quote_id uuid not null references public.quotes (id) on delete cascade,
  at timestamptz not null default now(),
  ip_hash text,
  user_agent text
);
alter table public.quote_views enable row level security;
create index if not exists quote_views_quote_idx on public.quote_views (quote_id, at desc);

-- Work asked for after the quotation: priced, approved by the client, and
-- carried onto the final statement and invoice.
create table if not exists public.quote_addons (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  title text not null,
  details text,
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'declined', 'billed')),
  requested_by text not null default 'team' check (requested_by in ('team', 'client')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  billed_at timestamptz
);
alter table public.quote_addons enable row level security;
create index if not exists quote_addons_quote_idx on public.quote_addons (quote_id, created_at);

alter table public.testimonials add column if not exists video_url text;
