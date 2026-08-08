import { useCallback, useEffect, useRef, useState } from 'react';
import type { Listing, Seller } from '../types';
import { providerAllow, providerLabel } from '../lib/embeds';
import { inr } from '../lib/format';
import { isUrgent, urgencyText, VIEW_DWELL_SECONDS } from '../lib/analytics';
import {
  IconChat,
  IconChevron,
  IconClose,
  IconHeart,
  IconMuted,
  IconPin,
  IconPlay,
  IconShield,
  IconUnmuted,
  IconVideo,
} from './Icons';

interface Props {
  listings: Listing[];
  sellerMap: Record<string, Seller>;
  saved: string[];
  startId?: string;
  onToggleSave: (id: string) => void;
  onOpenListing: (id: string) => void;
  onContact: (id: string) => void;
  /** fires once a card has been dwelled on for >10s */
  onQualifiedView: (id: string, dwellSec: number) => void;
  onImpression: (id: string) => void;
}

/**
 * Module 6.2 — cascading card stack.
 * Renders the active slide plus 3 stacked behind it to convey depth.
 * Native video autoplays muted; the mute toggle (bottom-right) enables audio.
 * A second interaction opens the immersive 9:16 fullscreen player.
 */
export function VisualFeed({
  listings,
  sellerMap,
  saved,
  startId,
  onToggleSave,
  onOpenListing,
  onContact,
  onQualifiedView,
  onImpression,
}: Props) {
  const deck = listings.filter((listing) => listing.status === 'active');
  const initial = Math.max(0, startId ? deck.findIndex((listing) => listing.id === startId) : 0);

  const [index, setIndex] = useState(initial);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);
  const [fullscreen, setFullscreen] = useState<Listing | null>(null);
  const [drag, setDrag] = useState(0);

  const dwellRef = useRef<{ id: string; at: number } | null>(null);
  const countedRef = useRef<Set<string>>(new Set());
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  const active = deck[index];

  /* --------------------------- dwell-based view tracking -------------------------- */
  const flushDwell = useCallback(() => {
    const record = dwellRef.current;
    if (!record) return;
    const dwellSec = (Date.now() - record.at) / 1000;
    if (dwellSec >= VIEW_DWELL_SECONDS && !countedRef.current.has(record.id)) {
      countedRef.current.add(record.id);
      onQualifiedView(record.id, dwellSec);
    }
    dwellRef.current = null;
  }, [onQualifiedView]);

  useEffect(() => {
    if (!active) return;
    flushDwell();
    dwellRef.current = { id: active.id, at: Date.now() };
    onImpression(active.id);
    return () => flushDwell();
  }, [active, flushDwell, onImpression]);

  useEffect(() => () => flushDwell(), [flushDwell]);

  /* -------------------------------- navigation -------------------------------- */
  const step = useCallback(
    (delta: number) => {
      setIndex((prev) => Math.min(deck.length - 1, Math.max(0, prev + delta)));
      setDrag(0);
    },
    [deck.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (fullscreen) {
        if (event.key === 'Escape') setFullscreen(null);
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') step(-1);
      if (event.key === 'm') setMuted((prev) => !prev);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, fullscreen]);

  if (!deck.length || !active) {
    return (
      <div className="feed">
        <div className="empty">
          <b>No visual listings yet</b>
          <p>Reels and video ads will appear here as sellers publish them.</p>
        </div>
      </div>
    );
  }

  const stack = deck.slice(index, index + 4);

  return (
    <div className="feed">
      <div className="feed__stage">
        <div
          className="feed__stack"
          onPointerDown={(event) => {
            pointerRef.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerMove={(event) => {
            if (!pointerRef.current) return;
            setDrag(event.clientY - pointerRef.current.y);
          }}
          onPointerUp={() => {
            if (Math.abs(drag) > 70) step(drag < 0 ? 1 : -1);
            else setDrag(0);
            pointerRef.current = null;
          }}
          onPointerLeave={() => {
            setDrag(0);
            pointerRef.current = null;
          }}
        >
          {stack
            .map((listing, depth) => ({ listing, depth }))
            .reverse()
            .map(({ listing, depth }) => (
              <FeedCard
                key={listing.id}
                listing={listing}
                seller={sellerMap[listing.sellerId]}
                depth={depth}
                drag={depth === 0 ? drag : 0}
                muted={muted}
                started={started && depth === 0}
                saved={saved.includes(listing.id)}
                onStart={() => setStarted(true)}
                onExpand={() => setFullscreen(listing)}
                onToggleSave={() => onToggleSave(listing.id)}
                onDetails={() => onOpenListing(listing.id)}
                onContact={() => onContact(listing.id)}
              />
            ))}
        </div>

        <div className="feed__rail">
          <button className="feed__nav" onClick={() => step(-1)} disabled={index === 0} aria-label="Previous">
            <span style={{ transform: 'rotate(-90deg)', display: 'grid' }}>
              <IconChevron size={18} />
            </span>
          </button>
          <span className="feed__counter">
            {index + 1} / {deck.length}
          </span>
          <button
            className="feed__nav"
            onClick={() => step(1)}
            disabled={index >= deck.length - 1}
            aria-label="Next"
          >
            <span style={{ transform: 'rotate(90deg)', display: 'grid' }}>
              <IconChevron size={18} />
            </span>
          </button>
        </div>
      </div>

      {/* Mute / unmute — bottom right. Tapping this (not swiping) enables audio. */}
      <button
        className={`feed__mute${muted ? '' : ' is-live'}`}
        onClick={() => {
          setMuted((prev) => !prev);
          setStarted(true);
        }}
        aria-label={muted ? 'Unmute audio' : 'Mute audio'}
      >
        {muted ? <IconMuted size={20} /> : <IconUnmuted size={20} />}
        <span>{muted ? 'Tap for sound' : 'Sound on'}</span>
      </button>

      {fullscreen && <FullscreenPlayer listing={fullscreen} onClose={() => setFullscreen(null)} />}
    </div>
  );
}

/* ========================================================================== */
/* Individual stacked card                                                     */
/* ========================================================================== */
function FeedCard({
  listing,
  seller,
  depth,
  drag,
  muted,
  started,
  saved,
  onStart,
  onExpand,
  onToggleSave,
  onDetails,
  onContact,
}: {
  listing: Listing;
  seller?: Seller;
  depth: number;
  drag: number;
  muted: boolean;
  started: boolean;
  saved: boolean;
  onStart: () => void;
  onExpand: () => void;
  onToggleSave: () => void;
  onDetails: () => void;
  onContact: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const nativeVideo = listing.media?.find((item) => item.kind === 'video');
  const isTop = depth === 0;

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    element.muted = muted;
    if (isTop) void element.play().catch(() => undefined);
    else element.pause();
  }, [muted, isTop]);

  const poster = nativeVideo?.poster ?? listing.video?.poster;

  return (
    <article
      className={`feed-card${isTop ? ' is-top' : ''}`}
      style={{
        transform: `translate3d(0, ${depth * -14 + (isTop ? drag * 0.35 : 0)}px, 0) scale(${1 - depth * 0.045})`,
        opacity: depth > 2 ? 0 : 1 - depth * 0.12,
        zIndex: 10 - depth,
        pointerEvents: isTop ? 'auto' : 'none',
      }}
    >
      <div className="feed-card__media">
        {nativeVideo ? (
          <video
            ref={videoRef}
            src={nativeVideo.src}
            poster={nativeVideo.poster}
            muted={muted}
            loop
            playsInline
            autoPlay={isTop}
            className="feed-card__video"
          />
        ) : started && listing.video ? (
          <iframe
            src={`${listing.video.embedSrc}${listing.video.provider === 'youtube' ? `&autoplay=1&mute=${muted ? 1 : 0}` : ''}`}
            title={listing.title}
            allow={providerAllow(listing.video.provider)}
            allowFullScreen
            loading="lazy"
            className="feed-card__frame"
          />
        ) : (
          <button
            className="feed-card__poster"
            style={
              poster
                ? { backgroundImage: `url(${poster})` }
                : { background: listing.photos[0] ?? 'linear-gradient(135deg,#333,#111)' }
            }
            onClick={() => {
              if (started) onExpand();
              else onStart();
            }}
            aria-label={started ? 'Open fullscreen player' : 'Play video'}
          >
            <span className="feed-card__play">
              <IconPlay size={28} />
            </span>
          </button>
        )}

        {/* Second interaction → immersive 9:16 overlay */}
        {(started || nativeVideo) && (
          <button className="feed-card__expand" onClick={onExpand} aria-label="Open fullscreen player">
            <IconVideo size={14} /> Fullscreen
          </button>
        )}

        <div className="feed-card__badges">
          {listing.featured && <span className="badge badge--featured">Featured</span>}
          {listing.video && (
            <span className="badge badge--video">
              <IconVideo size={11} /> {providerLabel(listing.video.provider)}
            </span>
          )}
          {seller && seller.verification !== 'none' && (
            <span className={`badge ${seller.verification === 'verified-inspector' ? 'badge--gold' : 'badge--verified'}`}>
              <IconShield size={10} /> Verified
            </span>
          )}
        </div>

        {isUrgent(listing.todayViews) && (
          <div className="urgency urgency--float">
            <span className="urgency__flame">🔥</span>
            <span>{urgencyText(listing.todayViews)}</span>
          </div>
        )}

        <div className="feed-card__overlay">
          <button className="feed-card__title" onClick={onDetails}>
            {listing.title}
          </button>
          <div className="feed-card__meta">
            <b>{inr(listing.price)}</b>
            {listing.priceUnit && <span>{listing.priceUnit}</span>}
            <span className="feed-card__loc">
              <IconPin size={12} /> {listing.city}
            </span>
          </div>
          <div className="feed-card__actions">
            <button className="btn btn--primary btn--sm" onClick={onContact}>
              <IconChat size={15} /> Message
            </button>
            <button className={`feed-card__icon${saved ? ' is-on' : ''}`} onClick={onToggleSave} aria-label="Save">
              <IconHeart size={19} filled={saved} />
            </button>
            <button className="feed-card__icon" onClick={onDetails} aria-label="Details">
              <IconChevron size={18} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ========================================================================== */
/* Immersive 9:16 fullscreen player                                            */
/* ========================================================================== */
export function FullscreenPlayer({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const [muted, setMuted] = useState(false);
  const nativeVideo = listing.media?.find((item) => item.kind === 'video');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fs-player" role="dialog" aria-modal="true" aria-label={listing.title}>
      <button className="fs-player__scrim" onClick={onClose} aria-label="Close player" />
      <div className="fs-player__frame">
        {nativeVideo ? (
          <video src={nativeVideo.src} poster={nativeVideo.poster} muted={muted} autoPlay loop playsInline controls />
        ) : listing.video ? (
          <iframe
            src={`${listing.video.embedSrc}${listing.video.provider === 'youtube' ? `&autoplay=1&mute=${muted ? 1 : 0}` : ''}`}
            title={listing.title}
            allow={providerAllow(listing.video.provider)}
            allowFullScreen
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: listing.photos[0] }} />
        )}

        <div className="fs-player__bar">
          <div>
            <b>{listing.title}</b>
            <span>
              {inr(listing.price)} · {listing.city}
            </span>
          </div>
          <button className="feed__mute" style={{ position: 'static' }} onClick={() => setMuted((prev) => !prev)}>
            {muted ? <IconMuted size={18} /> : <IconUnmuted size={18} />}
          </button>
        </div>
      </div>
      <button className="fs-player__close" onClick={onClose} aria-label="Close">
        <IconClose size={22} />
      </button>
    </div>
  );
}
