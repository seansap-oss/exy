import type { Listing, VideoEmbed, VideoProvider } from '../types';

/**
 * Provider-aware thumbnail resolution.
 *
 * Root cause of the blank media boxes: only YouTube ever produced a poster.
 * Instagram, Facebook and TikTok returned `poster: undefined`, so the preview
 * fell back to a flat gradient that reads as an empty container.
 *
 * We return an ordered candidate list per provider. The renderer walks it and
 * lands on a branded EXY fallback if every remote candidate fails, so a media
 * box is never blank.
 */

/** YouTube publishes several sizes; maxres is absent on many videos. */
export function youtubeCandidates(id: string): string[] {
  return [
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
  ];
}

/**
 * Instagram's /media redirect serves the post image for public posts without
 * any API key or token. Private/deleted posts simply fail the image load and
 * we drop through to the branded fallback.
 */
export function instagramCandidates(_shortcode: string): string[] {
  // The legacy /p/{code}/media/ redirect is retired — it now returns 404 and
  // is blocked by ORB in Chromium, producing failed requests and console
  // noise for zero benefit. Meta also removed `thumbnail_url` from the oEmbed
  // response on 3 Nov 2025, so no still image is obtainable. Instagram cards
  // therefore use the branded EXY fallback and the official embed on play.
  return [];
}

/**
 * Facebook's graph thumbnail endpoint needs a token for most content, so we
 * do not guess. Facebook falls straight through to the branded fallback and
 * the official iframe still plays on tap.
 */
export function facebookCandidates(): string[] {
  return [];
}

/** Ordered thumbnail candidates for any embed. */
export function thumbnailCandidates(video?: VideoEmbed): string[] {
  if (!video) return [];
  const explicit = video.poster ? [video.poster] : [];

  switch (video.provider) {
    case 'youtube':
      return Array.from(new Set([...explicit, ...youtubeCandidates(video.externalId)]));
    case 'instagram':
      return Array.from(new Set([...explicit, ...instagramCandidates(video.externalId)]));
    case 'facebook':
      return Array.from(new Set([...explicit, ...facebookCandidates()]));
    case 'native':
      return explicit;
    default:
      return explicit;
  }
}

/** Best available preview for a whole listing, including uploaded media. */
export function listingCandidates(listing: Listing): string[] {
  const uploadedVideoPoster = listing.media?.find((item) => item.kind === 'video')?.poster;
  const uploadedImage = listing.media?.find((item) => item.kind === 'image')?.src;
  return [
    ...(uploadedVideoPoster ? [uploadedVideoPoster] : []),
    ...(uploadedImage ? [uploadedImage] : []),
    ...thumbnailCandidates(listing.video),
  ].filter(Boolean);
}

/** CSS gradient used when no remote thumbnail resolves. */
export function fallbackGradient(listing?: Listing): string {
  const custom = listing?.photos?.[0];
  if (custom && custom.startsWith('linear-gradient')) return custom;
  return 'linear-gradient(135deg, #2a2013 0%, #14100a 100%)';
}

export const PROVIDER_LABEL: Record<VideoProvider, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  native: 'EXY video',
  none: 'Media',
};

/** Deep link to the original post when embedding is blocked. */
export function originalUrl(video?: VideoEmbed): string | null {
  if (!video) return null;
  if (video.url?.startsWith('http')) return video.url;
  switch (video.provider) {
    case 'youtube':
      return `https://www.youtube.com/watch?v=${video.externalId}`;
    case 'instagram':
      return `https://www.instagram.com/p/${video.externalId}/`;
    case 'facebook':
      return `https://www.facebook.com/reel/${video.externalId}`;
    default:
      return null;
  }
}

/**
 * Providers whose iframe reliably plays inside a third-party page.
 * Instagram and Facebook frequently refuse to play embedded video without a
 * logged-in session, so the UI must always offer "Open original" as well.
 */
export function embedPlaysInline(provider: VideoProvider): boolean {
  return provider === 'youtube' || provider === 'native';
}
