import { useEffect, useRef, useState } from 'react';
import type { VideoEmbed as VideoEmbedType } from '../types';
import { providerAllow, providerLabel } from '../lib/embeds';
import { fallbackGradient, originalUrl, thumbnailCandidates } from '../lib/thumbnails';
import { handoffToProvider } from '../lib/playback';
import { fetchOEmbed } from '../lib/oembed';
import { MediaPreview } from './MediaPreview';
import { IconLink, IconPlay, IconVideo } from './Icons';

interface Props {
  video?: VideoEmbedType;
  fallback?: string;
  orientation?: 'vertical' | 'wide';
  autoStart?: boolean;
  title?: string;
  candidates?: string[];
  meta?: string;
  sellerName?: string;
  sellerAvatar?: string;
  price?: string;
  /** The containing player already provides its own Open Original control. */
  hideOpenOriginal?: boolean;
}

function resolvedEmbedSource(video: VideoEmbedType): string {
  // Older Supabase rows deliberately store no Facebook iframe. Rebuild the
  // official plugin URL only in memory; it is mounted only after oEmbed proves
  // the post is public and embeddable.
  if (video.provider === 'facebook' && video.url) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video.url)}&show_text=false&autoplay=true&width=500`;
  }
  return video.embedSrc;
}

/**
 * Provider-aware media renderer.
 *
 * - YouTube / native  → plays inline in the card
 * - Instagram / Facebook → official iframe only after availability check
 * - Meta iframe navigation → clean EXY fallback, never a provider login page
 * - No/failed media   → branded EXY preview, never an empty box
 */
export function VideoEmbed({
  video, fallback, orientation = 'vertical', autoStart = false, title, candidates, meta, sellerName, sellerAvatar, price,
  hideOpenOriginal = false,
}: Props) {
  const [playing, setPlaying] = useState(autoStart);
  const [socialAvailability, setSocialAvailability] = useState<'checking' | 'ready' | 'unavailable'>(() =>
    video?.provider === 'instagram' || video?.provider === 'facebook' ? 'checking' : 'ready',
  );
  const [socialNavigated, setSocialNavigated] = useState(false);
  const socialFrameLoads = useRef(0);
  const gradient = fallback ?? fallbackGradient();
  const socialEmbeddable = video?.provider === 'instagram' || video?.provider === 'facebook';
  const currentEmbedSrc = video ? resolvedEmbedSource(video) : '';

  useEffect(() => {
    setPlaying(autoStart);
    setSocialNavigated(false);
    socialFrameLoads.current = 0;
  }, [autoStart, currentEmbedSrc]);

  // Validate social posts before mounting their cross-origin iframe. When Meta
  // has already said a post is private/deleted/restricted, showing a localized
  // provider error page is worse than an honest EXY fallback.
  useEffect(() => {
    if (!video || (video.provider !== 'instagram' && video.provider !== 'facebook')) {
      setSocialAvailability('ready');
      return;
    }

    let active = true;
    setSocialAvailability('checking');

    // Keep this shared request alive across React StrictMode's development
    // remount. Cancelling it here makes the replacement mount inherit the
    // first mount's aborted promise and falsely report a public post missing.
    void fetchOEmbed(video.url).then((result) => {
      if (!active) return;
      // Only mount a Meta player when Meta explicitly confirms availability.
      setSocialAvailability(result?.available === true ? 'ready' : 'unavailable');
    });

    return () => {
      active = false;
    };
  }, [video?.provider, video?.url]);

  if (!video) {
    return (
      <div className={`video video--${orientation}`}>
        <MediaPreview candidates={[]} fallback={gradient} alt={title ?? 'No media'} title={title} />
        <div className="video__note">
          <IconVideo size={13} /> No video attached to this listing yet.
        </div>
      </div>
    );
  }

  const original = originalUrl(video);
  const posterCandidates = candidates?.length ? candidates : thumbnailCandidates(video);
  const cls = `video video--${orientation === 'wide' ? 'wide' : 'vertical'}`;
  const iframeSrc = video.provider === 'youtube'
    ? `${currentEmbedSrc.replace(/([?&])autoplay=[01]/, '$1autoplay=1')}&mute=1&controls=1&playsinline=1&rel=0`
    : currentEmbedSrc;
  const showUnavailable = socialEmbeddable && (socialAvailability === 'unavailable' || socialNavigated);
  const showChecking = socialEmbeddable && socialAvailability === 'checking';
  const iframeEligible = video.provider === 'youtube' || socialEmbeddable;
  const providerFallbackTitle = showChecking
      ? `Checking this ${providerLabel(video.provider)}…`
      : `${providerLabel(video.provider)} cannot play this post here.`;
  const providerFallbackDetail = showChecking
      ? 'Preparing the official player.'
      : socialNavigated
        ? 'Meta requires a login or redirected away from the embedded player.'
        : 'The post may be private, deleted, age-restricted, or not allowed to be embedded.';
  return (
    <div className={cls}>
      {playing ? (
        <>
          {video.provider === 'native' ? (
            <video src={video.embedSrc} poster={video.poster} controls autoPlay playsInline className="video__native" />
          ) : iframeEligible && currentEmbedSrc && !showUnavailable && !showChecking ? (
            socialEmbeddable ? (
              <div className={`video__social-stage video__social-stage--${video.provider}`}>
                <iframe
                  className={`video__frame video__frame--${video.provider}`}
                  src={iframeSrc}
                  title={title ?? providerLabel(video.provider)}
                  allow={providerAllow(video.provider)}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                  onLoad={() => {
                    socialFrameLoads.current += 1;
                    // A second document load means the provider has navigated
                    // away from its embed into a login/profile/error surface.
                    if (socialFrameLoads.current > 1) setSocialNavigated(true);
                  }}
                />
              </div>
            ) : (
              <iframe
                className={`video__frame video__frame--${video.provider}`}
                src={iframeSrc}
                title={title ?? providerLabel(video.provider)}
                allow={providerAllow(video.provider)}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )
          ) : (
            <div
              className={`video__provider-state video__provider-state--${video.provider}`}
              data-exy-provider-fallback={video.provider}
              aria-live="polite"
            >
              <MediaPreview
                candidates={posterCandidates}
                fallback={gradient}
                provider={video.provider}
                alt={title ?? providerLabel(video.provider)}
                title={title}
                meta={meta ?? providerLabel(video.provider)}
                sellerName={sellerName}
                sellerAvatar={sellerAvatar}
                price={price}
                className="mp--fill"
                oembedUrl={video.url}
              />
              <div className="video__provider-brand" aria-hidden="true">
                <span className="video__provider-mark">EX</span>
                <span className="video__provider-name">EXY</span>
                <span className="video__provider-platform">{providerLabel(video.provider)}</span>
              </div>
              <div className="video__provider-copy">
                <b>{providerFallbackTitle}</b>
                <span>{providerFallbackDetail}</span>
              </div>
              {original && !showChecking && (
                <button
                  type="button"
                  className="video__provider-action"
                  onClick={() => handoffToProvider(video.provider, original)}
                >
                  <IconLink size={15} /> Open original
                </button>
              )}
            </div>
          )}

          {/* Embedded IG/FB often shows a login wall — always give an escape. */}
          {!hideOpenOriginal && (video.provider === 'instagram' || video.provider === 'facebook') && original && (
            <a
              className="video__open"
              href={original}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                event.preventDefault();
                handoffToProvider(video.provider, original);
              }}
            >
              <IconLink size={12} /> Open on {providerLabel(video.provider)}
            </a>
          )}
        </>
      ) : (
        <button
          className="video__poster"
          onClick={() => {
            setPlaying(true);
          }}
          aria-label="Play video"
        >
          <MediaPreview
            candidates={posterCandidates}
            fallback={gradient}
            provider={video.provider}
            alt={title ?? providerLabel(video.provider)}
            title={title}
            meta={meta ?? providerLabel(video.provider)}
            sellerName={sellerName}
            sellerAvatar={sellerAvatar}
            price={price}
            className="mp--fill"
            oembedUrl={video.url}
          />
          <span className="video__play">
            <IconPlay size={26} />
          </span>
          <span className="video__label">
            <IconVideo size={13} />
            {providerLabel(video.provider)}
          </span>
        </button>
      )}
    </div>
  );
}
