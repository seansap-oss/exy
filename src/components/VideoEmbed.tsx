import { useState } from 'react';
import type { VideoEmbed as VideoEmbedType } from '../types';
import { providerAllow, providerLabel } from '../lib/embeds';
import { embedPlaysInline, fallbackGradient, originalUrl, thumbnailCandidates } from '../lib/thumbnails';
import { MediaPreview } from './MediaPreview';
import { IconLink, IconPlay, IconVideo } from './Icons';

interface Props {
  video?: VideoEmbedType;
  fallback?: string;
  orientation?: 'vertical' | 'wide';
  autoStart?: boolean;
  title?: string;
}

/**
 * Provider-aware media renderer.
 *
 * - YouTube / native  → plays inline in the card
 * - Instagram / FB    → mounts the official embed and always offers
 *                       "Open original" because those providers frequently
 *                       refuse inline playback without a session
 * - No/failed media   → branded EXY preview, never an empty box
 */
export function VideoEmbed({ video, fallback, orientation = 'vertical', autoStart = false, title }: Props) {
  const [playing, setPlaying] = useState(autoStart);
  const gradient = fallback ?? fallbackGradient();

  if (!video) {
    return (
      <div className={`video video--${orientation}`}>
        <MediaPreview candidates={[]} fallback={gradient} alt={title ?? 'No media'} />
        <div className="video__note">
          <IconVideo size={13} /> No video attached to this listing yet.
        </div>
      </div>
    );
  }

  const candidates = thumbnailCandidates(video);
  const original = originalUrl(video);
  const inlineOk = embedPlaysInline(video.provider);
  const cls = `video video--${orientation === 'wide' ? 'wide' : 'vertical'}`;

  return (
    <div className={cls}>
      {playing ? (
        <>
          {video.provider === 'native' ? (
            <video
              src={video.embedSrc}
              poster={video.poster}
              controls
              autoPlay
              playsInline
              className="video__native"
            />
          ) : (
            <iframe
              src={video.provider === 'youtube' ? `${video.embedSrc}&autoplay=1` : video.embedSrc}
              title={title ?? providerLabel(video.provider)}
              allow={providerAllow(video.provider)}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}

          {/* Embedded IG/FB often shows a login wall — always give an escape. */}
          {!inlineOk && original && (
            <a className="video__open" href={original} target="_blank" rel="noopener noreferrer">
              <IconLink size={12} /> Open on {providerLabel(video.provider)}
            </a>
          )}
        </>
      ) : (
        <button className="video__poster" onClick={() => setPlaying(true)} aria-label="Play video">
          <MediaPreview
            candidates={candidates}
            fallback={gradient}
            provider={video.provider}
            oembedUrl={video.url ?? null}
            alt={title ?? providerLabel(video.provider)}
            className="mp--fill"
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
