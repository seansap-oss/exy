import { useEffect, useMemo, useRef, useState } from 'react';
import type { Listing, Seller } from '../types';
import { providerAllow } from '../lib/embeds';
import { compact, inr } from '../lib/format';
import { openOriginal } from '../lib/playback';
import {
  IconChat,
  IconChevron,
  IconClose,
  IconEye,
  IconHeart,
  IconLink,
  IconPhone,
  IconShare,
  IconSend,
  IconShield,
  IconStore,
  IconTag,
} from './Icons';

/* -------------------------------------------------------------------------- */
/* Demo live comment stream                                                    */
/* -------------------------------------------------------------------------- */
interface LiveComment {
  id: string;
  author: string;
  color: string;
  body: string;
}

const COMMENT_POOL: Array<[string, string]> = [
  ['Rahul_M', 'Is this still available?'],
  ['priya.k', 'What is the final price for 2 pieces?'],
  ['ArjunBuilds', 'Do you deliver to Pune?'],
  ['neha_s', 'Looks great in the video 🔥'],
  ['contractor_raj', 'Bulk rate for 10 units?'],
  ['Sanjay.T', 'Can I see it this weekend?'],
  ['meera_d', 'Is the price negotiable?'],
  ['vikram99', 'Warranty included?'],
  ['AnitaShops', 'Sending you a message now'],
  ['dev_patel', 'What are the exact dimensions?'],
];

const AUTHOR_COLORS = ['#FF9500', '#FFB300', '#4ade80', '#60a5fa', '#f472b6', '#c084fc'];

/** Curated admin commentary shown as the seller story. */
function sellerStory(listing: Listing, seller?: Seller): string[] {
  const lines: string[] = [];
  if (listing.features.length) lines.push(...listing.features.slice(0, 3));
  else lines.push(listing.description.slice(0, 130));
  if (seller?.verification !== 'none' && seller) lines.push(`${seller.responseTime} · ★ ${seller.rating.toFixed(1)} rating`);
  lines.push(`Located in ${listing.location}`);
  return lines;
}

interface Props {
  listing: Listing;
  seller?: Seller;
  saved: boolean;
  onClose: () => void;
  onMessage: (listingId: string) => void;
  onCallback: (listingId: string) => void;
  onToggleSave: (listingId: string) => void;
  onQualifiedView: (listingId: string, dwellSec: number) => void;
  onToast?: (message: string, kind?: 'ok' | 'err' | 'info') => void;
}

/**
 * Module 4 — Embedded Live-Classifieds Overlay.
 * 9:16 full-screen player with a live lead sidebar, an active listing card,
 * a slide-to-message action and a minimise toggle for unobstructed viewing.
 */
