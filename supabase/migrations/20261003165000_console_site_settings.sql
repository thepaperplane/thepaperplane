-- Key/value settings the console edits and the public site reads on the
-- server: contact channels, the announcement bar, homepage switches.
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
create policy "owner manages settings" on public.site_settings for all to authenticated
  using (public.has_role(array['owner','admin','editor']::app_role[]))
  with check (public.has_role(array['owner','admin','editor']::app_role[]));
