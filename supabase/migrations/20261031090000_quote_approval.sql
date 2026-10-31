-- =============================================================================
-- Quotation approval cycle.
--
-- An automated quotation carries starting prices only. The client asks for a
-- final quotation, the team approves and issues it with fixed amounts, and only
-- then can it be accepted. This adds the state and the paper trail for that:
--
--   - a `final_requested` status (the client has asked; the team owes a reply)
--   - when it was asked, who approved the final, when, and which revision
--   - quote_events: an append-only log of every step, for the console
--
-- Additive only; existing rows keep working unchanged.
-- =============================================================================

alter table public.quotes drop constraint if exists quotes_status_check;
alter table public.quotes
  add constraint quotes_status_check
  check (status in (
    'draft', 'pending_review', 'sent', 'viewed', 'final_requested',
    'accepted', 'declined', 'expired', 'void'
  ));

alter table public.quotes add column if not exists final_requested_at timestamptz;
alter table public.quotes add column if not exists approved_by text;
alter table public.quotes add column if not exists approved_at timestamptz;
alter table public.quotes add column if not exists revision integer not null default 1;

-- Quotations the team had already marked final before this existed count as
-- approved by whoever created them, so the console does not flag them.
update public.quotes
   set approved_at = coalesce(sent_at, created_at),
       approved_by = coalesce(created_by, 'console')
 where kind = 'final' and approved_at is null;

create table if not exists public.quote_events (
  id bigint generated always as identity primary key,
  quote_id uuid not null references public.quotes (id) on delete cascade,
  at timestamptz not null default now(),
  -- 'client', 'system' or the team member's email.
  actor text not null default 'system',
  -- requested, released, final_requested, final_issued, link_generated, accepted, ...
  type text not null,
  detail text
);
alter table public.quote_events enable row level security;
create index if not exists quote_events_quote_idx on public.quote_events (quote_id, at desc);
