-- ============================================================================
-- EXY — Shared taxonomy system (additive only)
--
-- One hierarchy used by the website, Android app, share drawer, single form,
-- bulk importer and search:
--   category → subcategory → type → brand → model
-- plus per-category attribute definitions that drive dynamic form fields and
-- dynamic search filters.
--
-- Stable text ids (e.g. 'computers', 'laptops') are used as primary keys so
-- the client can reference them without a round-trip, and so listings.
-- category_id / subcategory_id (already text) keep working unchanged.
--
-- Safe to run repeatedly. Nothing is dropped or renamed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Nodes: one self-referencing table covers category/subcategory/type/brand/model
-- ----------------------------------------------------------------------------
create table if not exists public.taxonomy_nodes (
  id         text primary key,
  parent_id  text references public.taxonomy_nodes(id) on delete cascade,
  level      text not null check (level in ('category','subcategory','type','brand','model','sector')),
  name       text not null,
  slug       text not null,
  icon       text,
  accent     text,
  sort_order int  not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists taxonomy_parent_idx on public.taxonomy_nodes(parent_id);
create index if not exists taxonomy_level_idx  on public.taxonomy_nodes(level) where active;

-- ----------------------------------------------------------------------------
-- Attribute definitions: drive dynamic form fields AND search filters
-- ----------------------------------------------------------------------------
create table if not exists public.taxonomy_attributes (
  id           text primary key,
  node_id      text not null references public.taxonomy_nodes(id) on delete cascade,
  key          text not null,
  label        text not null,
  input_type   text not null check (input_type in ('text','number','select','multiselect','boolean','range')),
  options      jsonb not null default '[]'::jsonb,
  unit         text,
  required     boolean not null default false,
  filterable   boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  unique (node_id, key)
);

create index if not exists taxonomy_attr_node_idx on public.taxonomy_attributes(node_id);

-- ----------------------------------------------------------------------------
-- Listings: carry the deeper taxonomy + free-form attribute values
-- ----------------------------------------------------------------------------
alter table public.listings add column if not exists type_id    text;
alter table public.listings add column if not exists brand_id   text;
alter table public.listings add column if not exists model_id   text;
alter table public.listings add column if not exists sector_id  text;
alter table public.listings add column if not exists attributes jsonb not null default '{}'::jsonb;

create index if not exists listings_type_idx  on public.listings(type_id)  where type_id  is not null;
create index if not exists listings_brand_idx on public.listings(brand_id) where brand_id is not null;
create index if not exists listings_attrs_idx on public.listings using gin (attributes);

-- ============================================================================
-- RLS: taxonomy is public read, admin write
-- ============================================================================
alter table public.taxonomy_nodes      enable row level security;
alter table public.taxonomy_attributes enable row level security;

drop policy if exists taxonomy_nodes_read  on public.taxonomy_nodes;
drop policy if exists taxonomy_nodes_write on public.taxonomy_nodes;
create policy taxonomy_nodes_read  on public.taxonomy_nodes for select using (true);
create policy taxonomy_nodes_write on public.taxonomy_nodes for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists taxonomy_attrs_read  on public.taxonomy_attributes;
drop policy if exists taxonomy_attrs_write on public.taxonomy_attributes;
create policy taxonomy_attrs_read  on public.taxonomy_attributes for select using (true);
create policy taxonomy_attrs_write on public.taxonomy_attributes for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- Seed — 12 main categories. Idempotent via ON CONFLICT.
-- ============================================================================
insert into public.taxonomy_nodes (id, parent_id, level, name, slug, sort_order) values
  ('mobiles',     null, 'category', 'Mobiles & Tablets',                 'mobiles-tablets',      1),
  ('computers',   null, 'category', 'Computers, Laptops & IT',           'computers-laptops-it', 2),
  ('electronics', null, 'category', 'Electronics & Appliances',          'electronics',          3),
  ('vehicles',    null, 'category', 'Vehicles',                          'vehicles',             4),
  ('property',    null, 'category', 'Property',                          'property',             5),
  ('home',        null, 'category', 'Home, Furniture & Garden',          'home-furniture',       6),
  ('fashion',     null, 'category', 'Fashion & Personal Items',          'fashion',              7),
  ('jobs',        null, 'category', 'Jobs & Employment',                 'jobs',                 8),
  ('services',    null, 'category', 'Services',                          'services',             9),
  ('business',    null, 'category', 'Business & Industrial',             'business-industrial', 10),
  ('leisure',     null, 'category', 'Books, Sports, Hobbies & Entertainment', 'leisure',        11),
  ('agri',        null, 'category', 'Pets, Animals & Agriculture',       'pets-agriculture',    12)
on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;
