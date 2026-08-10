import type { Listing } from '../types';
import { supabase, isSupabaseLive } from './supabase';

const TABLE = 'listings';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function rowToListing(row: any): Listing {
  return {
    id: row.id,
    title: row.title ?? '',
    description: row.description ?? '',
    price: Number(row.price ?? 0),
    priceUnit: row.price_unit ?? undefined,
    negotiable: row.negotiable ?? true,
    categoryId: row.category_id ?? '',
    subCategoryId: row.subcategory_id ?? '',
    typeId: row.type_id ?? undefined,
    attributes: row.attributes ?? undefined,
    tags: row.tags ?? [],
    features: row.features ?? [],
    location: row.location ?? 'India',
    region: row.region === 'global' ? 'global' : 'india',
    city: row.city ?? '',
    sellerId: row.seller_id ?? '',
    // Prefer the dedicated text columns; fall back to legacy jsonb.
    video: row.video ??
      (row.video_url
        ? {
            provider: row.provider ?? 'none',
            url: row.video_url,
            externalId: row.provider_media_id ?? '',
            embedSrc: row.video_url,
            poster: row.thumbnail_url ?? undefined,
          }
        : undefined),
    media: row.media?.length ? row.media : undefined,
    photos: row.photos?.length ? row.photos : ['linear-gradient(135deg,#FFB300,#FF9500)'],
    tier: row.tier ?? 'free',
    featured: !!row.featured,
    condition: row.condition ?? 'new',
    createdAt: row.created_at ?? new Date().toISOString(),
    viewCount: row.view_count ?? 0,
    saveCount: row.save_count ?? 0,
    clickCount: row.click_count ?? 0,
    leadCount: row.lead_count ?? 0,
    todayViews: row.today_views ?? 0,
    hidePhone: !!row.hide_phone,
    status: row.status ?? 'active',
  };
}

/** True for a real PostgreSQL UUID, false for client ids like `lst_abc123`. */
export function isUuid(value: string | null | undefined): boolean {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Maps a Listing to a `listings` row.
 *
 * `id` is deliberately omitted — client ids look like `lst_msmi4xnlmphphhw`
 * and are not UUIDs, so passing one produced:
 *   invalid input syntax for type uuid: "lst_msmi4xnlmphphhw"
 * PostgreSQL generates the UUID on insert; updates target the row by its real
 * UUID in the .eq() clause instead. Provider references live in text columns.
 */
export function listingToRow(listing: Listing) {
  return {
    title: listing.title,
    description: listing.description,
    price: listing.price,
    price_unit: listing.priceUnit ?? null,
    negotiable: listing.negotiable,
    category_id: listing.categoryId,
    subcategory_id: listing.subCategoryId,
    tags: listing.tags,
    features: listing.features,
    location: listing.location,
    region: listing.region,
    city: listing.city,
    seller_id: listing.sellerId,
    video: listing.video ?? null,
    media: listing.media ?? [],
    photos: listing.photos,
    tier: listing.tier,
    featured: listing.featured,
    condition: listing.condition,
    view_count: listing.viewCount,
    save_count: listing.saveCount,
    click_count: listing.clickCount,
    lead_count: listing.leadCount,
    today_views: listing.todayViews,
    hide_phone: listing.hidePhone,
    status: listing.status,
    published: true,
    created_at: listing.createdAt,
  };
}

/**
 * Provider reference columns added by migration 004. Kept separate so the
 * insert can retry without them if the migration has not been applied yet —
 * the shortcode must never fall back into a UUID column.
 */
export function providerColumns(listing: Listing) {
  return {
    type_id: listing.typeId ?? null,
    attributes: listing.attributes ?? {},
    provider: listing.video?.provider ?? null,
    provider_media_id: listing.video?.externalId ?? null,
    video_url: listing.video?.url ?? null,
    thumbnail_url: listing.video?.poster ?? null,
    client_ref: listing.id,
  };
}

export interface FetchResult {
  listings: Listing[] | null;
  error: string | null;
}

/** Reads the live feed. Returns null when Supabase is unavailable. */
export async function fetchListings(): Promise<FetchResult> {
  if (!isSupabaseLive || !supabase) return { listings: null, error: null };
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      // Drafts (published=false) must never reach the public feed. RLS already
      // hides them from anonymous visitors, but a signed-in seller or admin can
      // legitimately SELECT their own drafts — so the feed filters explicitly
      // to keep website and Android identical for every viewer.
      .eq('published', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) return { listings: null, error: error.message };
    return { listings: (data ?? []).map(rowToListing), error: null };
  } catch (error) {
    return { listings: null, error: error instanceof Error ? error.message : 'network error' };
  }
}

export interface PublishResult {
  ok: boolean;
  id: string | null;
  error: string | null;
}

/**
 * Inserts a listing and returns the row id so callers can prove the write
 * landed. A failure is surfaced, never swallowed.
 */
export async function publishListing(listing: Listing): Promise<PublishResult> {
  if (!isSupabaseLive || !supabase) return { ok: true, id: listing.id, error: null };
  try {
    const { data, error } = await supabase.from(TABLE).insert(listingToRow(listing)).select('id').single();
    if (error) return { ok: false, id: null, error: error.message };
    return { ok: true, id: data?.id ?? null, error: null };
  } catch (error) {
    return { ok: false, id: null, error: error instanceof Error ? error.message : 'network error' };
  }
}

/** Fire-and-forget counter/state sync; never blocks the UI. */
export function patchListing(id: string, patch: Record<string, unknown>): void {
  if (!isSupabaseLive || !supabase) return;
  void supabase.from(TABLE).update(patch).eq('id', id);
}

export function removeListing(id: string): void {
  if (!isSupabaseLive || !supabase) return;
  void supabase.from(TABLE).delete().eq('id', id);
}

/** Realtime subscription so new posts appear without a manual refresh. */
export function subscribeListings(onChange: () => void): () => void {
  if (!isSupabaseLive || !supabase) return () => undefined;
  const channel = supabase
    .channel('listings_live')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => onChange())
    .subscribe();
  return () => {
    if (supabase) void supabase.removeChannel(channel);
  };
}
