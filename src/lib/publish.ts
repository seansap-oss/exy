import type { Listing, TickerConfig } from '../types';
import { supabase, isSupabaseLive } from './supabase';
import { isUuid, listingToRow, providerColumns } from './listingsStore';
import { configToRow } from './tickerStore';

/**
 * Truthful publish layer.
 *
 * Every function here reports what the database actually did. A call only
 * resolves `ok: true` when Supabase confirms the write, so the Admin UI can
 * never show "published" for a row that never landed.
 *
 * Draft model: the existing `published` boolean on public.listings is reused,
 * so no schema migration is required.
 *   - Save Draft   → published = false  (hidden from the public feed by RLS)
 *   - Publish Live → published = true, status = 'active'
 */

export type PublishState = 'idle' | 'saving' | 'publishing' | 'saved' | 'published' | 'error';

export interface WriteResult {
  ok: boolean;
  /** Row id returned by the database — proof the write landed. */
  id: string | null;
  /** 'insert' or 'update', so callers can confirm no duplicate was created. */
  operation: 'insert' | 'update' | 'none';
  /** Exact failure reason, surfaced verbatim to the operator. */
  error: string | null;
  /** Human-readable classification for the UI. */
  reason?: 'not_configured' | 'permission_denied' | 'validation' | 'network' | 'unknown';
}

function classify(message: string): WriteResult['reason'] {
  const text = message.toLowerCase();
  if (text.includes('row-level security') || text.includes('permission') || text.includes('42501')) {
    return 'permission_denied';
  }
  if (text.includes('violates') || text.includes('null value') || text.includes('invalid')) return 'validation';
  if (text.includes('fetch') || text.includes('network') || text.includes('timeout')) return 'network';
  return 'unknown';
}

function offline(): WriteResult {
  return {
    ok: false,
    id: null,
    operation: 'none',
    error: 'Supabase is not configured — nothing was written to the live database.',
    reason: 'not_configured',
  };
}

/* -------------------------------------------------------------------------- */
/* Listings                                                                    */
/* -------------------------------------------------------------------------- */
export interface ListingValidation {
  valid: boolean;
  errors: string[];
}

/** Fields the public feed needs in order to render a listing correctly. */
export function validateForPublish(listing: Listing): ListingValidation {
  const errors: string[] = [];
  if (!listing.title || listing.title.trim().length < 6) errors.push('Title must be at least 6 characters.');
  if (!listing.categoryId) errors.push('Category is required.');
  if (!listing.sellerId) errors.push('Seller is required.');
  if (!listing.city?.trim() && !listing.location?.trim()) errors.push('Location or city is required.');
  return { valid: errors.length === 0, errors };
}

/** True when the row already exists, so we UPDATE instead of INSERT. */
async function rowExists(id: string): Promise<boolean> {
  if (!isSupabaseLive || !supabase || !isUuid(id)) return false;
  const { data } = await supabase.from('listings').select('id').eq('id', id).maybeSingle();
  return Boolean(data);
}

/**
 * seller_id must be the authenticated user's UUID — never a client-side id and
 * never a value the caller can choose. Returns null when signed out.
 */
