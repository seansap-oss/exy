import { useState } from 'react';
import type { VideoEmbed as VideoEmbedType } from '../types';
import { providerAllow, providerLabel } from '../lib/embeds';
import { IconPlay, IconVideo } from './Icons';

interface Props {
  video?: VideoEmbedType;
  fallback?: string;
  orientation?: 'vertical' | 'wide';
  autoStart?: boolean;
  title?: string;
}

export function VideoEmbed({ video, fallback, orientation = 'vertical', autoStart = false, title }: Props) {
  const [playing, setPlaying] = useState(autoStart);

  if (!video) {
    return (
      <div className="video">
        <div className="video__empty" style={fallback ? { background: fallback } : undefined}>
          <IconVideo size={26} />
          <span>No social video attached to this listing yet.</span>
        </div>
      </div>
    );
  }

  const cls = `video video--${orientation === 'wide' || video.provider === 'youtube' ? (orientation === 'wide' ? 'wide' : 'vertical') : 'vertical'}`;
  const posterStyle = video.poster
    ? { backgroundImage: `url(${video.poster})` }
    : fallback
      ? { background: fallback }
      : { background: '#101010' };

  return (
    <div className={cls}>
      {playing ? (
        <iframe
          src={video.provider === 'youtube' ? `${video.embedSrc}&autoplay=1` : video.embedSrc}
          title={title ?? providerLabel(video.provider)}
          allow={providerAllow(video.provider)}
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button className="video__poster" style={posterStyle} onClick={() => setPlaying(true)} aria-label="Play video">
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
