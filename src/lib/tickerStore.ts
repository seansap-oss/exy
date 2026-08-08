import type { TickerConfig, TickerDirection, TickerHeight } from '../types';
import { supabase, isSupabaseLive } from './supabase';
import { loadMerged, save } from './storage';
import { DEFAULT_TICKER } from './ticker';

export const TICKER_EVENT = 'ticker_updated';
const TABLE = 'ticker_settings';
const ROW_ID = 1;

/* -------------------------------------------------------------------------- */
/* Row <-> config mapping                                                      */
/* -------------------------------------------------------------------------- */
/** DB stores the human-readable direction; the renderer uses left/right. */
function toDirection(value: unknown): TickerDirection {
  return value === 'left-to-right' || value === 'right' ? 'right' : 'left';
}

function fromDirection(direction: TickerDirection): string {
  return direction === 'right' ? 'left-to-right' : 'right-to-left';
}

function toHeight(value: unknown): TickerHeight {
  return value === 'compact' || value === 'large' ? value : 'standard';
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function rowToConfig(row: any): TickerConfig {
  if (!row) return DEFAULT_TICKER;
  const segments = Array.isArray(row.segments) ? row.segments : [];
  return {
    ...DEFAULT_TICKER,
    // `visible: undefined` must never hide the bar.
    enabled: row.visible ?? true,
    playing: row.playing ?? true,
    loop: row.loop ?? true,
    speed: typeof row.speed === 'number' ? row.speed : DEFAULT_TICKER.speed,
    direction: toDirection(row.direction),
    height: toHeight(row.height),
    background: row.bg_color || DEFAULT_TICKER.background,
    font: row.font ?? DEFAULT_TICKER.font,
    fontSize: row.font_size ?? DEFAULT_TICKER.fontSize,
    defaultColor: row.default_color ?? DEFAULT_TICKER.defaultColor,
    showFeaturedListings: row.show_featured ?? true,
    minTier: row.min_tier ?? DEFAULT_TICKER.minTier,
    segments: segments.length
      ? segments.map((segment: any, index: number) => ({
          id: String(segment.id ?? index + 1),
          text: String(segment.text ?? ''),
          leadIcon: segment.leadIcon ?? '',
          trailIcon: segment.trailIcon ?? '',
          color: segment.color ?? '',
          headColor: segment.headColor ?? '',
          bold: !!segment.bold,
          italic: !!segment.italic,
          newLine: !!segment.newLine,
        }))
      : DEFAULT_TICKER.segments,
  };
}

export function configToRow(config: TickerConfig) {
  return {
    id: ROW_ID,
    visible: config.enabled,
    playing: config.playing,
    loop: config.loop,
    speed: config.speed,
    direction: fromDirection(config.direction),
    height: config.height,
    bg_color: config.background,
    font: config.font,
    font_size: config.fontSize,
    default_color: config.defaultColor,
    show_featured: config.showFeaturedListings,
    min_tier: config.minTier,
    segments: config.segments,
  };
}

/* -------------------------------------------------------------------------- */
/* Read / write                                                                */
/* -------------------------------------------------------------------------- */
/**
 * Synchronous seed used for the very first paint so the bar is never blank.
 * Falls back to DEFAULT_TICKER when nothing is stored, and merges partial
 * records so fields added after a save still resolve.
 */
export function readTickerLocal(): TickerConfig {
  const stored = loadMerged<TickerConfig>('ticker', DEFAULT_TICKER);
  return { ...stored, enabled: stored.enabled ?? true };
}

/** Fetches the single settings row. Returns null when unavailable. */
export async function fetchTicker(): Promise<TickerConfig | null> {
  if (!isSupabaseLive || !supabase) return null;
  try {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', ROW_ID).maybeSingle();
    if (error || !data) return null;
    return rowToConfig(data);
  } catch {
    return null;
  }
}

/** Persists locally first (instant), then upserts to Supabase when configured. */
export async function persistTicker(config: TickerConfig): Promise<void> {
  save('ticker', config);
  broadcastTicker(config);
  if (!isSupabaseLive || !supabase) return;
  try {
    await supabase.from(TABLE).upsert(configToRow(config), { onConflict: 'id' });
  } catch {
    /* offline-tolerant: local state remains the source of truth */
  }
}

/* -------------------------------------------------------------------------- */
/* Live broadcast — admin edits reflect instantly, no refresh                   */
/* -------------------------------------------------------------------------- */
export function broadcastTicker(config: TickerConfig): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<TickerConfig>(TICKER_EVENT, { detail: config }));
}

/** Subscribes to same-tab broadcasts, cross-tab storage writes and Realtime. */
export function subscribeTicker(onChange: (config: TickerConfig) => void): () => void {
  const onLocal = (event: Event) => {
    const detail = (event as CustomEvent<TickerConfig>).detail;
    if (detail) onChange(detail);
  };
  window.addEventListener(TICKER_EVENT, onLocal);

  const onStorage = (event: StorageEvent) => {
    if (!event.key?.endsWith('ticker') || !event.newValue) return;
    try {
      onChange({ ...DEFAULT_TICKER, ...JSON.parse(event.newValue) });
    } catch {
      /* ignore malformed payloads */
    }
  };
  window.addEventListener('storage', onStorage);

  let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
  if (isSupabaseLive && supabase) {
    channel = supabase
      .channel('ticker_settings_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
        if (payload.new) onChange(rowToConfig(payload.new));
      })
      .subscribe();
  }

  return () => {
    window.removeEventListener(TICKER_EVENT, onLocal);
    window.removeEventListener('storage', onStorage);
    if (channel && supabase) void supabase.removeChannel(channel);
  };
}
