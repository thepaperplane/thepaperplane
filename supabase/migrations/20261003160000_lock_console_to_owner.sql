-- =============================================================================
-- Lock the console to the practice's own address.
--
-- Before this migration, anyone holding the publishable key (which ships to
-- every browser) could call auth.signUp() with an address of their own. The
-- new-user trigger then created a profile with role 'viewer' and is_active
-- defaulting to TRUE, and is_staff() returned true for that profile — which is
-- the predicate on "staff read clients", "staff read enquiries", "staff read
-- subscribers" and the rest. A self-registered stranger could read PAN, GSTIN
-- and every enquiry straight off the REST API.
--
-- Three layers now, each sufficient on its own:
--   1. is_staff() and has_role() require the signed-in account to BE
--      contact@thepaperplane.co.in, confirmed, read from auth.users rather
--      than from anything the user can write.
--   2. Once that account has enrolled a second factor, a password-only (aal1)
--      session no longer satisfies either predicate.
--   3. New profiles are inactive unless they are that address.
-- =============================================================================

create or replace function public.is_console_owner()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
      from auth.users u
     where u.id = auth.uid()
       and lower(u.email) = 'contact@thepaperplane.co.in'
       and u.email_confirmed_at is not null
  )
  -- Second factor: required as soon as one has been enrolled.
  and (
    coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors f
       where f.user_id = auth.uid() and f.status = 'verified'
    )
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_console_owner()
     and exists (
       select 1 from public.profiles p
        where p.id = auth.uid() and p.is_active
     );
$$;

create or replace function public.has_role(required app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_console_owner()
     and exists (
       select 1 from public.profiles p
        where p.id = auth.uid()
          and p.is_active
          and p.role = any(required)
     );
$$;

-- New accounts are inactive unless they are the console owner.
alter table public.profiles alter column is_active set default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_owner boolean;
begin
  is_owner := lower(new.email) = 'contact@thepaperplane.co.in';
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when is_owner then 'owner'::public.app_role else 'viewer'::public.app_role end,
    is_owner
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Anything already registered under another address is switched off.
update public.profiles
   set is_active = false
 where lower(email) <> 'contact@thepaperplane.co.in';

-- A profile could previously flip its own is_active back on through the
-- "self update profile" policy. Only the owner edits profiles now.
drop policy if exists "self update profile" on public.profiles;

-- -----------------------------------------------------------------------------
-- RPC exposure. SECURITY DEFINER functions in the public schema are callable
-- over /rest/v1/rpc by default. seed_onboarding inserts rows past RLS, so it
-- is the server's alone; the trigger function is never meant to be called.
-- has_role / is_staff stay executable by signed-in users because the RLS
-- policies that use them run as the querying role.
-- -----------------------------------------------------------------------------
revoke execute on function public.seed_onboarding(uuid) from public, anon, authenticated;
grant execute on function public.seed_onboarding(uuid) to service_role;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

revoke execute on function public.is_console_owner() from public, anon;
grant execute on function public.is_console_owner() to authenticated, service_role;
revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated, service_role;
revoke execute on function public.has_role(app_role[]) from public, anon;
grant execute on function public.has_role(app_role[]) to authenticated, service_role;

-- Linter: a trigger function with a mutable search_path.
alter function public.touch_updated_at() set search_path = public;
