import { useEffect, useState } from 'react';
import type { VideoEmbed as VideoEmbedType } from '../types';
import { providerLabel } from '../lib/embeds';
import {
  fetchOEmbed,
  loadFacebookSDK,
  loadInstagramEmbeds,
  processEmbeds,
  usesOEmbedProxy,
} from '../lib/embedScripts';
import { fallbackGradient, originalUrl } from '../lib/thumbnails';
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
 * - Instagram / FB    → fetches official embed HTML from the server-side
 *                       proxy and mounts it here; the embed script is loaded
 *                       and re-parsed after render so the blockquote becomes
 *                       an interactive iframe. "Open on …" is always offered
 *                       in case the provider blocks embedded playback.
 * - No/failed media   → branded EXY preview, never an empty box
 */
export function VideoEmbed({ video, fallback, orientation = 'vertical', autoStart = false, title }: Props) {
  const [playing, setPlaying] = useState(autoStart);
  const gradient = fallback ?? fallbackGradient();

  // Official embed HTML, fetched from the proxy for IG/FB only.
  const useProxy = Boolean(video) && usesOEmbedProxy(video!.provider);
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!video || !useProxy) {
      setEmbedHtml(null);
      return;
    }
    if (!video.url) return;
    let active = true;
    void fetchOEmbed(video.url).then((result) => {
      if (active && result?.embedHtml) {
        setEmbedHtml(result.embedHtml);
      }
    });
    return () => {
      active = false;
    };
  }, [video, useProxy]);

  // Load the relevant embed script, then re-parse after the HTML commits.
  useEffect(() => {
    if (!embedHtml || !video) return;
    const init = video.provider === 'facebook' ? loadFacebookSDK : loadInstagramEmbeds;
    void init()
      .then(() => processEmbeds())
      .catch(() => {
        /* fallback remains visible */
      });
  }, [embedHtml, video]);

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

  const original = originalUrl(video);
  const cls = `video video--${orientation === 'wide' ? 'wide' : 'vertical'}`;

  return (
    <div className={cls}>
      {playing ? (
        <>
          {video.provider === 'native' ? (
            <video src={video.embedSrc} poster={video.poster} controls autoPlay playsInline className="video__native" />
          ) : video.provider === 'youtube' ? (
            <iframe
              src={`${video.embedSrc}${video.embedSrc.includes('?') ? '&' : '?'}autoplay=1&mute=1&controls=1&playsinline=1&rel=0`}
              title={title ?? providerLabel(video.provider)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : embedHtml ? (
            <div
              className="video__embed"
              // Official IG/FB embed HTML (blockquote + script-driven iframe).
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: embedHtml }}
              ref={() => {
                // Re-parse once React has committed the new DOM nodes.
                void (video.provider === 'facebook' ? loadFacebookSDK : loadInstagramEmbeds)().then(() =>
                  processEmbeds(),
                );
              }}
            />
          ) : (
            <iframe
              src={video.embedSrc}
              title={title ?? providerLabel(video.provider)}
              allow=""
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}

          {/* Embedded IG/FB often shows a login wall — always give an escape. */}
          {(video.provider === 'instagram' || video.provider === 'facebook') && original && (
            <a className="video__open" href={original} target="_blank" rel="noopener noreferrer">
              <IconLink size={12} /> Open on {providerLabel(video.provider)}
            </a>
          )}
        </>
      ) : (
        <button className="video__poster" onClick={() => setPlaying(true)} aria-label="Play video">
          <MediaPreview
            candidates={[]}
            fallback={gradient}
            provider={video.provider}
            alt={title ?? providerLabel(video.provider)}
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
