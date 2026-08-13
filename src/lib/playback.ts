import type { Listing, VideoProvider } from '../types';
import { originalUrl } from './thumbnails';

/**
 * Central playback resolver.
 *
 * Root cause of the dead play button: the feed card's tap handler only
 * flipped a `started` boolean, and the branch that rendered a player also
 * required `listing.video` to exist. Instagram and Facebook cards therefore
 * showed a play icon that changed nothing, and listings with no media at all
 * still rendered the icon.
 *
 * Everything now routes through `resolvePlayback()`, which returns exactly
 * one of four honest outcomes so a control is never decorative.
 */

export type PlaybackKind =
  | 'inline'   // plays inside the EXY player (YouTube iframe, native <video>)
  | 'embed'    // EXY full-screen social experience (official IG iframe or FB hand-off)
  | 'external' // no embeddable form — open the original URL
  | 'none';    // no playable media at all

export interface Playback {
  kind: PlaybackKind;
  provider: VideoProvider | 'none';
  /** Source for inline playback. */
  src: string | null;
  /** Public URL for the "Open original" action. */
  original: string | null;
  /** Button label shown to the user. */
  label: string;
  /** True when a play control should be rendered. */
  playable: boolean;
}

const NO_MEDIA: Playback = {
  kind: 'none',
  provider: 'none',
  src: null,
  original: null,
  label: 'Media unavailable',
  playable: false,
};

/** Providers whose iframe reliably plays inside a third-party page. */
function playsInline(provider: VideoProvider): boolean {
  return provider === 'youtube' || provider === 'native';
}

export function providerActionLabel(provider: VideoProvider | 'none'): string {
  switch (provider) {
    case 'youtube':
      return 'Open on YouTube';
    case 'instagram':
      return 'Open on Instagram';
    case 'facebook':
      return 'Open on Facebook';
    case 'tiktok':
      return 'Open on TikTok';
    default:
      return 'Open original';
  }
}

/**
 * Decides how a listing should play. Never returns a playable result without
 * a usable `src` or `original`, so the UI cannot render a dead control.
 */
export function resolvePlayback(listing: Listing | undefined): Playback {
  if (!listing) return NO_MEDIA;

  // 1. Natively uploaded video wins — it is ours and always plays.
  const nativeVideo = listing.media?.find((item) => item.kind === 'video');
  if (nativeVideo?.src) {
    return {
      kind: 'inline',
      provider: 'native',
      src: nativeVideo.src,
      original: nativeVideo.src,
      label: 'Play video',
      playable: true,
    };
  }

  const video = listing.video;
  if (!video) return NO_MEDIA;

  const original = originalUrl(video) ?? (video.url?.startsWith('http') ? video.url : null);

  // 2. YouTube plays inline in an iframe.
  if (video.provider === 'youtube' && video.embedSrc) {
    return {
      kind: 'inline',
      provider: 'youtube',
      src: video.embedSrc,
      original,
      label: 'Play video',
      playable: true,
    };
  }

  // 3. Instagram can use its official embed when Meta permits it.
  if (video.provider === 'instagram' && (original || video.embedSrc)) {
    return {
      kind: 'embed',
      provider: 'instagram',
      src: video.embedSrc || null,
      original,
      label: 'Play video',
      playable: true,
    };
  }

  // Facebook may reject embedded players in Android WebView because of the
  // post's privacy, region, login, or embedding setting. The Facebook app or
  // browser is the reliable playback surface; do not show a broken iframe.
  if (video.provider === 'facebook' && original) {
    return {
      kind: 'external',
      provider: 'facebook',
      src: null,
      original,
      label: 'Open in Facebook',
      playable: true,
    };
  }

  // 4. Anything else with a real URL: hand off to the platform.
  if (original) {
    return {
      kind: 'external',
      provider: video.provider,
      src: null,
      original,
      label: providerActionLabel(video.provider),
      playable: true,
    };
  }

  // 5. Parsed provider but no usable URL — do not pretend it plays.
  return { ...NO_MEDIA, provider: video.provider };
}

/** Opens the provider page in a new tab / the native app. */
export function openOriginal(url: string | null): boolean {
  if (!url) return false;
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) return true;
    // Popup blocked (common in the Capacitor WebView) — navigate instead.
    window.location.href = url;
    return true;
  } catch {
    return false;
  }
}

/** Opens a social listing in its provider app where supported. Facebook is
 * always an explicit hand-off: it is never mounted inside EXY's player. */
export function handoffToProvider(provider: VideoProvider | 'none', url: string | null): boolean {
  if (!url) return false;
  if (provider !== 'facebook') return openOriginal(url);

  try {
    window.location.href = `fb://facewebmodal/f?href=${encodeURIComponent(url)}`;
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') window.location.href = url;
    }, 850);
    return true;
  } catch {
    return openOriginal(url);
  }
}

/** True when the card should render a play control at all. */
export function hasPlayableMedia(listing: Listing | undefined): boolean {
  return resolvePlayback(listing).playable;
}

/** True when inline playback should be attempted before falling back. */
export function shouldPlayInline(playback: Playback): boolean {
  return playback.kind === 'inline' && Boolean(playback.src) && playsInline(playback.provider as VideoProvider);
}
