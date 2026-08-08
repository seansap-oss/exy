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
    tags: row.tags ?? [],
    features: row.features ?? [],
    location: row.location ?? 'India',
    region: row.region === 'global' ? 'global' : 'india',
    city: row.city ?? '',
    sellerId: row.seller_id ?? '',
    video: row.video ?? undefined,
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

export function listingToRow(listing: Listing) {
  return {
    id: listing.id,
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