async function authenticatedSellerId(): Promise<string | null> {
  if (!isSupabaseLive || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Finds an existing row for the same shared media so a retry updates instead
 * of creating a duplicate.
 */
async function findByProviderMedia(sellerId: string, listing: Listing): Promise<string | null> {
  if (!isSupabaseLive || !supabase || !listing.video?.externalId) return null;
  const { data, error } = await supabase
    .from('listings')
    .select('id')
    .eq('seller_id', sellerId)
    .eq('provider', listing.video.provider)
    .eq('provider_media_id', listing.video.externalId)
    .maybeSingle();
  if (error) return null; // migration 004 pending
  return data?.id ?? null;
}

/**
 * Writes a listing to production Supabase.
 * `publishLive=false` stores it as a private draft (published=false).
 * Existing rows are UPDATEd in place, preserving id, seller and media.
 */
export async function saveListing(listing: Listing, publishLive: boolean): Promise<WriteResult> {
  if (!isSupabaseLive || !supabase) return offline();

  if (publishLive) {
    const check = validateForPublish(listing);
    if (!check.valid) {
      return { ok: false, id: null, operation: 'none', error: check.errors.join(' '), reason: 'validation' };
    }
  }

  // Ownership always comes from the session, never from the client payload.
  const sellerId = await authenticatedSellerId();
  if (!sellerId) {
    return {
      ok: false,
      id: null,
      operation: 'none',
      error: 'You must be signed in to publish. Sign in and try again.',
      reason: 'permission_denied',
    };
  }

  const base = {
    ...listingToRow(listing),
    seller_id: sellerId,
    published: publishLive,
    status: publishLive ? 'active' : listing.status,
    updated_at: new Date().toISOString(),
  };
  // Migration 004 columns; dropped automatically if the migration is pending.
  const row = { ...base, ...providerColumns(listing) };

  try {
    // Update when we already hold a real UUID, or when the same shared media
    // was published before — so a retry never duplicates.
    const existingId = (await rowExists(listing.id))
      ? listing.id
      : await findByProviderMedia(sellerId, listing);

    if (existingId) {
      let { data, error } = await supabase.from('listings').update(row).eq('id', existingId).select('id').single();
      // Same guard as the insert path - PGRST204 must not trigger a retry.
      if (
        error != null &&
        (/column .* does not exist/i.test(error.message) || error.code === '42703' || error.code === 'PGRST205')
      ) {
        ({ data, error } = await supabase.from('listings').update(base).eq('id', existingId).select('id').single());
      }
      if (error) {
        return { ok: false, id: null, operation: 'update', error: error.message, reason: classify(error.message) };
      }
      return { ok: true, id: data?.id ?? existingId, operation: 'update', error: null };
    }

    // `id` is absent from `row`, so PostgreSQL generates the UUID.
    let { data, error } = await supabase.from('listings').insert(row).select('id').single();

    /*
     * Retry ONLY when a column genuinely does not exist.
     *
     * The previous condition also matched PGRST204, which Supabase returns
     * when `.single()` gets no row back — even though the INSERT succeeded.
     * That made every publish insert a second row (verified: 4 duplicate
     * pairs with identical 0ms timestamps). PGRST204 is now excluded.
     */
    const missingColumn =
      error != null &&
      (/column .* does not exist/i.test(error.message) || error.code === '42703' || error.code === 'PGRST205');

    if (missingColumn) {
      ({ data, error } = await supabase.from('listings').insert(base).select('id').single());
    }
    if (error) {
      return { ok: false, id: null, operation: 'insert', error: error.message, reason: classify(error.message) };
    }
    return { ok: true, id: data?.id ?? null, operation: 'insert', error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return { ok: false, id: null, operation: 'none', error: message, reason: 'network' };
  }
}

/** Flips an existing listing between public and hidden. */
export async function setListingPublished(id: string, published: boolean): Promise<WriteResult> {
  if (!isSupabaseLive || !supabase) return offline();
  try {
    const { data, error } = await supabase
      .from('listings')
      .update({ published, status: published ? 'active' : 'paused', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id')
      .single();
    if (error) {
      return { ok: false, id: null, operation: 'update', error: error.message, reason: classify(error.message) };
    }
    return { ok: true, id: data?.id ?? id, operation: 'update', error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return { ok: false, id: null, operation: 'update', error: message, reason: 'network' };
  }
}

/* -------------------------------------------------------------------------- */
/* Ticker                                                                      */
/* -------------------------------------------------------------------------- */
/**
 * Writes ticker settings to the shared production row (id = 1) and confirms
 * the round-trip. `enabled` doubles as the live-visibility flag: a draft is
 * stored with the operator's content but left hidden.
 */
export async function saveTicker(config: TickerConfig, publishLive: boolean): Promise<WriteResult> {
  if (!isSupabaseLive || !supabase) return offline();
  try {
    const row = {
      ...configToRow(config),
      visible: publishLive ? config.enabled : false,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('ticker_settings')
      .upsert(row, { onConflict: 'id' })
      .select('id')
      .single();
    if (error) {
      return { ok: false, id: null, operation: 'update', error: error.message, reason: classify(error.message) };
    }
    return { ok: true, id: String(data?.id ?? 1), operation: 'update', error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return { ok: false, id: null, operation: 'update', error: message, reason: 'network' };
  }
}

/** Reads a listing straight back from the database to prove it persisted. */
export async function verifyListingLive(id: string): Promise<{ found: boolean; published: boolean | null }> {
  if (!isSupabaseLive || !supabase) return { found: false, published: null };
  const { data } = await supabase.from('listings').select('id,published').eq('id', id).maybeSingle();
  return { found: Boolean(data), published: data ? Boolean(data.published) : null };
}
