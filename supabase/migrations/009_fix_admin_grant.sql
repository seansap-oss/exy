-- ============================================================================
-- EXY — FIX: grant_admin() must survive the role-protection trigger
--
-- ROOT CAUSE:
--   grant_admin() runs SECURITY DEFINER, but the on_profile_privilege_guard
--   trigger fires on every UPDATE to public.profiles. That trigger calls
--   public.is_admin(), which checks:
--       select exists (select 1 from public.profiles
--                       where id = auth.uid() and role = 'admin')
--   When grant_admin() is invoked from the SQL Editor, auth.uid() is NULL
--   (the editor connects via the service role, not a user session). So
--   is_admin() returns false, and the trigger overwrites new.role with
--   old.role — silently undoing the grant. The function reports success
--   because the UPDATE matched a row, but the trigger reverted it.
--
-- FIX:
--   grant_admin() now sets a session-level GUC, app.bypass_role_guard, to
--   'true' before the UPDATE. The trigger checks this variable and skips
--   the privilege guard when it is set. The variable is reset afterward so
--   it can never be left on. Because the GUC is session-scoped, it cannot be
--   set or exploited by any concurrent connection, and it is never
--   controllable through the PostgREST API.
--
--   Additionally, grant_admin() now re-reads the row and returns the
--   actual stored role, so it can never claim success unless the database
--   truly holds role = 'admin'.
--
-- Safe to run repeatedly. No existing data is modified.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Harden the role-protection trigger to honour the bypass GUC
-- ----------------------------------------------------------------------------
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  caller_is_admin boolean;
  bypass_active   boolean;
begin
  begin
    bypass_active := current_setting('app.bypass_role_guard', true)::boolean;
  exception when undefined_object then
    bypass_active := false;
  end;

  if bypass_active then
    return new;
  end if;

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

-- ----------------------------------------------------------------------------
-- 2. Rewrite grant_admin() to set the bypass GUC and verify the result
-- ----------------------------------------------------------------------------
create or replace function public.grant_admin(target_email text)
returns text language plpgsql security definer set search_path = public as $$
declare
  target_id uuid;
  new_role  text;
begin
  perform set_config('app.bypass_role_guard', 'true', true);

  select id into target_id from public.profiles where lower(email) = lower(target_email);

  if target_id is null then
    perform set_config('app.bypass_role_guard', 'false', true);
    return format('No profile found for %s — sign up first, then re-run.', target_email);
  end if;

  update public.profiles set role = 'admin' where id = target_id;

  select role into new_role from public.profiles where id = target_id;

  perform set_config('app.bypass_role_guard', 'false', true);

  if new_role = 'admin' then
    return format('%s is now an admin (id %s).', target_email, target_id);
  else
    return format('FAILED: %s still has role %s — review RLS or trigger policies.', target_email, new_role);
  end if;
end $$;

create or replace function public.revoke_admin(target_email text)
returns text language plpgsql security definer set search_path = public as $$
declare
  target_id uuid;
  new_role  text;
begin
  perform set_config('app.bypass_role_guard', 'true', true);

  select id into target_id from public.profiles where lower(email) = lower(target_email);

  if target_id is null then
    perform set_config('app.bypass_role_guard', 'false', true);
    return format('No profile found for %s.', target_email);
  end if;

  update public.profiles set role = 'user' where id = target_id;

  select role into new_role from public.profiles where id = target_id;

  perform set_config('app.bypass_role_guard', 'false', true);

  if new_role = 'user' then
    return format('%s is now a normal user (id %s).', target_email, target_id);
  else
    return format('FAILED: %s still has role %s.', target_email, new_role);
  end if;
end $$;

revoke all on function public.grant_admin(text)  from public, anon, authenticated;
revoke all on function public.revoke_admin(text) from public, anon, authenticated;
grant execute on function public.grant_admin(text)  to service_role;
grant execute on function public.revoke_admin(text) to service_role;
