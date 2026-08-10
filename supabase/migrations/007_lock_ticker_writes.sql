-- ============================================================================
-- EXY — SECURITY FIX: restrict ticker_settings writes to admins
--
-- ticker_table.sql shipped with:
--     create policy "Allow update ticker"
--       on public.ticker_settings for update using (true);
--
-- `using (true)` lets ANY authenticated user — and in practice any visitor
-- holding the public anon key — rewrite the global ticker shown on the home
-- page. Verified during the account audit: a plain `role = 'user'` account
-- successfully changed the live scroll speed to 99.
--
-- This migration replaces that policy with an admin-only one. Public read is
-- preserved so the website and Android app keep rendering the bar.
--
-- Safe to run repeatedly.
-- ============================================================================

alter table public.ticker_settings enable row level security;

-- Public may still read the single settings row.
drop policy if exists "Allow public read ticker" on public.ticker_settings;
create policy "Allow public read ticker"
  on public.ticker_settings for select using (true);

-- Remove the permissive write policies from the original migration.
drop policy if exists "Allow update ticker" on public.ticker_settings;
drop policy if exists ticker_write         on public.ticker_settings;

-- Writes require an admin profile. public.is_admin() is defined in
-- 002_listings_and_profiles.sql / 003_secure_roles.sql.
create policy ticker_admin_write
  on public.ticker_settings for all
  using (public.is_admin())
  with check (public.is_admin());
