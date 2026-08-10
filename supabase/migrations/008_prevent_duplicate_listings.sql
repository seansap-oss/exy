-- ============================================================================
-- EXY — Prevent duplicate listings (additive, non-destructive)
--
-- Cause of the existing duplicates: the client retried an INSERT when
-- Supabase returned PGRST204 from `.single()`. PGRST204 means "no row was
-- returned", not "column missing" — the first INSERT had already succeeded,
-- so a second identical row was written. Four pairs were created this way,
-- all with identical 0 ms timestamps. The client bug is fixed in
-- src/lib/publish.ts; this migration stops it recurring at the database
-- level and from any other client.
--
-- NOTE: existing duplicate rows are NOT deleted. A review query is provided
-- at the bottom so an operator can decide. Nothing here removes data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. One shared post per seller.
--    Only applies when a provider media id exists, so listings without media
--    are unaffected.
-- ----------------------------------------------------------------------------
create unique index if not exists listings_seller_provider_media_uniq
  on public.listings (seller_id, provider, provider_media_id)
  where provider_media_id is not null and provider is not null;

-- ----------------------------------------------------------------------------
-- 2. Block an accidental double-submit of the same title by the same seller
--    inside a 5-second window. Implemented as a trigger because a unique
--    index cannot express a time window.
-- ----------------------------------------------------------------------------
create or replace function public.block_rapid_duplicate_listing()
returns trigger language plpgsql as $$
declare
  recent_id uuid;
begin
  select id into recent_id
    from public.listings
   where seller_id = new.seller_id
     and lower(title) = lower(new.title)
     and created_at > now() - interval '5 seconds'
   limit 1;

  if recent_id is not null then
    raise exception
      'Duplicate submission blocked: "%" was just created (id %). Refresh before retrying.',
      new.title, recent_id
      using errcode = '23505';
  end if;

  return new;
end $$;

drop trigger if exists on_listing_rapid_duplicate on public.listings;
create trigger on_listing_rapid_duplicate
  before insert on public.listings
  for each row execute function public.block_rapid_duplicate_listing();

-- ----------------------------------------------------------------------------
-- 3. REVIEW ONLY — lists existing duplicates. Deletes nothing.
--    Run this to inspect, then remove rows manually if you choose.
--
--   select title, seller_id, count(*) as copies,
--          array_agg(id order by created_at) as ids
--     from public.listings
--    group by title, seller_id
--   having count(*) > 1
--    order by copies desc;
--
--    To delete the newer copy of each pair AFTER reviewing:
--
--   delete from public.listings a
--    using public.listings b
--    where a.seller_id = b.seller_id
--      and lower(a.title) = lower(b.title)
--      and a.created_at >= b.created_at
--      and a.id > b.id;
-- ----------------------------------------------------------------------------
