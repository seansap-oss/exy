-- ============================================================================
-- EXY — Visual Classifieds Platform
-- Supabase schema, row-level security policies and storage buckets.
-- Run in the Supabase SQL editor, or via `supabase db push`.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin create type user_role as enum ('user', 'admin'); exception when duplicate_object then null; end $$;
do $$ begin create type tier as enum ('free', 'standard', 'comprehensive', 'dealer'); exception when duplicate_object then null; end $$;
do $$ begin create type verification_level as enum ('none', 'verified-business', 'verified-inspector'); exception when duplicate_object then null; end $$;
do $$ begin create type listing_status as enum ('active', 'paused', 'sold'); exception when duplicate_object then null; end $$;
do $$ begin create type message_kind as enum ('text', 'image', 'callback', 'system'); exception when duplicate_object then null; end $$;
do $$ begin create type ad_event_kind as enum ('impression', 'view', 'click', 'save', 'unsave', 'lead'); exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Module 1 — profiles (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text not null,
  username          text not null unique
                      check (username ~ '^[a-z0-9_]{3,20}$'),
  email             text not null unique,
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
  avatar_color      text not null default '#f2713a',
  location          text not null default 'India',
  hide_phone        boolean not null default false,
  rating            numeric(2,1) not null default 5.0,
  response_time     text not null default 'New member',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Auto-create a profile row whenever Supabase Auth registers a user.
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
-- Module 3 — taxonomy
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id         text primary key,
  name       text not null,
  slug       text not null unique,
  icon       text not null default '',
  blurb      text not null default '',
  accent     text not null default '#f2713a',
  parent_id  text references public.categories(id) on delete cascade,
  tags       text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists categories_parent_idx on public.categories(parent_id);

-- ----------------------------------------------------------------------------
-- Listings
-- ----------------------------------------------------------------------------
create table if not exists public.listings (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null default '',
  price           numeric(12,2) not null default 0,
  price_unit      text,
  negotiable      boolean not null default true,
  category_id     text references public.categories(id) on delete set null,
  subcategory_id  text references public.categories(id) on delete set null,
  tags            text[] not null default '{}',
  features        text[] not null default '{}',
  location        text not null default 'India',
  region          text not null default 'india',
  city            text not null default '',
  seller_id       uuid not null references public.profiles(id) on delete cascade,
  video           jsonb,
  media           jsonb not null default '[]'::jsonb,
  photos          text[] not null default '{}',
  tier            tier not null default 'free',
  featured        boolean not null default false,
  condition       text not null default 'new',
  view_count      int not null default 0,
  save_count      int not null default 0,
  click_count     int not null default 0,
  lead_count      int not null default 0,
  today_views     int not null default 0,
  hide_phone      boolean not null default false,
  status          listing_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists listings_seller_idx   on public.listings(seller_id);
create index if not exists listings_category_idx on public.listings(category_id);
create index if not exists listings_status_idx   on public.listings(status);
create index if not exists listings_featured_idx on public.listings(featured) where featured;
create index if not exists listings_search_idx   on public.listings
  using gin (to_tsvector('english', title || ' ' || description || ' ' || coalesce(city, '')));

-- ----------------------------------------------------------------------------
-- Module 6.1 — saved ads
-- ----------------------------------------------------------------------------
create table if not exists public.saved_ads (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ----------------------------------------------------------------------------
-- Module 6.5 — messaging
-- ----------------------------------------------------------------------------
create table if not exists public.threads (
  id                 uuid primary key default gen_random_uuid(),
  listing_id         uuid not null references public.listings(id) on delete cascade,
  buyer_id           uuid not null references public.profiles(id) on delete cascade,
  seller_id          uuid not null references public.profiles(id) on delete cascade,
  last_message_at    timestamptz not null default now(),
  unread_for_buyer   int not null default 0,
  unread_for_seller  int not null default 0,
  created_at         timestamptz not null default now(),
  unique (listing_id, buyer_id, seller_id)
);

create table if not exists public.messages (
  id                uuid primary key default gen_random_uuid(),
  thread_id         uuid not null references public.threads(id) on delete cascade,
  sender_id         uuid not null references public.profiles(id) on delete cascade,
  kind              message_kind not null default 'text',
  body              text not null default '',
  image_src         text,
  callback_number   text,
  callback_approved boolean not null default false,
  read_at           timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists messages_thread_idx on public.messages(thread_id, created_at);

-- ----------------------------------------------------------------------------
-- Module 6.6 — analytics
-- ----------------------------------------------------------------------------
create table if not exists public.ad_events (
  id         bigserial primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete set null,
  kind       ad_event_kind not null,
  dwell_sec  numeric(6,2),
  created_at timestamptz not null default now()
);

create index if not exists ad_events_listing_idx on public.ad_events(listing_id, created_at desc);

-- Roll counters up onto the listing row. Views require a 10-second dwell.
create or replace function public.apply_ad_event()
returns trigger language plpgsql as $$
begin
  if new.kind = 'view' and coalesce(new.dwell_sec, 0) >= 10 then
    update public.listings
       set view_count = view_count + 1, today_views = today_views + 1
     where id = new.listing_id;
  elsif new.kind = 'click' then
    update public.listings set click_count = click_count + 1 where id = new.listing_id;
  elsif new.kind = 'save' then
    update public.listings set save_count = save_count + 1 where id = new.listing_id;
  elsif new.kind = 'unsave' then
    update public.listings set save_count = greatest(0, save_count - 1) where id = new.listing_id;
  elsif new.kind = 'lead' then
    update public.listings set lead_count = lead_count + 1 where id = new.listing_id;
  end if;
  return new;
end $$;

drop trigger if exists on_ad_event on public.ad_events;
create trigger on_ad_event
  after insert on public.ad_events
  for each row execute function public.apply_ad_event();

-- Nightly reset of the rolling 24h counter (schedule with pg_cron).
create or replace function public.reset_today_views()
returns void language sql as $$ update public.listings set today_views = 0; $$;

-- ----------------------------------------------------------------------------
-- Module 4 — ticker config (single row)
-- ----------------------------------------------------------------------------
create table if not exists public.ticker_config (
  id         int primary key default 1 check (id = 1),
  config     jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

-- ----------------------------------------------------------------------------
-- Module 5 — payments and dealer quotes
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  tier          tier not null,
  amount        numeric(12,2) not null,
  gst           numeric(12,2) not null default 0,
  method        text not null,
  gateway       text not null default 'razorpay',
  order_id      text not null,
  payment_id    text,
  signature     text,
  status        text not null default 'created',
  created_at    timestamptz not null default now()
);

create table if not exists public.dealer_quotes (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  price         numeric(12,2) not null,
  cadence       text not null default 'per quarter',
  notes         text not null default '',
  status        text not null default 'draft',
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table public.profiles      enable row level security;
alter table public.categories    enable row level security;
alter table public.listings      enable row level security;
alter table public.saved_ads     enable row level security;
alter table public.threads       enable row level security;
alter table public.messages      enable row level security;
alter table public.ad_events     enable row level security;
alter table public.ticker_config enable row level security;
alter table public.payments      enable row level security;
alter table public.dealer_quotes enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- profiles
drop policy if exists profiles_read   on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_read   on public.profiles for select using (true);
create policy profiles_update on public.profiles for update using (auth.uid() = id or public.is_admin());

-- categories — public read, admin write
drop policy if exists categories_read  on public.categories;
drop policy if exists categories_write on public.categories;
create policy categories_read  on public.categories for select using (true);
create policy categories_write on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- listings — public read of active ads; owners and admins manage
drop policy if exists listings_read   on public.listings;
drop policy if exists listings_insert on public.listings;
drop policy if exists listings_update on public.listings;
drop policy if exists listings_delete on public.listings;
create policy listings_read   on public.listings for select using (status = 'active' or seller_id = auth.uid() or public.is_admin());
create policy listings_insert on public.listings for insert with check (seller_id = auth.uid() or public.is_admin());
create policy listings_update on public.listings for update using (seller_id = auth.uid() or public.is_admin());
create policy listings_delete on public.listings for delete using (seller_id = auth.uid() or public.is_admin());

-- saved ads — strictly bound to the owning user
drop policy if exists saved_own on public.saved_ads;
create policy saved_own on public.saved_ads for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- threads and messages — participants only
drop policy if exists threads_participants on public.threads;
create policy threads_participants on public.threads for all
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin())
  with check (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists messages_participants on public.messages;
create policy messages_participants on public.messages for all
  using (exists (select 1 from public.threads t where t.id = thread_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())))
  with check (sender_id = auth.uid());

-- analytics — anyone may write an event, only owners/admins may read
drop policy if exists events_insert on public.ad_events;
drop policy if exists events_read   on public.ad_events;
create policy events_insert on public.ad_events for insert with check (true);
create policy events_read   on public.ad_events for select
  using (public.is_admin() or exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));

-- ticker — public read, admin write
drop policy if exists ticker_read  on public.ticker_config;
drop policy if exists ticker_write on public.ticker_config;
create policy ticker_read  on public.ticker_config for select using (true);
create policy ticker_write on public.ticker_config for all using (public.is_admin()) with check (public.is_admin());

-- payments and quotes — owner or admin
drop policy if exists payments_own on public.payments;
create policy payments_own on public.payments for all
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists quotes_read  on public.dealer_quotes;
drop policy if exists quotes_write on public.dealer_quotes;
create policy quotes_read  on public.dealer_quotes for select using (profile_id = auth.uid() or public.is_admin());
create policy quotes_write on public.dealer_quotes for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- Module 2.2 — Storage buckets
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('exy-video', 'exy-video', true, 209715200, array['video/mp4','video/webm','video/quicktime']),
  ('exy-image', 'exy-image', true,  20971520, array['image/jpeg','image/png','image/webp']),
  ('exy-audio', 'exy-audio', true,  52428800, array['audio/mpeg','audio/mp3','audio/wav','audio/ogg'])
on conflict (id) do nothing;

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects for select
  using (bucket_id in ('exy-video', 'exy-image', 'exy-audio'));

drop policy if exists media_auth_write on storage.objects;
create policy media_auth_write on storage.objects for insert to authenticated
  with check (bucket_id in ('exy-video', 'exy-image', 'exy-audio'));

drop policy if exists media_owner_delete on storage.objects;
create policy media_owner_delete on storage.objects for delete to authenticated
  using (bucket_id in ('exy-video', 'exy-image', 'exy-audio') and owner = auth.uid());
