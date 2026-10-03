-- =============================================================================
-- Console v2: the tables a practice actually runs on.
--
-- Additive only. Nothing here alters an existing table: companion tables
-- (enquiry_meta, project_media) carry new fields beside the rows they extend,
-- and references to existing tables are plain uuid columns with an index
-- rather than foreign keys, because adding a foreign key takes a lock on the
-- referenced table — which is live and serving the public site.
--
-- Every table has RLS enabled. The public site reads through the service key
-- on the server; the only policies that admit anon are "read what is
-- published", which is exactly what the page shows anyway.
-- =============================================================================

-- site_settings is created by 20261003165000_console_site_settings.

do $$ begin
  create type public.application_status as enum
    ('new', 'reviewing', 'shortlisted', 'interview', 'offer', 'hired', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'void');
exception when duplicate_object then null; end $$;

-- --- Testimonials ------------------------------------------------------------
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null check (char_length(quote) between 10 and 1200),
  author_name text not null,
  author_role text,
  company text,
  avatar_url text,
  project_slug text,
  rating smallint check (rating between 1 and 5),
  is_published boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --- Careers -----------------------------------------------------------------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  team text,
  location text not null default 'Remote, India',
  employment_type text not null default 'Full-time',
  experience text,
  summary text,
  description text,
  responsibilities text[] not null default '{}',
  requirements text[] not null default '{}',
  is_open boolean not null default true,
  position integer not null default 0,
  closes_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs (id) on delete set null,
  job_title text,
  name text not null,
  email text not null,
  phone text,
  city text,
  portfolio_url text,
  linkedin_url text,
  experience_years numeric(4, 1),
  cover_note text,
  resume_path text,
  status public.application_status not null default 'new',
  rating smallint check (rating between 1 and 5),
  notes text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists job_applications_job_idx on public.job_applications (job_id);
create index if not exists job_applications_status_idx on public.job_applications (status);

-- --- Client operations -------------------------------------------------------
create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  title text not null,
  category text not null default 'General',
  file_path text not null,
  mime_type text,
  size_bytes bigint,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists client_documents_client_idx on public.client_documents (client_id);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid,
  title text not null,
  details text,
  due_on date,
  -- Text with a check rather than the existing task_state enum: a column of
  -- that type takes a lock on an enum the live onboarding table depends on.
  state text not null default 'pending'
    check (state in ('pending', 'in_progress', 'blocked', 'done', 'not_applicable')),
  priority smallint not null default 2 check (priority between 1 and 3),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_client_idx on public.tasks (client_id);
create index if not exists tasks_due_idx on public.tasks (due_on) where state <> 'done';

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  number text not null unique,
  description text,
  issued_on date not null default current_date,
  due_on date,
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  tax_amount numeric(14, 2) not null default 0 check (tax_amount >= 0),
  currency text not null default 'INR',
  status public.invoice_status not null default 'draft',
  paid_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invoices_client_idx on public.invoices (client_id);
create index if not exists invoices_status_idx on public.invoices (status);

-- --- Marketing ---------------------------------------------------------------
-- Lead attribution and pipeline detail, one row per enquiry.
create table if not exists public.enquiry_meta (
  enquiry_id uuid primary key,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  landing_path text,
  budget text,
  timeline text,
  value_estimate numeric(14, 2),
  follow_up_on date,
  updated_at timestamptz not null default now()
);

-- Portfolio extras: the full-length captures the scrollable browser frame
-- needs, and whether a project is featured on the homepage.
create table if not exists public.project_media (
  project_id uuid primary key,
  desktop_full_path text,
  mobile_full_path text,
  is_featured boolean not null default false,
  outcome text,
  updated_at timestamptz not null default now()
);

-- Cookieless, aggregate page views. No IP address, no identifier, nothing
-- that can single out a visitor: one counter per day per combination.
create table if not exists public.page_views (
  day date not null,
  path text not null,
  referrer_host text not null default '',
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  device text not null default '',
  country text not null default '',
  views integer not null default 0,
  primary key (day, path, referrer_host, utm_source, utm_medium, utm_campaign, device, country)
);

