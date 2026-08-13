import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * EXY — secure Meta oEmbed proxy.
 *
 * Fetches official Instagram / Facebook embed metadata server-side so the
 * browser and APK never see Meta credentials.
 *
 * ACCESS MODEL (verified against Meta docs + live API, Graph v26.0):
 *
 * On 15 Jun 2026 Meta lifted the access-token requirement from all oEmbed
 * endpoints, so App Review and Business Verification are NO LONGER required
 * to embed public content. Tokenless calls are capped at 1,000 requests per
 * endpoint per hour; an approved app token raises that to 5M/day.
 *
 * Optional server-only environment variables:
 *   META_APP_ID      - Meta app id
 *   META_APP_SECRET  - Meta app secret (NEVER sent to the client)
 *
 * When present, `{app-id}|{app-secret}` is attached purely to obtain the
 * higher rate limit. It is used only in the outbound request to
 * graph.facebook.com and never echoed in a response.
 *
 * IMPORTANT — no thumbnails: Meta removed `thumbnail_url`, `thumbnail_width`,
 * `thumbnail_height`, `author_name` and `author_url` from Facebook post,
 * Facebook video and Instagram post oEmbed responses on 3 Nov 2025, across
 * all API versions. Responses now carry embed `html` only. The frontend
 * therefore keeps its branded EXY fallback for the still image and uses this
 * embed HTML / the original link for playback.
 */

const GRAPH_VERSION = 'v26.0';
const FETCH_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h in-memory
const CACHE_MAX_ENTRIES = 500;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60; // per IP per minute

/* -------------------------------------------------------------------------- */
/* Strict URL validation — the endpoint must not become an open proxy          */
/* -------------------------------------------------------------------------- */
const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com', 'instagr.am', 'www.instagr.am']);
const FACEBOOK_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'web.facebook.com',
  'fb.watch',
  'www.fb.watch',
]);

export type Provider = 'instagram' | 'facebook';

interface Normalized {
  provider: Provider;
  /** Canonical URL handed to Meta */
  normalizedUrl: string;
  /** Shortcode (IG) or numeric id (FB) when derivable */
  externalId: string | null;
}

const IG_PATH = /^\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)\/?$/;

/**
 * Accepts only public Instagram/Facebook post URLs. Everything else — other
 * hosts, non-https schemes, credentials, ports, path traversal — is rejected,
 * so this cannot be used to fetch arbitrary internal or third-party URLs.
 */
