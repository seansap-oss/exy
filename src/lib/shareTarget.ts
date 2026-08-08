import type { VideoEmbed } from '../types';
import { parseVideoUrl } from './embeds';

export interface SharePayload {
  url: string;
  title: string;
  text: string;
  video: VideoEmbed | null;
  /** Caption with the URL stripped out, ready to use as a description. */
  caption: string;
}

const URL_RE = /https?:\/\/[^\s]+/gi;

/**
 * Module 2.1 — reads the payload delivered by the PWA share_target
 * (`/share?title=&text=&url=`) or an Android ACTION_SEND / iOS Share Extension
 * bridge. Social apps are inconsistent: some put the link in `url`, most bury
 * it inside `text`, so we scan every field.
 */
export function readSharePayload(search: string = window.location.search): SharePayload | null {
  const params = new URLSearchParams(search);
  const url = params.get('url') ?? '';
  const title = params.get('title') ?? '';
  const text = params.get('text') ?? '';

  if (!url && !title && !text) return null;

  const candidates = [url, text, title].filter(Boolean);
  let found = '';
  let video: VideoEmbed | null = null;

  for (const candidate of candidates) {
    const matches = candidate.match(URL_RE) ?? [];
    for (const match of matches) {
      const parsed = parseVideoUrl(match);
      if (parsed) {
        video = parsed;
        found = match;
        break;
      }
      if (!found) found = match;
    }
    if (video) break;
  }

  const caption = [title, text]
    .filter(Boolean)
    .join('\n')
    .replace(URL_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { url: found || url, title, text, video, caption };
}

/** True when the app was launched through the share target route. */
export function isShareLaunch(pathname = window.location.pathname, search = window.location.search): boolean {
  if (pathname.startsWith('/share')) return true;
  const params = new URLSearchParams(search);
  return params.has('url') || params.has('text');
}

/** Clears share params so a refresh doesn't reopen the drawer. */
export function clearShareParams(): void {
  if (typeof window === 'undefined') return;
  window.history.replaceState({}, '', '/');
}

/* -------------------------------------------------------------------------- */
/* Shared-URL durability                                                       */
/* -------------------------------------------------------------------------- */
const PENDING_KEY = 'exy.v2.pendingShareUrl';

/**
 * Holds the shared URL outside React state so it survives a drawer remount,
 * an auth round-trip or an accidental reload while the form is open.
 * sessionStorage is deliberate: it must not leak into a later session.
 */
export function keepSharedUrl(url: string): void {
  try {
    if (url) sessionStorage.setItem(PENDING_KEY, url);
  } catch {
    /* private mode */
  }
}

export function recoverSharedUrl(): string {
  try {
    return sessionStorage.getItem(PENDING_KEY) ?? '';
  } catch {
    return '';
  }
}

export function releaseSharedUrl(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}
