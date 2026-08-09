import type { VideoProvider } from '../types';

/**
 * Client for the server-side Meta oEmbed proxy (`/api/oembed`).
 *
 * No credentials live here — the function holds them. This module only asks
 * for a thumbnail and reports whether one exists. When the answer is "no"
 * (unconfigured, private, deleted, rate-limited, timed out) the caller keeps
 * the existing branded EXY fallback, so behaviour never regresses.
 */

export interface OEmbedResult {
  provider: string | null;
  originalUrl: string;
  normalizedUrl: string | null;
  thumbnailUrl: string | null;
  embedHtml: string | null;
  authorName: string | null;
  authorUrl: string | null;
  available: boolean;
  status: string;
  message?: string;
}

/** Providers the proxy can serve. YouTube keeps its own direct path. */
export function usesOEmbedProxy(provider: VideoProvider): boolean {
  return provider === 'instagram' || provider === 'facebook';
}

const memory = new Map<string, OEmbedResult | null>();
const inflight = new Map<string, Promise<OEmbedResult | null>>();

/** Session cache so a scrolling feed never refetches the same post. */
export function peekCached(url: string): OEmbedResult | null | undefined {
  return memory.get(url);
}

export async function fetchOEmbed(url: string, signal?: AbortSignal): Promise<OEmbedResult | null> {
  if (!url) return null;

  const cached = memory.get(url);
  if (cached !== undefined) return cached;

  const pending = inflight.get(url);
  if (pending) return pending;

  const request = (async (): Promise<OEmbedResult | null> => {
    try {
      const response = await fetch(`/api/oembed?url=${encodeURIComponent(url)}`, {
        signal,
        headers: { Accept: 'application/json' },
      });
      // A missing/unbuilt function must not break the card.
      if (!response.ok) {
        memory.set(url, null);
        return null;
      }
      const data = (await response.json()) as OEmbedResult;
      memory.set(url, data);
      return data;
    } catch {
      memory.set(url, null);
      return null;
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, request);
  return request;
}
