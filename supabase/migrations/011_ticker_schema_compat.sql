-- EXY — additive ticker schema compatibility
-- Safe to run on the existing production project. Nothing is dropped or renamed.

alter table if exists public.ticker_settings
  add column if not exists playing boolean default true,
  add column if not exists loop boolean default true,
  add column if not exists font text default 'inter',
  add column if not exists font_size integer default 13,
  add column if not exists default_color text default '#ffffff',
  add column if not exists show_featured boolean default true,
  add column if not exists min_tier text default 'standard';

update public.ticker_settings
set
  playing = coalesce(playing, true),
  loop = coalesce(loop, true),
  font = coalesce(font, 'inter'),
  font_size = coalesce(font_size, 13),
  default_color = coalesce(default_color, '#ffffff'),
  show_featured = coalesce(show_featured, true),
  min_tier = coalesce(min_tier, 'standard')
where id = 1;