export function normalizeUrl(raw: string): Normalized | null {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }

  // Block credentials, non-standard ports and non-https schemes (SSRF guards).
  if (parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password) return null;
  if (parsed.port && parsed.port !== '443') return null;

  const host = parsed.hostname.toLowerCase();

  if (INSTAGRAM_HOSTS.has(host)) {
    const match = parsed.pathname.replace(/\/+$/, '/').match(IG_PATH);
    if (!match) return null;
    const shortcode = match[1];
    // Canonical /p/ form is what Meta's oEmbed expects.
    return {
      provider: 'instagram',
      normalizedUrl: `https://www.instagram.com/p/${shortcode}/`,
      externalId: shortcode,
    };
  }

  if (FACEBOOK_HOSTS.has(host)) {
    const path = parsed.pathname;
    const reel = path.match(/^\/reel\/(\d+)/);
    const videos = path.match(/^\/[^/]+\/videos\/(?:[^/]+\/)?(\d+)/);
    // Facebook's share drawer produces these short public-link forms. They
    // have a non-numeric token, so preserve the exact URL for Meta instead of
    // rejecting it or incorrectly turning it into a /reel/ URL.
    const share = path.match(/^\/share\/[vr]\/([A-Za-z0-9_-]+)/);
    const watch = parsed.searchParams.get('v');
    const shortLink = host.endsWith('fb.watch') && path.length > 1;
    const id = reel?.[1] ?? videos?.[1] ?? share?.[1] ?? (watch && /^\d+$/.test(watch) ? watch : null);

    // fb.watch short links carry no parseable id; pass them through verbatim.
    if (!id && !shortLink) return null;
    return {
      provider: 'facebook',
      normalizedUrl: reel ? `https://www.facebook.com/reel/${id}` : parsed.toString(),
      externalId: id,
    };
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* In-memory cache + rate limit (per warm lambda instance)                     */
/* -------------------------------------------------------------------------- */
interface CacheEntry {
  body: OEmbedResponse;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const hits = new Map<string, { count: number; resets: number }>();

function cacheGet(key: string): OEmbedResponse | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.body;
}

function cacheSet(key: string, body: OEmbedResponse): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { body, expires: Date.now() + CACHE_TTL_MS });
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resets) {
    hits.set(ip, { count: 1, resets: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

/* -------------------------------------------------------------------------- */
/* Response shape                                                              */
/* -------------------------------------------------------------------------- */
export interface OEmbedResponse {
  provider: Provider | null;
  originalUrl: string;
  normalizedUrl: string | null;
  /** Present only when Meta returns one. */
  thumbnailUrl: string | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
  /** Official embed markup, when supplied. */
  embedHtml: string | null;
  authorName: string | null;
  authorUrl: string | null;
  /** false → frontend keeps the branded EXY fallback. */
  available: boolean;
  /** Machine-readable reason when unavailable. */
  status:
    | 'ok'
    | 'not_configured'
    | 'unsupported_url'
    | 'not_found'
    | 'restricted'
    | 'rate_limited'
    | 'timeout'
    | 'provider_error';
  message?: string;
  cached?: boolean;
}

function baseResponse(originalUrl: string, normalized: Normalized | null): OEmbedResponse {
  return {
    provider: normalized?.provider ?? null,
    originalUrl,
    normalizedUrl: normalized?.normalizedUrl ?? null,
    thumbnailUrl: null,
    thumbnailWidth: null,
    thumbnailHeight: null,
    embedHtml: null,
    authorName: null,
    authorUrl: null,
    available: false,
    status: 'provider_error',
  };
}

/* -------------------------------------------------------------------------- */
/* Meta request                                                                */
/* -------------------------------------------------------------------------- */
function endpointFor(provider: Provider): string {
  return provider === 'instagram' ? 'instagram_oembed' : 'oembed_video';
}

async function fetchOEmbed(
  normalized: Normalized,
  appToken: string | null,
  originalUrl: string,
): Promise<OEmbedResponse> {
  const result = baseResponse(originalUrl, normalized);

  const params = new URLSearchParams({
    url: normalized.normalizedUrl,
    maxwidth: '640',
  });
  // Optional: only raises the rate limit. Tokenless works since 15 Jun 2026.
  if (appToken) params.set('access_token', appToken);
  // Do not inject Meta's own script tag into our page.
  params.set('omitscript', 'true');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${endpointFor(normalized.provider)}?${params}`,
      { signal: controller.signal, headers: { Accept: 'application/json' } },
    );

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      const error = (payload.error ?? {}) as Record<string, unknown>;
      const code = Number(error.code ?? 0);
      const subcode = Number(error.error_subcode ?? 0);

      // 4 = app rate limit, 17 = user rate limit, 32/613 = throttled
      if ([4, 17, 32, 613].includes(code)) {
        return { ...result, status: 'rate_limited', message: 'Provider rate limit reached.' };
      }
      // 24/2207045 = media not found; 100 = bad/unavailable parameter
      if (code === 24 || subcode === 2207045 || code === 100) {
        return { ...result, status: 'not_found', message: 'Media unavailable, private or deleted.' };
      }
      if (code === 10 || code === 200) {
        return { ...result, status: 'restricted', message: 'Media cannot be embedded.' };
      }
      return { ...result, status: 'provider_error', message: 'Provider returned an error.' };
    }

    const thumbnail = typeof payload.thumbnail_url === 'string' ? payload.thumbnail_url : null;
    const html = typeof payload.html === 'string' ? payload.html : null;

    return {
      ...result,
      thumbnailUrl: thumbnail,
      thumbnailWidth: typeof payload.thumbnail_width === 'number' ? payload.thumbnail_width : null,
      thumbnailHeight: typeof payload.thumbnail_height === 'number' ? payload.thumbnail_height : null,
      embedHtml: html,
      authorName: typeof payload.author_name === 'string' ? payload.author_name : null,
      authorUrl: typeof payload.author_url === 'string' ? payload.author_url : null,
      // Meta dropped thumbnail_url on 3 Nov 2025, so embed HTML is the proof
      // that the media exists and is publicly embeddable.
      available: Boolean(html),
      status: html ? 'ok' : 'restricted',
      message: html
        ? thumbnail
          ? undefined
          : 'Provider no longer returns thumbnails; embed HTML supplied.'
        : 'Provider returned no embeddable media.',
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return {
      ...result,
      status: aborted ? 'timeout' : 'provider_error',
      message: aborted ? 'Provider request timed out.' : 'Could not reach the provider.',
    };
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------------------------------------------------- */
/* Handler                                                                     */
/* -------------------------------------------------------------------------- */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  // Same-origin JSON API. No wildcard CORS, so third parties cannot use this
  // as a free oEmbed proxy from the browser.
  response.setHeader('Vary', 'Origin');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const raw = typeof request.query.url === 'string' ? request.query.url : '';
  if (!raw) {
    return response.status(400).json({ ...baseResponse('', null), status: 'unsupported_url', message: 'Missing url parameter.' });
  }
  if (raw.length > 512) {
    return response.status(400).json({ ...baseResponse('', null), status: 'unsupported_url', message: 'URL too long.' });
  }

  const forwarded = request.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) {
    response.setHeader('Retry-After', '60');
    return response.status(429).json({ ...baseResponse(raw, null), status: 'rate_limited', message: 'Too many requests.' });
  }

  const normalized = normalizeUrl(raw);
  if (!normalized) {
    // 200 with available:false keeps the card rendering its branded fallback.
    response.setHeader('Cache-Control', 'public, max-age=300');
    return response.status(200).json({
      ...baseResponse(raw, null),
      status: 'unsupported_url',
      message: 'Only public Instagram or Facebook post URLs are supported.',
    });
  }

  // Credentials are OPTIONAL since 15 Jun 2026 - they only raise the rate
  // limit from 1,000/hour to 5M/day. Absence must not block the request.
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const appToken = appId && appSecret ? `${appId}|${appSecret}` : null;

  const cacheKey = `${normalized.provider}:${normalized.normalizedUrl}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    response.setHeader('Cache-Control', 'public, max-age=21600, stale-while-revalidate=86400');
    response.setHeader('X-EXY-Cache', 'HIT');
    return response.status(200).json({ ...cached, cached: true });
  }

  const result = await fetchOEmbed(normalized, appToken, raw);

  // Cache only successes; failures may be transient.
  if (result.status === 'ok') {
    cacheSet(cacheKey, result);
    response.setHeader('Cache-Control', 'public, max-age=21600, stale-while-revalidate=86400');
  } else {
    response.setHeader('Cache-Control', 'public, max-age=300');
  }
  response.setHeader('X-EXY-Cache', 'MISS');

  // Always 200 so the frontend renders its fallback rather than erroring.
  return response.status(200).json(result);
}
