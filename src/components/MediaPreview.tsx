import { useEffect, useState } from 'react';
import type { VideoProvider } from '../types';
import { PROVIDER_LABEL } from '../lib/thumbnails';
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
}

/**
 * Resolves the first working thumbnail from an ordered candidate list.
 *
 * A real <img> is used rather than a CSS background so load failures are
 * observable via onError — the previous implementation used background-image,
 * which fails silently and leaves an empty box.
 */
export function MediaPreview({ candidates, fallback, provider, alt, className, branded = true }: Props) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const signature = candidates.join('|');

  // Reset when the candidate set changes (e.g. card recycled in a list).
  useEffect(() => {
    setIndex(0);
    setFailed(false);
  }, [signature]);

  const src = !failed && index < candidates.length ? candidates[index] : null;

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
            if (index + 1 < candidates.length) setIndex(index + 1);
            else setFailed(true);
          }}
        />
      )}

      {/* Branded fallback — never an empty container. */}
      {!src && branded && (
        <span className="mp__fallback">
          <span className="mp__mark">EXY</span>
          {provider && provider !== 'none' && <span className="mp__provider">{PROVIDER_LABEL[provider]}</span>}
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
