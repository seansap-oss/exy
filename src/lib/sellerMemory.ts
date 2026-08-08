import { supabase, isSupabaseLive } from './supabase';
import { load, save } from './storage';

/* ==========================================================================
   Feature 2 — Location memory
   Stores only the latest practical posting location. Never tracks silently.
   ========================================================================== */
const LOCATION_KEY = 'lastLocation';

export interface LastLocation {
  city: string;
  area: string;
  savedAt: string;
}

export function readLastLocation(): LastLocation | null {
  return load<LastLocation | null>(LOCATION_KEY, null);
}

export function writeLastLocation(city: string, area: string, profileId?: string): void {
  const city_ = city.trim();
  if (!city_) return;
  save<LastLocation>(LOCATION_KEY, { city: city_, area: area.trim(), savedAt: new Date().toISOString() });

  // Mirror onto the authenticated profile so it follows the user across devices.
  if (profileId && isSupabaseLive && supabase) {
    void supabase
      .from('profiles')
      .update({ last_location: area.trim() ? `${area.trim()}|${city_}` : city_ })
      .eq('id', profileId);
  }
}

export function clearLastLocation(profileId?: string): void {
  save<LastLocation | null>(LOCATION_KEY, null);
  if (profileId && isSupabaseLive && supabase) {
    void supabase.from('profiles').update({ last_location: null }).eq('id', profileId);
  }
}

/** Only called when the user explicitly taps "Use current location". */
export function requestCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60_000 },
    );
  });
}

/* ==========================================================================
   Feature 3 — Private seller text history
   Private to the authenticated user. Prices are never stored.
   ========================================================================== */
export type TextType = 'location' | 'description' | 'business' | 'phrase';

export interface HistoryEntry {
  id: string;
  textValue: string;
  textType: TextType;
  usageCount: number;
  lastUsedAt: string;
  createdAt: string;
}

const HISTORY_KEY = 'sellerHistory';
const MAX_PER_TYPE = 25;

/** Strips anything price-shaped so cost figures never enter the history. */
const PRICE_RE = /(?:₹|rs\.?|inr)\s*[\d,]+(?:\.\d+)?|\b\d[\d,]{2,}(?:\.\d+)?\s*(?:rs|inr|rupees|\/-)/gi;

export function stripPrices(value: string): string {
  return value.replace(PRICE_RE, '').replace(/\s{2,}/g, ' ').trim();
}

function readAll(): HistoryEntry[] {
  return load<HistoryEntry[]>(HISTORY_KEY, []);
}

function writeAll(entries: HistoryEntry[]): void {
  save(HISTORY_KEY, entries);
}

export function readHistory(type: TextType): HistoryEntry[] {
  return readAll()
    .filter((entry) => entry.textType === type)
    .sort((a, b) => b.usageCount - a.usageCount || +new Date(b.lastUsedAt) - +new Date(a.lastUsedAt));
}

/**
 * Records a value the seller actually used. Deduplicates case-insensitively
 * and bumps usage_count so the most-used phrases surface first.
 */
export function rememberText(type: TextType, rawValue: string, profileId?: string): void {
  const value = type === 'description' || type === 'phrase' ? stripPrices(rawValue) : rawValue.trim();
  if (value.length < 3) return;

  const entries = readAll();
  const now = new Date().toISOString();
  const index = entries.findIndex(
    (entry) => entry.textType === type && entry.textValue.toLowerCase() === value.toLowerCase(),
  );

  if (index >= 0) {
    entries[index] = { ...entries[index], usageCount: entries[index].usageCount + 1, lastUsedAt: now };
  } else {
    entries.push({
      id: `${type}_${Date.now().toString(36)}`,
      textValue: value,
      textType: type,
      usageCount: 1,
      lastUsedAt: now,
      createdAt: now,
    });
  }

  // Cap per type, dropping the least-used first.
  const kept = (['location', 'description', 'business', 'phrase'] as TextType[]).flatMap((kind) =>
    entries
      .filter((entry) => entry.textType === kind)
      .sort((a, b) => b.usageCount - a.usageCount || +new Date(b.lastUsedAt) - +new Date(a.lastUsedAt))
      .slice(0, MAX_PER_TYPE),
  );
  writeAll(kept);

  if (profileId && isSupabaseLive && supabase) {
    void supabase.from('seller_text_history').upsert(
      {
        user_id: profileId,
        text_value: value,
        text_type: type,
        last_used_at: now,
        usage_count: index >= 0 ? entries[index].usageCount : 1,
      },
      { onConflict: 'user_id,text_type,text_value' },
    );
  }
}

export function forgetText(id: string, profileId?: string): void {
  const entries = readAll();
  const target = entries.find((entry) => entry.id === id);
  writeAll(entries.filter((entry) => entry.id !== id));

  if (target && profileId && isSupabaseLive && supabase) {
    void supabase
      .from('seller_text_history')
      .delete()
      .eq('user_id', profileId)
      .eq('text_type', target.textType)
      .eq('text_value', target.textValue);
  }
}

export function clearHistory(type?: TextType, profileId?: string): void {
  writeAll(type ? readAll().filter((entry) => entry.textType !== type) : []);
  if (profileId && isSupabaseLive && supabase) {
    const query = supabase.from('seller_text_history').delete().eq('user_id', profileId);
    void (type ? query.eq('text_type', type) : query);
  }
}

/** Hydrates local cache from the private Supabase table on sign-in. */
export async function syncHistoryFromRemote(profileId: string): Promise<void> {
  if (!isSupabaseLive || !supabase) return;
  try {
    const { data, error } = await supabase
      .from('seller_text_history')
      .select('*')
      .eq('user_id', profileId)
      .order('last_used_at', { ascending: false })
      .limit(120);
    if (error || !data) return;

    const local = readAll();
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const remote: HistoryEntry[] = data.map((row: any) => ({
      id: row.id,
      textValue: row.text_value,
      textType: row.text_type,
      usageCount: row.usage_count ?? 1,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
    }));

    const seen = new Set(remote.map((entry) => `${entry.textType}::${entry.textValue.toLowerCase()}`));
    const merged = [...remote, ...local.filter((entry) => !seen.has(`${entry.textType}::${entry.textValue.toLowerCase()}`))];
    writeAll(merged);
  } catch {
    /* offline — local cache stands */
  }
}
