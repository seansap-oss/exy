import type { VideoEmbed, VideoProvider } from '../types';

const YT_PATTERNS = [
  /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/i,
  /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i,
  /youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,})/i,
  /youtu\.be\/([A-Za-z0-9_-]{6,})/i,
];

const IG_PATTERNS = [
  /instagram\.com\/(reels?)\/([A-Za-z0-9_-]+)/i,
  /instagram\.com\/(p)\/([A-Za-z0-9_-]+)/i,
  /instagram\.com\/(tv)\/([A-Za-z0-9_-]+)/i,
];

const FB_PATTERNS = [
  /facebook\.com\/reel\/(\d+)/i,
  /facebook\.com\/[^/]+\/videos\/(\d+)/i,
  /facebook\.com\/watch\/?\?v=(\d+)/i,
  /facebook\.com\/share\/v\/([A-Za-z0-9_-]+)/i,
  /facebook\.com\/share\/r\/([A-Za-z0-9_-]+)/i,
  /fb\.watch\/([A-Za-z0-9_-]+)/i,
];

const TT_PATTERNS = [/tiktok\.com\/@[^/]+\/video\/(\d+)/i, /tiktok\.com\/t\/([A-Za-z0-9]+)/i];

function match(url: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const found = url.match(pattern);
    if (found?.[1]) return found[1];
  }
  return null;
}

/** Keeps the published Instagram route intact. A Reel cannot be embedded as
 * a normal `/p/` post: Meta returns its localised "unavailable" page. */
function instagramEmbedPath(url: string): { id: string; path: 'reel' | 'p' | 'tv' } | null {
  for (const pattern of IG_PATTERNS) {
    const found = url.match(pattern);
    if (!found) continue;
    const path = found[1].toLowerCase();
    const id = found[2];
    if (!id) continue;
    return { id, path: path === 'reels' || path === 'reel' ? 'reel' : path as 'p' | 'tv' };
  }
  return null;
}

export function detectProvider(url: string): VideoProvider {
  const value = url.trim().toLowerCase();
  if (!value) return 'none';
  if (value.includes('youtube.com') || value.includes('youtu.be')) return 'youtube';
  if (value.includes('instagram.com')) return 'instagram';
  if (value.includes('facebook.com') || value.includes('fb.watch')) return 'facebook';
  if (value.includes('tiktok.com')) return 'tiktok';
  return 'none';
}

/**
 * Parses any supported social video URL into a playback descriptor.
 * Returns null when the URL cannot be resolved to a known embed.
 */
export function parseVideoUrl(rawUrl: string, autoplay = false): VideoEmbed | null {
  const url = (rawUrl || '').trim();
  if (!url) return null;
  const provider = detectProvider(url);

  if (provider === 'youtube') {
    const id = match(url, YT_PATTERNS);
    if (!id) return null;
    return {
      provider,
      url,
      externalId: id,
      embedSrc: `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&rel=0&playsinline=1&modestbranding=1`,
      poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  if (provider === 'instagram') {
    const parsed = instagramEmbedPath(url);
    if (!parsed) return null;
    return {
      provider,
      url,
      externalId: parsed.id,
      // Use the exact content route. Reels and feed posts have different
      // official embed endpoints; converting every URL to /p/ breaks Reels.
      embedSrc: `https://www.instagram.com/${parsed.path}/${parsed.id}/embed/`,
    };
  }

  if (provider === 'facebook') {
    const id = match(url, FB_PATTERNS);
    return {
      provider,
      url,
      externalId: id ?? url,
      // Facebook's iframe/plugin frequently renders a provider-controlled,
      // localised error document inside Android WebView. Keep the public URL
      // as the source of truth and hand off to Facebook instead of embedding.
      embedSrc: '',
    };
  }

  if (provider === 'tiktok') {
    const id = match(url, TT_PATTERNS);
    if (!id) return null;
    return {
      provider,
      url,
      externalId: id,
      embedSrc: `https://www.tiktok.com/embed/v2/${id}`,
    };
  }

  return null;
}

export function providerLabel(provider: VideoProvider): string {
  switch (provider) {
    case 'youtube':
      return 'YouTube Short';
    case 'instagram':
      return 'Instagram Reel';
    case 'facebook':
      return 'Facebook Reel';
    case 'tiktok':
      return 'TikTok';
    default:
      return 'Video';
  }
}

export function providerAllow(provider: VideoProvider): string {
  if (provider === 'youtube')
    return 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  return 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
}
