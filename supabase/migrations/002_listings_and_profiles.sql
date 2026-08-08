-- ============================================================================
-- EXY — FIX: listings + profiles were never created, so Super-Admin posts
-- could not reach the live feed. This migration is idempotent and additive:
-- it creates only what is missing and never drops existing data.
--
-- Run in: Supabase SQL editor for project wzhuzaccdwrzsibtzfng
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums (created only when absent)
-- ----------------------------------------------------------------------------
do $$ begin create type user_role as enum ('user','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type tier as enum ('free','standard','comprehensive','dealer'); exception when duplicate_object then null; end $$;
do $$ begin create type verification_level as enum ('none','verified-business','verified-inspector'); exception when duplicate_object then null; end $$;
do $$ begin create type listing_status as enum ('active','paused','sold'); exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- profiles — 1:1 with auth.users
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text not null default '',
  username          text unique,
  email             text,
  phone             text,
  role              user_role not null default 'user',
  tier              tier not null default 'free',
  tier_expiry       timestamptz,
  is_seller         boolean not null default false,
  business_name     text,
  bio               text,
  verification      verification_level not null default 'none',
  storefront_handle text unique,
  storefront_url    text,
  avatar_color      text not null default '#FF9500',
  location          text not null default 'India',
  hide_phone        boolean not null default false,
  rating            numeric(2,1) not null default 5.0,
  response_time     text not null default 'New member',
  created_at        timestamptz not null default now()
);

-- Feature 2: remember the last posting location on the profile.
alter table public.profiles add column if not exists last_location text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, username, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    case when new.email like 'admin@%' then 'admin'::user_role else 'user'::user_role end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- listings
-- ----------------------------------------------------------------------------
create table if not exists public.listings (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text not null default '',
  price          numeric(12,2) not null default 0,
  price_unit     text,
  negotiable     boolean not null default true,
  category_id    text,
  subcategory_id text,
  tags           text[] not null default '{}',
  features       text[] not null default '{}',
  location       text not null default 'India',
  region         text not null default 'india',
  city           text not null default '',
  latitude       double precision,
  longitude      double precision,
  seller_id      uuid references public.profiles(id) on delete cascade,
  video          jsonb,
  media          jsonb not null default '[]'::jsonb,
  photos         text[] not null default '{}',
  tier           tier not null default 'free',
  featured       boolean not null default false,
  condition      text not null default 'new',
  view_count     int not null default 0,
  save_count     int not null default 0,
  click_count    int not null default 0,
  lead_count     int not null default 0,
  today_views    int not null default 0,
  hide_phone     boolean not null default false,
  status         listing_status not null default 'active',
  published      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Safe to re-run against a partially-created table.
alter table public.listings add column if not exists published  boolean not null default true;
alter table public.listings add column if not exists lead_count int not null default 0;
alter table public.listings add column if not exists latitude   double precision;
alter table public.listings add column if not exists longitude  double precision;

create index if not exists listings_status_idx   on public.listings(status);
create index if not exists listings_seller_idx   on public.listings(seller_id);
create index if not exists listings_created_idx  on public.listings(created_at desc);

-- ----------------------------------------------------------------------------
-- Feature 3: private seller form history
-- ----------------------------------------------------------------------------
create table if not exists public.seller_text_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  text_value   text not null,
  text_type    text not null check (text_type in ('location','description','business','phrase')),
  usage_count  int not null default 1,
  last_used_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  unique (user_id, text_type, text_value)
);

create index if not exists seller_history_lookup_idx
  on public.seller_text_history(user_id, text_type, last_used_at desc);

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.listings            enable row level security;
alter table public.seller_text_history enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- profiles: world-readable (storefronts), self/admin writable
drop policy if exists profiles_read   on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_insert on public.profiles;
create policy profiles_read   on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles for update using (auth.uid() = id or public.is_admin());

-- listings: the feed must see every active+published row, including admin posts.
drop policy if exists listings_read   on public.listings;
drop policy if exists listings_insert on public.listings;
drop policy if exists listings_update on public.listings;
drop policy if exists listings_delete on public.listings;

create policy listings_read on public.listings for select
  using (
    (status = 'active' and published = true)   -- public feed
    or seller_id = auth.uid()                  -- own drafts
    or public.is_admin()                       -- admin sees everything
  );

create policy listings_insert on public.listings for insert
  with check (seller_id = auth.uid() or public.is_admin());

create policy listings_update on public.listings for update
  using (seller_id = auth.uid() or public.is_admin());

create policy listings_delete on public.listings for delete
  using (seller_id = auth.uid() or public.is_admin());

-- seller history: strictly private to its owner. Never visible to other sellers.
drop policy if exists seller_history_own on public.seller_text_history;
create policy seller_history_own on public.seller_text_history for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- Realtime — live feed updates without a manual refresh
-- ============================================================================
do $$
begin
  begin
    alter publication supabase_realtime add table public.listings;
  exception when duplicate_object then null;
  end;
end $$;
