import { useCallback, useEffect, useRef, useState } from 'react';
import type { Listing, Seller } from '../types';
import { providerAllow, providerLabel } from '../lib/embeds';
import { fallbackGradient, listingCandidates } from '../lib/thumbnails';
import { handoffToProvider, providerActionLabel, resolvePlayback } from '../lib/playback';
import { VideoEmbed } from './VideoEmbed';
import { MediaPreview } from './MediaPreview';
import { inr } from '../lib/format';
import { isUrgent, urgencyText, VIEW_DWELL_SECONDS } from '../lib/analytics';
import {
  IconChat,
  IconChevron,
  IconClose,
  IconHeart,
  IconPin,
  IconPlay,
  IconShield,
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
  /** Surfaces a readable error when media cannot be opened. */
  onDeadMedia?: (message: string) => void;
  /** Opens the Module 4 Embedded Live-Classifieds Overlay. */
  onExpand: (listing: Listing) => void;
}

/**
 * Module 6.2 — cascading card stack.
 * Horizontal snap carousel of 9:16 video cards.
 * Native/provider players own their playback and audio controls.
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
  onExpand,
  onDeadMedia,
}: Props) {
  const deck = listings.filter((listing) => listing.status === 'active');
  const initial = Math.max(0, startId ? deck.findIndex((listing) => listing.id === startId) : 0);

  const [index, setIndex] = useState(initial);
  const [started, setStarted] = useState(false);

  const dwellRef = useRef<{ id: string; at: number } | null>(null);
  const countedRef = useRef<Set<string>>(new Set());
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<number | null>(null);

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
  /** Scrolls the rail so the requested slide lands centred. */
  const scrollTo = useCallback((target: number, behavior: ScrollBehavior = 'smooth') => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[target] as HTMLElement | undefined;
    if (!slide) return;
    track.scrollTo({ left: slide.offsetLeft - (track.clientWidth - slide.clientWidth) / 2, behavior });
  }, []);

  const step = useCallback(
    (delta: number) => {
      setIndex((prev) => {
        const next = Math.min(deck.length - 1, Math.max(0, prev + delta));
        scrollTo(next);
        return next;
      });
    },
    [deck.length, scrollTo],
  );

  /** Derives the active index from the nearest slide to the rail's centre. */
  const onTrackScroll = useCallback(() => {
    if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      const track = trackRef.current;
      if (!track) return;
      const centre = track.scrollLeft + track.clientWidth / 2;
      let nearest = 0;
      let best = Infinity;
      Array.from(track.children).forEach((node, position) => {
        const slide = node as HTMLElement;
        const distance = Math.abs(slide.offsetLeft + slide.clientWidth / 2 - centre);
        if (distance < best) {
          best = distance;
          nearest = position;
        }
      });
      setIndex((prev) => (prev === nearest ? prev : nearest));
    }, 90);
  }, []);

  // Land on the requested start card without animating on first paint.
  useEffect(() => {
    if (initial > 0) scrollTo(initial, 'auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

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

  return (
    <div className="feed">
      <div className="feed__stage">
        {/*
          Horizontal snap carousel. Native scroll-snap does the work, so page
          scrolling is never blocked: vertical drags bubble to the document,
          horizontal drags pan the rail.
        */}
        <div className="feed__track swipe-x" ref={trackRef} onScroll={onTrackScroll}>
          {deck.map((listing, position) => (
            <div className="feed__slide" key={listing.id} data-index={position}>
              <FeedCard
                listing={listing}
                seller={sellerMap[listing.sellerId]}
                started={started && position === index}
                active={position === index}
                saved={saved.includes(listing.id)}
                onStart={() => setStarted(true)}
                onExpand={() => onExpand(listing)}
                onToggleSave={() => onToggleSave(listing.id)}
                onDetails={() => onOpenListing(listing.id)}
                onContact={() => onContact(listing.id)}
                onDeadMedia={onDeadMedia}
              />
            </div>
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

    </div>
  );
}

/* ========================================================================== */
/* Individual stacked card                                                     */
/* ========================================================================== */
function FeedCard({
  listing,
  seller,
  started,
  active,
  saved,
  onStart,
  onExpand,
  onToggleSave,
  onDetails,
  onContact,
  onDeadMedia,
}: {
  listing: Listing;
  seller?: Seller;
  /** Centred slide drives playback. */
  active: boolean;
  started: boolean;
  saved: boolean;
  onStart: () => void;
  onExpand: () => void;
  onToggleSave: () => void;
  onDetails: () => void;
  onContact: () => void;
  onDeadMedia?: (message: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const nativeVideo = listing.media?.find((item) => item.kind === 'video');
  const playback = resolvePlayback(listing);
  const isTop = active;

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    element.muted = true;
    if (isTop) void element.play().catch(() => undefined);
    else element.pause();
  }, [isTop]);

  return (
    <article className={`feed-card${isTop ? ' is-top' : ''}`}>
      <div className="feed-card__media">
        {nativeVideo ? (
          <video
            ref={videoRef}
            src={nativeVideo.src}
            poster={nativeVideo.poster}
            muted
            loop
            playsInline
            autoPlay={isTop}
            controls
            className="feed-card__video"
          />
        ) : started && playback.kind === 'inline' && playback.src ? (
          <iframe
            src={`${playback.src.replace(/([?&])autoplay=[01]/, '$1autoplay=1')}&mute=1&controls=1&playsinline=1&rel=0`}
            title={listing.title}
            allow={providerAllow(listing.video?.provider ?? 'youtube')}
            allowFullScreen
            loading="lazy"
            className="feed-card__frame"
          />
        ) : (
          <button
            className="feed-card__poster"
            onClick={(event) => {
              // Stop the tap bubbling into card navigation.
              event.stopPropagation();
              if (!playback.playable) return;

              // YouTube opens the auto-starting EXY viewer immediately. From
              // the Home video rail this makes Home → Feed → playing video a
              // two-action flow instead of requiring a third player tap.
              if (playback.kind === 'inline') {
                if (playback.provider === 'youtube') {
                  onExpand();
                  return;
                }
                if (started) onExpand();
                else onStart();
                return;
              }
              // Instagram and Facebook open the immersive EXY player. Instagram
              // may use the official embed; Facebook is always a clean hand-off.
              if (playback.kind === 'embed') {
                onExpand();
                return;
              }
              // No embeddable form → hand off to the provider.
              if (!handoffToProvider(playback.provider, playback.original)) {
                onDeadMedia?.('Could not open the original link.');
              }
            }}
            aria-label={playback.playable ? playback.label : 'Media unavailable'}
            // A non-playable card must not look interactive.
            style={playback.playable ? undefined : { cursor: 'default' }}
          >
            <MediaPreview
              candidates={listingCandidates(listing)}
              fallback={fallbackGradient(listing)}
              provider={listing.video?.provider}
              oembedUrl={listing.video?.url ?? null}
              alt={listing.title}
              title={listing.title}
              meta={`${inr(listing.price)} · ${listing.city}`}
              sellerName={seller?.name}
              price={inr(listing.price)}
              className="mp--fill"
            />
            {playback.playable ? (
              <span className="feed-card__play">
                <IconPlay size={28} />
              </span>
            ) : (
              <span className="feed-card__nomedia">Media unavailable</span>
            )}
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
  const nativeVideo = listing.media?.find((item) => item.kind === 'video');
  const playback = resolvePlayback(listing);

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
            <video src={nativeVideo.src} poster={nativeVideo.poster} muted autoPlay loop playsInline controls />
        ) : listing.video ? (
          <VideoEmbed video={listing.video} title={listing.title} orientation="vertical" autoStart hideOpenOriginal />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: listing.photos[0] }} />
        )}

        {/* Always reachable escape hatch when a provider blocks playback. */}
        {playback.original && playback.kind !== 'inline' && playback.provider !== 'instagram' && playback.provider !== 'facebook' && (
          <button
            className="fs-player__open"
            onClick={() => handoffToProvider(playback.provider, playback.original)}
          >
            {providerActionLabel(playback.provider)}
          </button>
        )}

        <div className="fs-player__bar">
          <div>
            <b>{listing.title}</b>
            <span>
              {inr(listing.price)} · {listing.city}
            </span>
          </div>
        </div>
      </div>
      <button className="fs-player__close" onClick={onClose} aria-label="Close">
        <IconClose size={22} />
      </button>
    </div>
  );
}
