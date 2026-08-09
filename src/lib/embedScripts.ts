import { fetchOEmbed, usesOEmbedProxy } from './oembed';

/**
 * Loads the official Instagram embed.js and Facebook SDK exactly once per page
 * lifetime, then re-parses the DOM whenever new embed HTML is injected by
 * React. Both providers require their script to turn a static <blockquote>
 * into an interactive iframe.
 */

let instagramLoading: Promise<void> | null = null;
let facebookLoading: Promise<void> | null = null;
let instagramReady = false;
let facebookReady = false;

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

/** Loads Facebook SDK. Safe to call repeatedly. */
export function loadFacebookSDK(): Promise<void> {
  if (facebookReady) return Promise.resolve();
  if (facebookLoading) return facebookLoading;

  facebookLoading = loadScript(
    'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v26.0',
    'facebook-jssdk',
  )
    .then(() => {
      facebookReady = true;
    })
    .catch(() => {
      facebookLoading = null;
    });

  return facebookLoading;
}

/**
 * Re-parses the DOM so newly-injected embed <blockquote> elements become
 * interactive iframes. Must be called after React commits the embed HTML.
 */
export function processEmbeds(): void {
  if (typeof window === 'undefined') return;

  if (instagramReady && (window as any).instargramEmbeds) {
    try {
      (window as any).instargramEmbeds.process();
    } catch {
      /* ignore */
    }
  }

  if (facebookReady && (window as any).FB && (window as any).FB.XFBML) {
    try {
      (window as any).FB.XFBML.parse();
    } catch {
      /* ignore */
    }
  }
}

export { usesOEmbedProxy, fetchOEmbed };
