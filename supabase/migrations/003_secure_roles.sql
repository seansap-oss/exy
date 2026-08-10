-- ============================================================================
-- EXY — SECURITY FIX: remove automatic admin escalation by email prefix
--
-- The previous trigger granted `admin` to any account whose email began with
-- "admin@". Anyone could self-register admin@<anything> and obtain the
-- Super-Admin portal. This migration closes that hole and provides the only
-- supported way to grant admin: an operator running SQL.
--
-- Safe to run repeatedly.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. New-user trigger: role is ALWAYS 'user'
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, username, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    'user'::user_role          -- never derived from the email address
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. Stop users from escalating their own role
--    profiles_update already allows a user to update their own row, which
--    would let them PATCH role='admin' from the browser. This trigger pins
--    role, tier and verification to their existing values unless the caller
--    is already an admin.
-- ----------------------------------------------------------------------------
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  caller_is_admin boolean;
begin
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    into caller_is_admin;

  if not coalesce(caller_is_admin, false) then
    new.role         := old.role;
    new.tier         := old.tier;
    new.verification := old.verification;
    new.is_seller    := old.is_seller;
  end if;

  return new;
end $$;

drop trigger if exists on_profile_privilege_guard on public.profiles;
create trigger on_profile_privilege_guard
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- ----------------------------------------------------------------------------
-- 3. Operator-only admin grant
--    Run this manually after the account has been created through signup:
--
--      select public.grant_admin('you@yourdomain.com');
--
--    It is SECURITY DEFINER but revoked from anon/authenticated below, so it
--    can only be called from the SQL editor or a service-role connection.
-- ----------------------------------------------------------------------------
create or replace function public.grant_admin(target_email text)
returns text language plpgsql security definer set search_path = public as $$
declare
  hit int;
begin
  update public.profiles set role = 'admin' where lower(email) = lower(target_email);
  get diagnostics hit = row_count;
  if hit = 0 then
    return format('No profile found for %s — sign up first, then re-run.', target_email);
  end if;
  return format('%s is now an admin.', target_email);
end $$;

create or replace function public.revoke_admin(target_email text)
returns text language plpgsql security definer set search_path = public as $$
declare
  hit int;
begin
  update public.profiles set role = 'user' where lower(email) = lower(target_email);
  get diagnostics hit = row_count;
  if hit = 0 then return format('No profile found for %s.', target_email); end if;
  return format('%s is now a normal user.', target_email);
end $$;

-- Never callable from the browser.
revoke all on function public.grant_admin(text)  from public, anon, authenticated;
revoke all on function public.revoke_admin(text) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. Demote any account that was auto-escalated by the old trigger.
--    Comment this out if you have already granted admin intentionally.
-- ----------------------------------------------------------------------------
update public.profiles
   set role = 'user'
 where role = 'admin'
   and lower(email) like 'admin@%';
