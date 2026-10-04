-- =============================================================================
-- Client portal, meetings, the WhatsApp assistant's controls and automations.
--
-- Additive: new tables, and new nullable/defaulted columns on two tables this
-- console created (wa_contacts, client_documents). RLS on, no policies — only
-- the server's service key reaches these. Portal sign-ins do not create
-- database users at all: a client's session is a random token whose hash is
-- stored here, so a portal login can never reach the console or anything
-- protected by row-level security.
-- =============================================================================

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'website' check (source in ('website', 'whatsapp', 'console')),
  name text not null,
  email text,
  phone text,
  wa_id text,
  topic text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  google_event_id text,
  meet_link text,
  status text not null default 'booked' check (status in ('booked', 'cancelled', 'done', 'no_show')),
  enquiry_id uuid,
  client_id uuid,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.meetings enable row level security;
create index if not exists meetings_starts_idx on public.meetings (starts_at);

create table if not exists public.portal_codes (
  id bigint generated always as identity primary key,
  identifier text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  ip_hash text,
  created_at timestamptz not null default now()
);
alter table public.portal_codes enable row level security;
create index if not exists portal_codes_identifier_idx on public.portal_codes (identifier, created_at desc);

create table if not exists public.portal_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  identifier text not null,
  client_ids uuid[] not null,
  active_client_id uuid not null,
  user_agent text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table public.portal_sessions enable row level security;

create table if not exists public.client_portal (
  client_id uuid primary key,
  enabled boolean not null default true,
  last_login_at timestamptz,
  logins integer not null default 0,
  zoho_portal_invited_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.client_portal enable row level security;

create table if not exists public.automation_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  kind text not null,
  ref text,
  channel text,
  ok boolean not null default true,
  detail text
);
alter table public.automation_log enable row level security;
create index if not exists automation_log_kind_idx on public.automation_log (kind, ref, at desc);
create index if not exists automation_log_at_idx on public.automation_log (at desc);

alter table public.wa_contacts add column if not exists bot_paused boolean not null default false;
alter table public.wa_contacts add column if not exists needs_human boolean not null default false;
alter table public.wa_contacts add column if not exists last_bot_at timestamptz;

alter table public.client_documents add column if not exists visible_to_client boolean not null default true;
alter table public.client_documents add column if not exists uploaded_by text;
