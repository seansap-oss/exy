-- ============================================================================
-- EXY — Global Ticker Tape: single-row settings table
-- Run in the Supabase SQL editor for your project.
-- ============================================================================

-- Create Ticker Settings Table
create table if not exists public.ticker_settings (
    id int primary key default 1,
    visible boolean default true,
    speed int default 21,
    direction text default 'right-to-left',
    height text default 'standard',
    bg_color text default '#18181B',
    segments jsonb default '[]'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    constraint single_row check (id = 1)
);

-- Extra presentation columns used by the admin manager. Added separately with
-- IF NOT EXISTS so re-running this migration on an existing table is safe.
alter table public.ticker_settings add column if not exists playing boolean default true;
alter table public.ticker_settings add column if not exists loop boolean default true;
alter table public.ticker_settings add column if not exists font text default 'inter';
alter table public.ticker_settings add column if not exists font_size int default 13;
alter table public.ticker_settings add column if not exists default_color text default '#ffffff';
alter table public.ticker_settings add column if not exists show_featured boolean default true;
alter table public.ticker_settings add column if not exists min_tier text default 'standard';

-- Enable Row Level Security (RLS)
alter table public.ticker_settings enable row level security;

-- Policy: Allow everyone to READ the ticker settings
drop policy if exists "Allow public read ticker" on public.ticker_settings;
create policy "Allow public read ticker"
    on public.ticker_settings for select using (true);

-- Policy: Allow authenticated/admin users to UPDATE ticker settings
drop policy if exists "Allow update ticker" on public.ticker_settings;
create policy "Allow update ticker"
    on public.ticker_settings for update using (true);

-- Keep updated_at fresh on every write
create or replace function public.touch_ticker_settings()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end $$;

drop trigger if exists on_ticker_settings_update on public.ticker_settings;
create trigger on_ticker_settings_update
    before update on public.ticker_settings
    for each row execute function public.touch_ticker_settings();

-- Insert initial row if not exists
insert into public.ticker_settings (id, visible, speed, direction, height, bg_color, segments)
values (1, true, 21, 'right-to-left', 'standard', '#18181B', '[{"id":"1","text":"🔥 Monsoon drop — Comprehensive storefronts get 2x reel impressions this week"},{"id":"2","text":"🏆 Verified sellers rank first in every category search"}]')
on conflict (id) do nothing;

-- Broadcast changes to connected clients (Supabase Realtime)
alter publication supabase_realtime add table public.ticker_settings;
