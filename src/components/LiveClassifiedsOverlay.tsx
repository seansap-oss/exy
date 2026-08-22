import { useEffect, useRef, useState } from 'react';
import type { Listing, Seller } from '../types';
import { inr } from '../lib/format';
import { fallbackGradient, listingCandidates } from '../lib/thumbnails';
import { isProviderPlaybackUrl } from '../lib/embeds';
import { IconChat, IconClose, IconHeart, IconSend, IconShare } from './Icons';
import { VideoEmbed } from './VideoEmbed';

interface Props {
  listing: Listing;
  seller?: Seller;
  saved: boolean;
  onClose: () => void;
  onMessage: (listingId: string) => void;
  /** Kept for compatibility with existing callback flows; no callback button is shown in the player. */
  onCallback: (listingId: string) => void;
  onToggleSave: (listingId: string) => void;
  onQualifiedView: (listingId: string, dwellSec: number) => void;
  onToast?: (message: string, kind?: 'ok' | 'err' | 'info') => void;
}

/**
 * Fullscreen classifieds viewer.
 * The provider player owns playback and sound. EXY owns only the three
 * lightweight actions and the message sheet, so closing a sheet never closes
 * the video viewer.
 */
export function LiveClassifiedsOverlay({
  listing,
  seller,
  saved,
  onClose,
  onMessage,
  onToggleSave,
  onQualifiedView,
  onToast,
}: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState('');
  const openedAt = useRef(Date.now());
  const countedRef = useRef(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const nativeVideo = listing.media?.find((item) => item.kind === 'video');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      const dwell = (Date.now() - openedAt.current) / 1000;
      if (dwell >= 10 && !countedRef.current) {
        countedRef.current = true;
        onQualifiedView(listing.id, dwell);
      }
    };
  }, [listing.id, onQualifiedView]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (messageOpen) setMessageOpen(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [messageOpen, onClose]);

  useEffect(() => {
    if (!messageOpen) return;
    const timer = window.setTimeout(() => messageInputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [messageOpen]);

  async function shareListing() {
    const url = listing.video && isProviderPlaybackUrl(listing.video.provider, listing.video.url)
      ? listing.video.url
      : window.location.href;
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

  function sendMessage() {
    if (message.trim().length < 2) {
      onToast?.('Write a message first.', 'info');
      messageInputRef.current?.focus();
      return;
    }
    onMessage(listing.id);
  }

  return (
    <div className="lco" role="dialog" aria-modal="true" aria-label={listing.title}>
      <div className="lco__backdrop" onClick={onClose} />

      <div className="lco__stage">
        <div className="lco__video" ref={playerRef}>
          {nativeVideo ? (
            <video src={nativeVideo.src} poster={nativeVideo.poster} muted autoPlay loop playsInline controls />
          ) : listing.video ? (
            <VideoEmbed
              video={listing.video}
              fallback={fallbackGradient(listing)}
              candidates={listingCandidates(listing)}
              title={listing.title}
              orientation="vertical"
              autoStart
              hideOpenOriginal
              sellerName={seller?.name}
              price={inr(listing.price)}
            />
          ) : (
            <div className="lco__fallback" style={{ background: listing.photos[0] }} />
          )}

          <div className="lco__action-rail" aria-label="Player actions">
            <button className="lco__action" onClick={shareListing} aria-label="Share listing">
              <IconShare size={21} /><span>Share</span>
            </button>
            <button className="lco__action" onClick={() => setMessageOpen(true)} aria-label="Message seller">
              <IconChat size={21} /><span>Message</span>
            </button>
            <button className={`lco__action${saved ? ' is-on' : ''}`} onClick={() => onToggleSave(listing.id)} aria-label="Save listing">
              <IconHeart size={21} filled={saved} /><span>{saved ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          <div className="lco__details" aria-label="Listing details">
            <div className="lco__details-seller">
              {seller && <span className="lco__details-avatar" style={{ background: seller.avatarColor }}>{seller.name.slice(0, 2).toUpperCase()}</span>}
              <span>{seller?.name || 'EXY seller'}</span>
              {seller?.verification !== 'none' && <b aria-label="Verified seller">✓</b>}
            </div>
            <h2>{listing.title}</h2>
            <div className="lco__details-price">{inr(listing.price)} {listing.priceUnit && <small>{listing.priceUnit}</small>}</div>
            <div className="lco__details-location">⌖ {listing.location}</div>
          </div>
        </div>
      </div>

      <button className="lco__close" onClick={onClose} aria-label="Close video" title="Close video">
        <IconClose size={24} />
      </button>
      <button className="lco__fs" onClick={() => {
        if (!isFullscreen) {
          document.documentElement.requestFullscreen?.().catch(() => undefined);
          setIsFullscreen(true);
        } else {
          document.exitFullscreen?.().catch(() => undefined);
          setIsFullscreen(false);
        }
      }} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
        {isFullscreen ? '⤡' : '⤢'}
      </button>

      {messageOpen && (
        <>
          <button className="lco__message-backdrop" onClick={() => setMessageOpen(false)} aria-label="Close message composer" />
          <section className="lco__message-sheet" role="dialog" aria-modal="true" aria-label="Message seller">
            <div className="lco__message-grabber" />
            <header className="lco__message-header">
              <div>
                <strong>Message seller</strong>
                <span>{seller?.name || 'EXY seller'}</span>
              </div>
              <button onClick={() => setMessageOpen(false)} aria-label="Close message composer"><IconClose size={20} /></button>
            </header>
            <textarea
              ref={messageInputRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`Ask ${seller?.name || 'the seller'} about this listing…`}
              aria-label="Message text"
              rows={3}
            />
            <div className="lco__message-footer">
              <span>Press Enter to send · Shift+Enter for a new line</span>
              <button onClick={sendMessage} aria-label="Send message"><IconSend size={17} /> Send</button>
            </div>
          </section>
        </>
      )}

    </div>
  );
}
