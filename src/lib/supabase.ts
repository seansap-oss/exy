import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { androidBuildConfig } from '../generated/buildConfig';

// Android builds get their public Supabase settings from the generated module
// written by the guarded production build. The Vite values remain the source
// for normal web deployments.
const nativeConfig = Capacitor.isNativePlatform() ? androidBuildConfig : null;
const SUPABASE_URL = ((nativeConfig?.supabaseUrl ?? '') || (import.meta.env.VITE_SUPABASE_URL as string) || '').trim();
const ANON_KEY = ((nativeConfig?.supabaseAnonKey ?? '') || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '').trim();

function configProblem(): string | null {
  if (!SUPABASE_URL || !ANON_KEY) return 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY at build time.';
  try {
    const parsed = new URL(SUPABASE_URL);
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) {
      return 'VITE_SUPABASE_URL must be the HTTPS URL of the production Supabase project.';
    }
  } catch {
    return 'VITE_SUPABASE_URL is not a valid URL.';
  }
  if (ANON_KEY.length < 20 || /your_|placeholder|example|test\.signature/i.test(ANON_KEY)) {
    return 'VITE_SUPABASE_ANON_KEY is missing or is still a placeholder.';
  }
  return null;
}

/**
 * Static config is compiled into Vite/Capacitor at build time. It cannot be
 * repaired after an APK has been built, so release builds run a preflight.
 */
export const supabaseConfigProblem = configProblem();

/**
 * Supabase is the system of record for auth, profiles, listings, threads and
 * analytics. When credentials are absent the app transparently falls back to a
 * local mock driver so the platform stays fully demoable offline.
 */
export const supabase: SupabaseClient | null =
  !supabaseConfigProblem
    ? createClient(SUPABASE_URL, ANON_KEY, {
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
  ticker: 'ticker_settings',
  packages: 'packages',
  payments: 'payments',
} as const;

export interface SupabaseHealth {
  ok: boolean;
  message: string;
}

/** Lightweight production-read probe used by diagnostics and release tests. */
export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  if (!supabase) return { ok: false, message: supabaseConfigProblem ?? 'Supabase client is unavailable.' };
  try {
    const { error } = await supabase.from(SUPABASE_TABLES.ticker).select('id').eq('id', 1).limit(1);
    if (error) return { ok: false, message: `Supabase reachable, but ticker_settings is unavailable: ${error.message}` };
    return { ok: true, message: 'Supabase configuration and ticker_settings read are healthy.' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Unable to reach Supabase.' };
  }
}

export const STORAGE_BUCKETS = {
  video: 'exy-video',
  image: 'exy-image',
  audio: 'exy-audio',
} as const;
