import type { AdEvent, AdEventKind, Listing } from '../types';
import { supabase, isSupabaseLive, SUPABASE_TABLES } from './supabase';
import { load, save, uid } from './storage';

/** Module 6.6 — a "view" only counts after this many seconds of dwell. */
export const VIEW_DWELL_SECONDS = 10;

export function readEvents(): AdEvent[] {
  return load<AdEvent[]>('events', []);
}

export function writeEvents(events: AdEvent[]): void {
  save('events', events.slice(-4000));
}

export function track(
  listingId: string,
  kind: AdEventKind,
  userId: string | null,
  dwellSec?: number,
): AdEvent {
  const event: AdEvent = {
    id: uid('evt'),
    listingId,
    userId,
    kind,
    dwellSec,
    createdAt: new Date().toISOString(),
  };

  const events = readEvents();
  writeEvents([...events, event]);

  if (isSupabaseLive && supabase) {
    void supabase.from(SUPABASE_TABLES.analytics).insert({
      listing_id: listingId,
      user_id: userId,
      kind,
      dwell_sec: dwellSec ?? null,
    });
  }

  return event;
}

export interface AdMetrics {
  impressions: number;
  views: number;
  clicks: number;
  saves: number;
  leads: number;
  todayViews: number;
  avgDwell: number;
}

export function metricsFor(listing: Listing, events: AdEvent[]): AdMetrics {
  const mine = events.filter((event) => event.listingId === listing.id);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const views = mine.filter((event) => event.kind === 'view');
  const dwells = views.map((event) => event.dwellSec ?? 0).filter(Boolean);

  return {
    impressions: mine.filter((event) => event.kind === 'impression').length + listing.clickCount,
    views: views.length + listing.viewCount,
    clicks: mine.filter((event) => event.kind === 'click').length + listing.clickCount,
    saves: mine.filter((event) => event.kind === 'save').length + listing.saveCount,
    leads: mine.filter((event) => event.kind === 'lead').length + listing.leadCount,
    todayViews:
      views.filter((event) => new Date(event.createdAt) >= startOfDay).length + listing.todayViews,
    avgDwell: dwells.length ? dwells.reduce((sum, value) => sum + value, 0) / dwells.length : 0,
  };
}

/** Module 6.3 — urgency threshold. */
export const URGENCY_THRESHOLD = 14;

export function isUrgent(todayViews: number): boolean {
  return todayViews >= URGENCY_THRESHOLD;
}

export function urgencyText(todayViews: number): string {
  return `Popular Ad! ${todayViews} buyers viewed this today — contact seller before it's gone.`;
}