create or replace function public.track_view(
  p_path text,
  p_referrer text,
  p_source text,
  p_medium text,
  p_campaign text,
  p_device text,
  p_country text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.page_views as v
    (day, path, referrer_host, utm_source, utm_medium, utm_campaign, device, country, views)
  values (
    (now() at time zone 'Asia/Kolkata')::date,
    left(coalesce(p_path, '/'), 200),
    left(coalesce(p_referrer, ''), 120),
    left(coalesce(p_source, ''), 80),
    left(coalesce(p_medium, ''), 80),
    left(coalesce(p_campaign, ''), 120),
    left(coalesce(p_device, ''), 20),
    left(coalesce(p_country, ''), 4),
    1
  )
  on conflict (day, path, referrer_host, utm_source, utm_medium, utm_campaign, device, country)
  do update set views = v.views + 1;
$$;
revoke execute on function public.track_view(text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.track_view(text, text, text, text, text, text, text)
  to service_role;

-- --- Security ----------------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text,
  action text not null,
  entity text,
  entity_id text,
  detail jsonb not null default '{}'::jsonb
);
create index if not exists audit_log_at_idx on public.audit_log (at desc);

-- updated_at is set by the server actions that write these tables, rather
-- than by a trigger shared with the existing schema.

-- --- Row level security --------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'testimonials', 'jobs', 'job_applications', 'client_documents', 'tasks',
    'invoices', 'enquiry_meta', 'project_media', 'page_views', 'audit_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "console owner" on public.%I for all to authenticated
         using (public.has_role(array[''owner'',''admin'',''editor'']::public.app_role[]))
         with check (public.has_role(array[''owner'',''admin'',''editor'']::public.app_role[]))', t);
  end loop;
end $$;

drop policy if exists "public read published testimonials" on public.testimonials;
create policy "public read published testimonials" on public.testimonials
  for select to anon, authenticated using (is_published);

drop policy if exists "public read open jobs" on public.jobs;
create policy "public read open jobs" on public.jobs
  for select to anon, authenticated using (is_open);

-- --- Storage -------------------------------------------------------------------
-- site-media: public images the site renders (avatars, uploaded captures).
-- vault, resumes: private. Only the server, with the service key, reads or
-- writes them, and hands the console short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('site-media', 'site-media', true, 10485760,
    array['image/png', 'image/jpeg', 'image/webp', 'image/avif']),
  ('vault', 'vault', false, 26214400,
    array['application/pdf', 'image/png', 'image/jpeg', 'image/webp',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/msword', 'text/csv', 'application/zip']),
  ('resumes', 'resumes', false, 10485760,
    array['application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

-- --- Analytics read-side -------------------------------------------------------
-- Aggregations run in Postgres, so the console's totals stay exact however many
-- counter rows accumulate (a plain select is capped at the API's row limit).
create or replace function public.analytics_daily(p_from date)
returns table (day date, views bigint)
language sql
stable
set search_path = public
as $$
  select v.day, sum(v.views)::bigint
    from public.page_views v
   where v.day >= p_from
   group by v.day
   order by v.day;
$$;

create or replace function public.analytics_top(p_from date, p_dim text, p_limit int default 10)
returns table (label text, views bigint)
language plpgsql
stable
set search_path = public
as $$
begin
  if p_dim not in ('path', 'referrer_host', 'utm_source', 'utm_medium', 'utm_campaign', 'device', 'country') then
    raise exception 'unknown dimension %', p_dim;
  end if;
  return query execute format(
    'select %1$I::text, sum(views)::bigint from public.page_views where day >= $1 group by 1 order by 2 desc limit $2',
    p_dim
  ) using p_from, least(greatest(p_limit, 1), 50);
end;
$$;

revoke execute on function public.analytics_daily(date) from public, anon, authenticated;
revoke execute on function public.analytics_top(date, text, int) from public, anon, authenticated;
grant execute on function public.analytics_daily(date) to service_role;
grant execute on function public.analytics_top(date, text, int) to service_role;
