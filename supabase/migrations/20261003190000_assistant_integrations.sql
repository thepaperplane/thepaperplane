-- =============================================================================
-- Site assistant, Zoho connector and the WhatsApp inbox.
--
-- Additive only, same rules as console v2: new tables, plain uuid columns
-- rather than foreign keys into live tables, RLS on everything. The public
-- site never touches these with the anon key — the assistant, the webhook and
-- the console all go through the server with the service key, after their own
-- checks.
-- =============================================================================

-- --- Site assistant ------------------------------------------------------------
create table if not exists public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  user_agent text,
  first_page text,
  started_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  message_count integer not null default 0,
  enquiry_id uuid,
  flagged boolean not null default false
);
create index if not exists assistant_conversations_last_idx
  on public.assistant_conversations (last_at desc);
create index if not exists assistant_conversations_ip_idx
  on public.assistant_conversations (ip_hash, last_at desc);

create table if not exists public.assistant_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  model text,
  input_tokens integer,
  output_tokens integer,
  cached_tokens integer,
  created_at timestamptz not null default now()
);
create index if not exists assistant_messages_conv_idx
  on public.assistant_messages (conversation_id, id);
create index if not exists assistant_messages_day_idx
  on public.assistant_messages (created_at desc) where role = 'user';

-- Answers the owner adds from the console; the assistant reads the active ones.
create table if not exists public.assistant_knowledge (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --- Integrations (Zoho Books, Zoho CRM) --------------------------------------
-- Tokens are encrypted by the server (AES-256-GCM, INTEGRATIONS_KEY) before
-- they are written here; the database never sees them in the clear.
create table if not exists public.integrations (
  provider text primary key,
  status text not null default 'disconnected'
    check (status in ('disconnected', 'connected', 'error')),
  data_center text,
  account_label text,
  org_id text,
  scopes text,
  refresh_token_enc text,
  access_token_enc text,
  access_expires_at timestamptz,
  connected_at timestamptz,
  last_sync_at timestamptz,
  last_error text,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Which local row became which remote record, so a sync never duplicates.
create table if not exists public.integration_links (
  id bigint generated always as identity primary key,
  provider text not null,
  local_table text not null,
  local_id uuid not null,
  remote_module text not null,
  remote_id text not null,
  synced_at timestamptz not null default now(),
  unique (provider, local_table, local_id, remote_module)
);
create index if not exists integration_links_remote_idx
  on public.integration_links (provider, remote_module, remote_id);

create table if not exists public.integration_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  provider text not null,
  action text not null,
  ok boolean not null,
  detail text
);
create index if not exists integration_log_at_idx on public.integration_log (at desc);

-- --- WhatsApp inbox (Meta Cloud API) ------------------------------------------
create table if not exists public.wa_contacts (
  wa_id text primary key,
  name text,
  client_id uuid,
  enquiry_id uuid,
  last_message_at timestamptz,
  last_inbound_at timestamptz,
  unread integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists wa_contacts_last_idx on public.wa_contacts (last_message_at desc);

create table if not exists public.wa_messages (
  id uuid primary key default gen_random_uuid(),
  wa_message_id text unique,
  wa_id text not null,
  direction text not null check (direction in ('in', 'out')),
  kind text not null default 'text',
  body text,
  media_id text,
  status text,
  error text,
  sent_by text,
  created_at timestamptz not null default now()
);
create index if not exists wa_messages_contact_idx on public.wa_messages (wa_id, created_at);

-- --- Row level security ----------------------------------------------------------
-- Enabled with no policies at all: nothing but the server's service key can
-- read or write these tables. The console, the assistant and the webhook all
-- run on the server after their own checks, so no policy is needed — and a
-- table with no policy cannot be reached with the anon or a user key.
do $$
declare t text;
begin
  foreach t in array array[
    'assistant_conversations', 'assistant_messages', 'assistant_knowledge',
    'integrations', 'integration_links', 'integration_log', 'wa_contacts', 'wa_messages'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
