import type { TickerConfig, TickerFont, TickerSegment, Tier } from '../types';
import { uid } from './storage';

export const TICKER_FONTS: Record<TickerFont, string> = {
  inter: "'Inter', 'Segoe UI', system-ui, sans-serif",
  mono: "ui-monospace, 'SF Mono', 'Cascadia Code', 'Courier New', monospace",
  serif: "'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
  condensed: "'Arial Narrow', 'Roboto Condensed', 'Segoe UI', sans-serif",
};

export const TICKER_FONT_LABELS: Array<{ id: TickerFont; label: string }> = [
  { id: 'inter', label: 'Inter Sans' },
  { id: 'mono', label: 'Monospace' },
  { id: 'serif', label: 'Serif' },
  { id: 'condensed', label: 'Condensed' },
];

/** Module 4.2 — inline emoji + icon library. */
export const ICON_LIBRARY: Array<{ group: string; items: string[] }> = [
  { group: 'Trending', items: ['🔥', '📈', '⚡', '🚀', '💥', '✨'] },
  { group: 'Awards', items: ['🏆', '🥇', '⭐', '👑', '💎', '🎖️'] },
  { group: 'Commerce', items: ['🏷️', '🛒', '💰', '💳', '🧾', '📦'] },
  { group: 'Signals', items: ['📢', '🔔', '✅', '⏰', '📍', '🎉'] },
];

export const BG_PRESETS = [
  'linear-gradient(90deg,#f2713a,#e0851b)',
  'linear-gradient(90deg,#111827,#374151)',
  'linear-gradient(90deg,#c08a2e,#e8c26a)',
  'linear-gradient(90deg,#16a34a,#4ade80)',
  'linear-gradient(90deg,#2563eb,#60a5fa)',
  'linear-gradient(90deg,#7c3aed,#a855f7)',
  'linear-gradient(90deg,#be123c,#fb7185)',
  '#fdeee5',
  '#111111',
];

export const TEXT_COLORS = ['#ffffff', '#14100a', '#fff7ed', '#ffe4c4', '#0c0b09', '#e8c26a', '#fde68a', '#bbf7d0'];

export function newSegment(partial: Partial<TickerSegment> = {}): TickerSegment {
  return {
    id: uid('seg'),
    leadIcon: '',
    text: 'New announcement',
    trailIcon: '',
    color: '',
    headColor: '',
    bold: false,
    italic: false,
    newLine: false,
    ...partial,
  };
}

export const DEFAULT_TICKER: TickerConfig = {
  enabled: true,
  playing: true,
  loop: true,
  speed: 30,
  fontSize: 13,
  font: 'inter',
  background: 'linear-gradient(90deg,#f2713a,#e0851b)',
  defaultColor: '#ffffff',
  showFeaturedListings: true,
  minTier: 'standard',
  segments: [
    newSegment({
      leadIcon: '🔥',
      text: 'Monsoon drop — Comprehensive storefronts get 2× reel impressions this week',
      headColor: '#fde68a',
      bold: true,
    }),
    newSegment({
      leadIcon: '🏆',
      text: 'Verified sellers rank first in every category search',
      trailIcon: '✅',
      italic: true,
    }),
    newSegment({
      leadIcon: '🏷️',
      text: 'Standard plan ₹200 — 3 ads, 4 photos and a social video embed',
    }),
  ],
};

const TIER_RANK: Record<Tier, number> = { free: 0, standard: 1, comprehensive: 2, dealer: 3 };

/** Module 4.3 — only listings at or above the configured tier are eligible. */
export function isTickerEligible(tier: Tier, featured: boolean, minTier: Tier): boolean {
  return featured || TIER_RANK[tier] >= TIER_RANK[minTier];
}

/** Converts speed (1–100) into a CSS animation duration. */
export function scrollDuration(speed: number, itemCount: number): number {
  const base = Math.max(6, 90 - speed);
  return base * Math.max(1, itemCount / 4);
}
