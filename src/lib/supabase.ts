import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

/**
 * Supabase is the system of record for auth, profiles, listings, threads and
 * analytics. When credentials are absent the app transparently falls back to a
 * local mock driver so the platform stays fully demoable offline.
 */
export const supabase: SupabaseClient | null =
  URL && ANON_KEY
    ? createClient(URL, ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'exy.auth',
        },
      })
    : null;

export const isSupabaseLive = supabase !== null;

export const SUPABASE_TABLES = {
  profiles: 'profiles',
  listings: 'listings',
  categories: 'categories',
  savedAds: 'saved_ads',
  threads: 'threads',
  messages: 'messages',
  analytics: 'ad_events',
  ticker: 'ticker_config',
  packages: 'packages',
  payments: 'payments',
} as const;

export const STORAGE_BUCKETS = {
  video: 'exy-video',
  image: 'exy-image',
  audio: 'exy-audio',
} as const;