export function LiveClassifiedsOverlay({
  listing,
  seller,
  saved,
  onClose,
  onMessage,
  onCallback,
  onToggleSave,
  onQualifiedView,
  onToast,
}: Props) {
  const [minimized, setMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [draft, setDraft] = useState('');
  const [viewers, setViewers] = useState(() => Math.max(8, Math.round(listing.todayViews * 0.7) + 6));
  const [slide, setSlide] = useState(0);
  const [slid, setSlid] = useState(false);

  const openedAt = useRef(Date.now());
  const countedRef = useRef(false);
  const streamRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const story = useMemo(() => sellerStory(listing, seller), [listing, seller]);
  const nativeVideo = listing.media?.find((item) => item.kind === 'video');

  /* --------------------------- lifecycle & tracking -------------------------- */
  useEffect(() => {
    const prev = document.body.style.overflow;
    const startedAt = openedAt.current;
    const counted = countedRef;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      const dwell = (Date.now() - startedAt) / 1000;
      if (dwell >= 10 && !counted.current) {
        counted.current = true;
        onQualifiedView(listing.id, dwell);
      }
    };
  }, [listing.id, onQualifiedView]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* ------------------------------ live comments ----------------------------- */
  useEffect(() => {
    if (minimized) return;
    const timer = window.setInterval(() => {
      const [author, body] = COMMENT_POOL[Math.floor(Math.random() * COMMENT_POOL.length)];
      setComments((prev) =>
        [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            author,
            color: AUTHOR_COLORS[Math.floor(Math.random() * AUTHOR_COLORS.length)],
            body,
          },
        ].slice(-40),
      );
      setViewers((prev) => Math.max(4, prev + (Math.random() > 0.35 ? 1 : -1)));
    }, 3600);
    return () => window.clearInterval(timer);
  }, [minimized]);

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' });
  }, [comments.length]);

  /* ---------------------------- slide to message ---------------------------- */
  function slideFrom(clientX: number) {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const max = rect.width - 54;
    const next = Math.min(max, Math.max(0, clientX - rect.left - 27));
    setSlide(next);
    if (next >= max - 6 && !slid) {
      setSlid(true);
      dragging.current = false;
      onMessage(listing.id);
    }
  }

  function postComment() {
    if (draft.trim().length < 2) return;
    setComments((prev) => [
      ...prev,
      { id: `me-${Date.now()}`, author: 'You', color: '#FF9500', body: draft.trim() },
    ]);
    setDraft('');
  }

  async function shareListing() {
    const url = listing.video?.url || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, text: listing.description, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      onToast?.('Listing link copied', 'ok');
    } catch {
      onToast?.('Share cancelled', 'info');
    }
  }

  function focusSoundControl() {
    const native = playerRef.current?.querySelector('video');
    if (native instanceof HTMLVideoElement) {
      native.muted = !native.muted;
      native.focus();
      onToast?.(native.muted ? 'Sound muted' : 'Sound on', 'info');
      return;
    }
    const iframe = playerRef.current?.querySelector('iframe');
    if (iframe instanceof HTMLIFrameElement) iframe.focus();
    onToast?.('Use the speaker control inside the video player.', 'info');
  }

  return (
    <div className={`lco${minimized ? ' is-min' : ''}`} role="dialog" aria-modal="true" aria-label={listing.title}>
      <div className="lco__backdrop" onClick={onClose} />

      <div className="lco__stage">
        {/* ------------------------------ video ------------------------------ */}
        <div className="lco__video" ref={playerRef}>
          {nativeVideo ? (
            <video src={nativeVideo.src} poster={nativeVideo.poster} muted autoPlay loop playsInline controls />
          ) : listing.video ? (
            <iframe
              src={`${listing.video.embedSrc}${listing.video.provider === 'youtube' ? `${listing.video.embedSrc.includes('?') ? '&' : '?'}autoplay=1&mute=1&controls=1&playsinline=1&rel=0` : ''}`}
              title={listing.title}
              allow={providerAllow(listing.video.provider)}
              allowFullScreen
            />
          ) : (
            <div className="lco__fallback" style={{ background: listing.photos[0] }} />
          )}

          {/* 4.4 — minimised state keeps only a subtle price pill */}
          {minimized && (
            <button className="lco__pricepill" onClick={() => setMinimized(false)}>
              <b>{inr(listing.price)}</b>
              <span>Tap for details</span>
            </button>
          )}

          <div className="lco__action-rail" aria-label="Player actions">
            <button className="lco__action" onClick={shareListing} aria-label="Share listing">
              <IconShare size={21} /><span>Share</span>
            </button>
            <button className="lco__action" onClick={() => onMessage(listing.id)} aria-label="Message seller">
              <IconChat size={21} /><span>Message</span>
            </button>
            <button className={`lco__action${saved ? ' is-on' : ''}`} onClick={() => onToggleSave(listing.id)} aria-label="Save listing">
              <IconHeart size={21} filled={saved} /><span>{saved ? 'Saved' : 'Save'}</span>
            </button>
            <button className="lco__action" onClick={focusSoundControl} aria-label="Sound controls" title="Use the player sound control">
              <span className="lco__action-glyph">◖))</span><span>Sound</span>
            </button>
          </div>
        </div>

        {/* --------------------- 4.2 live lead sidebar ---------------------- */}
        {!minimized && (
          <aside className="lco__side">
            <header className="lco__side-head">
              <span className="lco__live">
                <i /> LIVE
              </span>
              <span className="lco__viewers">
                <IconEye size={13} /> {compact(viewers)} watching
              </span>
              <button className="lco__close-side" onClick={onClose} aria-label="Close">
                <IconClose size={16} />
              </button>
            </header>

            {seller && (
              <div className="lco__seller">
                <span className="avatar" style={{ background: seller.avatarColor, width: 38, height: 38, fontSize: 13 }}>
                  {seller.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <b>
                    {seller.name}
                    {seller.verification !== 'none' && <IconShield size={12} />}
                  </b>
                  <span>
                    {seller.verification === 'verified-inspector'
                      ? 'Verified Inspector'
                      : seller.verification === 'verified-business'
                        ? 'Verified Business'
                        : 'Unverified seller'}
                  </span>
                </div>
              </div>
            )}

            <div className="lco__story">
              <b>Seller story</b>
              {story.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>

            <div className="lco__stream" ref={streamRef}>
              {comments.length === 0 && <p className="lco__stream-hint">Live inquiries appear here…</p>}
              {comments.map((comment) => (
                <p key={comment.id} className="lco__comment">
                  <b style={{ color: comment.color }}>{comment.author}</b>
                  {comment.body}
                </p>
              ))}
            </div>

            <div className="lco__compose">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && postComment()}
                placeholder="Ask a question…"
                aria-label="Add a comment"
              />
              <button onClick={postComment} aria-label="Post comment">
                <IconSend size={16} />
              </button>
            </div>
          </aside>
        )}

        {/* ------------------ 4.3 active listing card ----------------------- */}
        {!minimized && (
          <div className="lco__card">
            <div className="lco__card-top">
              <div className="lco__card-info">
                <b>{listing.title}</b>
                <div className="lco__price">
                  <span className="lco__price-label">Live price</span>
                  <em>{inr(listing.price)}</em>
                  {listing.priceUnit && <small>{listing.priceUnit}</small>}
                  {listing.negotiable && <span className="badge badge--soft">Negotiable</span>}
                </div>
              </div>
              <button
                className={`lco__heart${saved ? ' is-on' : ''}`}
                onClick={() => onToggleSave(listing.id)}
                aria-label="Save listing"
              >
                <IconHeart size={19} filled={saved} />
              </button>
            </div>

            <div className="lco__action-row" aria-label="Listing actions">
              <button onClick={() => onToggleSave(listing.id)}><IconHeart size={16} filled={saved} /> {saved ? 'Saved' : 'Save'}</button>
              <button onClick={() => onMessage(listing.id)}><IconChat size={16} /> Text</button>
              <button onClick={() => listing.video?.url && openOriginal(listing.video.url)}><IconLink size={16} /> Original</button>
              <button onClick={() => document.querySelector('.lco__side')?.scrollIntoView({ behavior: 'smooth' })}><IconStore size={16} /> Seller</button>
              <button onClick={() => onCallback(listing.id)}><IconTag size={16} /> Advertise</button>
            </div>

            <div className="lco__actions">
              <button className="lco__btn lco__btn--primary" onClick={() => onMessage(listing.id)}>
                <IconChat size={16} /> MESSAGE SELLER
              </button>
              <button className="lco__btn lco__btn--ghost" onClick={() => onCallback(listing.id)}>
                <IconPhone size={16} /> REQUEST CALLBACK
              </button>
            </div>

            {/* Slide to message */}
            <div
              className={`lco__slide${slid ? ' is-done' : ''}`}
              ref={trackRef}
              onPointerDown={(event) => {
                dragging.current = true;
                (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
                slideFrom(event.clientX);
              }}
              onPointerMove={(event) => dragging.current && slideFrom(event.clientX)}
              onPointerUp={() => {
                dragging.current = false;
                if (!slid) setSlide(0);
              }}
              onPointerLeave={() => {
                dragging.current = false;
                if (!slid) setSlide(0);
              }}
            >
              <span className="lco__slide-label">{slid ? 'Opening chat…' : 'Slide to message  →'}</span>
              <span className="lco__slide-knob" style={{ transform: `translateX(${slide}px)` }}>
                <IconChevron size={18} />
              </span>
            </div>
          </div>
        )}
      </div>

      <button
        className="lco__close"
        onClick={(event) => {
          // Stop propagation so the backdrop below does not also fire.
          event.stopPropagation();
          // Exit fullscreen first, then close the overlay.
          if (isFullscreen && document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => undefined);
          }
          onClose();
        }}
        aria-label="Close video"
        title="Close video"
      >
        <IconClose size={24} />
      </button>
      <button
        className="lco__fs"
        onClick={(event) => {
          event.stopPropagation();
          if (!isFullscreen) {
            document.documentElement.requestFullscreen?.().catch(() => undefined);
            setIsFullscreen(true);
          } else {
            document.exitFullscreen?.().catch(() => undefined);
            setIsFullscreen(false);
          }
        }}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? '⤡' : '⤢'}
      </button>
    </div>
  );
}
