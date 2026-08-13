import { useEffect, useState } from 'react';
import type { VideoProvider } from '../types';
import { PROVIDER_LABEL } from '../lib/thumbnails';
import { fetchOEmbed, peekCached, usesOEmbedProxy } from '../lib/oembed';
import { IconFilm, IconImage, IconMusic, IconVideo } from './Icons';

interface Props {
  /** Ordered thumbnail candidates; the first that loads wins. */
  candidates: string[];
  /** CSS gradient shown when every candidate fails. */
  fallback: string;
  provider?: VideoProvider;
  alt: string;
  className?: string;
  /** Renders the branded EXY badge on the fallback tile. */
  branded?: boolean;
  /** Text retained on branded fallbacks when a provider has no thumbnail. */
  title?: string;
  meta?: string;
  sellerAvatar?: string;
  sellerName?: string;
  price?: string;
  /**
   * Original Instagram/Facebook post URL. When supplied, the server-side
   * oEmbed proxy is asked for an official thumbnail and the result is
   * appended to the candidate list. Purely additive — if the proxy has no
   * credentials or the media is unavailable, the existing branded fallback
   * still renders.
   */
  oembedUrl?: string | null;
}

/**
 * Resolves the first working thumbnail from an ordered candidate list.
 *
 * A real <img> is used rather than a CSS background so load failures are
 * observable via onError — the previous implementation used background-image,
 * which fails silently and leaves an empty box.
 */
export function MediaPreview({
  candidates, fallback, provider, alt, className, branded = true, title, meta, sellerAvatar, sellerName, price, oembedUrl,
}: Props) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const signature = candidates.join('|');

  // Official thumbnail resolved by the server-side proxy, appended last so
  // existing direct candidates keep priority and behaviour is unchanged.
  const shouldProxy = Boolean(oembedUrl) && Boolean(provider) && usesOEmbedProxy(provider!);
  const [proxied, setProxied] = useState<string | null>(() =>
    shouldProxy ? (peekCached(oembedUrl!)?.thumbnailUrl ?? null) : null,
  );

  // Reset when the candidate set changes (e.g. card recycled in a list).
  useEffect(() => {
    setIndex(0);
    setFailed(false);
  }, [signature]);

  useEffect(() => {
    if (!shouldProxy || !oembedUrl) return;
    const cached = peekCached(oembedUrl);
    if (cached !== undefined) {
      setProxied(cached?.thumbnailUrl ?? null);
      return;
    }
    let active = true;
    void fetchOEmbed(oembedUrl).then((result) => {
      if (active && result?.thumbnailUrl) {
        setProxied(result.thumbnailUrl);
        setFailed(false);
      }
    });
    return () => {
      active = false;
    };
  }, [shouldProxy, oembedUrl]);

  const chain = proxied ? [...candidates, proxied] : candidates;
  const src = !failed && index < chain.length ? chain[index] : null;

  return (
    <span className={`mp${className ? ` ${className}` : ''}`} style={{ background: fallback }}>
      {src && (
        <img
          className="mp__img"
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => {
            if (index + 1 < chain.length) setIndex(index + 1);
            else setFailed(true);
          }}
        />
      )}

      {/* Branded fallback — never an empty container. */}
      {!src && branded && (
        <span className="mp__fallback">
          {sellerAvatar && <img className="mp__avatar-blur" src={sellerAvatar} alt="" aria-hidden="true" />}
          <span className="mp__fallback-shade" />
          <span className="mp__fallback-content">
            <span className="mp__identity">
              {sellerAvatar ? (
                <img className="mp__avatar" src={sellerAvatar} alt="" aria-hidden="true" />
              ) : (
                <span className="mp__avatar-letter">{(sellerName ?? 'EX').slice(0, 2).toUpperCase()}</span>
              )}
            </span>
            <span className="mp__mark">EXY</span>
            {provider && provider !== 'none' && <span className="mp__provider">{PROVIDER_LABEL[provider]}</span>}
            {title && <strong className="mp__title">{title}</strong>}
            {price && <span className="mp__price">{price}</span>}
            {meta && <span className="mp__meta">{meta}</span>}
          </span>
        </span>
      )}
    </span>
  );
}

/** Small type glyph used on uploaded-media tiles. */
export function MediaKindIcon({ kind, size = 18 }: { kind: 'video' | 'image' | 'audio'; size?: number }) {
  if (kind === 'video') return <IconFilm size={size} />;
  if (kind === 'audio') return <IconMusic size={size} />;
  return <IconImage size={size} />;
}

export { IconVideo };
