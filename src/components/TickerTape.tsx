import { useMemo } from 'react';
import type { Listing, TickerConfig, TickerSegment } from '../types';
import { inr } from '../lib/format';
import { heightPreset, isTickerEligible, scrollDuration, TICKER_FONTS } from '../lib/ticker';
import { IconClose, IconFlame } from './Icons';

/* -------------------------------------------------------------------------- */
/* Segment renderer — colour-head, bold, italic, per-segment colour, icons     */
/* -------------------------------------------------------------------------- */
export function SegmentText({ segment, fallbackColor }: { segment: TickerSegment; fallbackColor: string }) {
  const words = segment.text.split(' ');
  const head = segment.headColor ? words[0] : '';
  const rest = segment.headColor ? words.slice(1).join(' ') : segment.text;

  return (
    <span
      style={{
        color: segment.color || fallbackColor,
        fontWeight: segment.bold ? 800 : 600,
        fontStyle: segment.italic ? 'italic' : 'normal',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
      }}
    >
      {segment.leadIcon && <span aria-hidden>{segment.leadIcon}</span>}
      <span>
        {head && <span style={{ color: segment.headColor, fontWeight: 800 }}>{head} </span>}
        {rest}
      </span>
      {segment.trailIcon && <span aria-hidden>{segment.trailIcon}</span>}
    </span>
  );
}

interface Props {
  config: TickerConfig;
  listings: Listing[];
  onDismiss?: () => void;
  onOpenListing?: (id: string) => void;
  preview?: boolean;
}

export function TickerTape({ config, listings, onDismiss, onOpenListing, preview = false }: Props) {
  const promoted = useMemo(
    () =>
      listings
        .filter((listing) => listing.status === 'active' && isTickerEligible(listing.tier, listing.featured, config.minTier))
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 8),
    [listings, config.minTier],
  );

  if (!config.enabled) return null;

  const items: Array<{ key: string; id?: string; node: React.ReactNode }> = config.segments.map((segment) => ({
    key: segment.id,
    node: <SegmentText segment={segment} fallbackColor={config.defaultColor} />,
  }));

  if (config.showFeaturedListings) {
    promoted.forEach((listing) => {
      items.push({
        key: listing.id,
        id: listing.id,
        node: (
          <>
            <span className="ticker__chip">{listing.tier === 'comprehensive' ? 'Featured' : 'Promoted'}</span>
            <span>{listing.title}</span>
            <b>{inr(listing.price)}</b>
            {listing.todayViews > 25 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, opacity: 0.9 }}>
                <IconFlame size={13} />
                {listing.todayViews} today
              </span>
            )}
          </>
        ),
      });
    });
  }

  if (!items.length) return null;

  const loop = config.loop ? [...items, ...items] : items;
  const duration = scrollDuration(config.speed, items.length);
  const preset = heightPreset(config.height ?? 'standard');
  const reverse = (config.direction ?? 'left') === 'right';

  return (
    <div
      className={`ticker ticker--${config.height ?? 'standard'}`}
      style={{
        background: config.background,
        color: config.defaultColor,
        fontSize: `${Math.round(config.fontSize * preset.fontScale)}px`,
        fontFamily: TICKER_FONTS[config.font],
      }}
    >
      <div className="ticker__viewport" style={{ paddingBlock: `${preset.padY}px` }}>
        <div
          className={`ticker__track${reverse ? ' ticker__track--rtl' : ''}`}
          style={{
            animationDuration: `${duration}s`,
            animationPlayState: config.playing ? 'running' : 'paused',
            animationIterationCount: config.loop ? 'infinite' : 1,
          }}
        >
          {loop.map((item, index) => (
            <span key={`${item.key}-${index}`} className="ticker__item">
              {item.id && onOpenListing ? (
                <button
                  type="button"
                  className="ticker__item"
                  style={{ color: 'inherit', font: 'inherit' }}
                  onClick={() => onOpenListing(item.id!)}
                >
                  {item.node}
                </button>
              ) : (
                item.node
              )}
              <i className="ticker__dot" />
            </span>
          ))}
        </div>
      </div>
      {!preview && onDismiss && (
        <button className="ticker__close" onClick={onDismiss} aria-label="Dismiss announcement">
          <IconClose size={14} />
        </button>
      )}
    </div>
  );
}

/** Static multi-line preview used inside the admin editor. */
export function TickerStack({ config }: { config: TickerConfig }) {
  const lines: TickerSegment[][] = [[]];
  config.segments.forEach((segment) => {
    if (segment.newLine && lines[lines.length - 1].length) lines.push([]);
    lines[lines.length - 1].push(segment);
  });

  return (
    <div
      style={{
        background: config.background,
        color: config.defaultColor,
        fontFamily: TICKER_FONTS[config.font],
        fontSize: config.fontSize,
        padding: '12px 16px',
        display: 'grid',
        gap: 6,
      }}
    >
      {lines.map((line, index) => (
        <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
          {line.map((segment) => (
            <SegmentText key={segment.id} segment={segment} fallbackColor={config.defaultColor} />
          ))}
        </div>
      ))}
    </div>
  );
}
