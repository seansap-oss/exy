import { fetchOEmbed, usesOEmbedProxy } from './oembed';

/**
 * Loads Instagram's official embed script exactly once per page lifetime.
 * Facebook is deliberately external-only and has no SDK or iframe route in
 * EXY, so it cannot replace the 9:16 player with a provider error screen.
 */

let instagramLoading: Promise<void> | null = null;
let instagramReady = false;

function loadScript(src: string, globalName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return resolve();
    if (document.querySelector(`script[data-embed="${globalName}"]`)) return resolve();

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-embed', globalName);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${globalName}`));
    document.head.appendChild(script);
  });
}

/** Loads Instagram embed.js. Safe to call repeatedly. */
export function loadInstagramEmbeds(): Promise<void> {
  if (instagramReady) return Promise.resolve();
  if (instagramLoading) return instagramLoading;

  instagramLoading = loadScript('https://www.instagram.com/embed.js', 'instagram-embed')
    .then(() => {
      instagramReady = true;
    })
    .catch(() => {
      // A load failure must not break the card; the fallback stays visible.
      instagramLoading = null;
    });

  return instagramLoading;
}

/**
 * Re-parses injected Instagram embed HTML after React commits it.
 */
export function processEmbeds(): void {
  if (typeof window === 'undefined') return;

  // Instagram's documented global is `instgrm`. Keep the legacy misspelling
  // as a compatibility fallback for any older cached embed script.
  const instagram = (window as any).instgrm ?? (window as any).instargramEmbeds;
  if (instagramReady && instagram?.Embeds) {
    try {
      instagram.Embeds.process();
    } catch {
      /* ignore */
    }
  }
}

export { usesOEmbedProxy, fetchOEmbed };
