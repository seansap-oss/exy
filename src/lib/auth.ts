import type { Profile, Session, SignUpInput, UserRole } from '../types';
import { supabase, isSupabaseLive, SUPABASE_TABLES } from './supabase';
import { load, save, uid } from './storage';

const AVATAR_COLORS = ['#f2713a', '#2563eb', '#16a34a', '#7c3aed', '#c08a2e', '#0ea5a4', '#be185d'];

export interface AuthResult {
  ok: boolean;
  error?: string;
  profile?: Profile;
  session?: Session;
  /** true when Supabase requires the user to click the verification email */
  needsEmailVerification?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Validation (Module 1.1)                                                     */
/* -------------------------------------------------------------------------- */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function validateSignUp(input: SignUpInput, takenUsernames: string[]): string | null {
  if (input.fullName.trim().length < 2) return 'Enter your full name.';
  const username = input.username.trim().toLowerCase();
  if (!USERNAME_RE.test(username))
    return 'Username must be 3–20 characters using lowercase letters, numbers or underscore.';
  if (takenUsernames.includes(username)) return 'That username is already taken.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.email.trim())) return 'Enter a valid email address.';
  if (input.password.length < 8) return 'Password must be at least 8 characters.';
  if (input.phone && input.phone.replace(/\D/g, '').length < 10) return 'Enter a valid phone number, or leave it blank.';
  return null;
}

/* -------------------------------------------------------------------------- */
/* Local mock driver — used when Supabase env vars are absent                  */
/* -------------------------------------------------------------------------- */
interface MockAccount {
  profile: Profile;
  password: string;
}

function mockAccounts(): MockAccount[] {
  return load<MockAccount[]>('accounts', []);
}

function persistAccounts(accounts: MockAccount[]) {
  save('accounts', accounts);
}

function mockJwt(payload: Record<string, unknown>): string {
  const enc = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/=+$/, '');
  return `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({ ...payload, iat: Math.floor(Date.now() / 1000) })}.exy_local_sig`;
}

function newSession(userId: string, role: UserRole): Session {
  return {
    accessToken: mockJwt({ sub: userId, role, iss: 'exy-local' }),
    refreshToken: uid('rt'),
    expiresAt: Date.now() + 3600_000,
    userId,
  };
}

export function blankProfile(input: SignUpInput, index: number): Profile {
  const username = input.username.trim().toLowerCase();
  return {
    id: uid('usr'),
    fullName: input.fullName.trim(),
    username,
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || null,
    emailVerified: false,
    role: input.email.trim().toLowerCase().startsWith('admin@') ? 'admin' : 'user',
    tier: 'free',
    tierExpiry: null,
    isSeller: false,
    businessName: null,
    bio: null,
    verification: 'none',
    storefrontUrl: null,
    storefrontHandle: null,
    avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    location: 'India',
    hidePhone: false,
    rating: 5,
    responseTime: 'New member',
    createdAt: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */
export async function signUp(input: SignUpInput): Promise<AuthResult> {
  const accounts = mockAccounts();
  const error = validateSignUp(
    input,
    accounts.map((account) => account.profile.username),
  );
  if (error) return { ok: false, error };

  if (isSupabaseLive && supabase) {
    const { data, error: authError } = await supabase.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/?verified=1`,
        data: { full_name: input.fullName.trim(), username: input.username.trim().toLowerCase(), phone: input.phone ?? null },
      },
    });
    if (authError) return { ok: false, error: authError.message };
    if (!data.user) return { ok: false, error: 'Sign-up failed. Try again.' };

    const profile: Profile = { ...blankProfile(input, 0), id: data.user.id };
    await supabase.from(SUPABASE_TABLES.profiles).insert({
      id: profile.id,
      full_name: profile.fullName,
      username: profile.username,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      tier: profile.tier,
      avatar_color: profile.avatarColor,
    });

    return {
      ok: true,
      profile,
      needsEmailVerification: !data.session,
      session: data.session
        ? {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: (data.session.expires_at ?? 0) * 1000,
            userId: data.user.id,
          }
        : undefined,
    };
  }

  // Local driver — simulate the Supabase email-verification handshake.
  const profile = blankProfile(input, accounts.length);
  persistAccounts([...accounts, { profile, password: input.password }]);
  return { ok: true, profile, needsEmailVerification: true };
}

export async function confirmEmail(email: string): Promise<AuthResult> {
  const accounts = mockAccounts();
  const index = accounts.findIndex((account) => account.profile.email === email.trim().toLowerCase());
  if (index < 0) return { ok: false, error: 'No pending account found for that email.' };

  const updated = [...accounts];
  updated[index] = { ...updated[index], profile: { ...updated[index].profile, emailVerified: true } };
  persistAccounts(updated);

  const profile = updated[index].profile;
  return { ok: true, profile, session: newSession(profile.id, profile.role) };
}

/**
 * Signs in against the local driver only, bypassing Supabase.
 * Used by the demo shortcuts when the Supabase profile layer is not migrated,
 * so testers are never locked out by a missing table or unconfirmed email.
 */
export async function signInLocal(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const accounts = mockAccounts();
  const account = accounts.find((item) => item.profile.email === cleanEmail);
  if (!account) return { ok: false, error: 'No local account found.' };
  if (account.password !== password) return { ok: false, error: 'Incorrect password.' };
  return { ok: true, profile: account.profile, session: newSession(account.profile.id, account.profile.role) };
}

/** Creates + confirms a local account without touching Supabase. */
export async function signUpLocal(input: SignUpInput): Promise<AuthResult> {
  const accounts = mockAccounts();
  if (accounts.some((item) => item.profile.email === input.email.trim().toLowerCase())) {
    return signInLocal(input.email, input.password);
  }
  const profile = { ...blankProfile(input, accounts.length), emailVerified: true };
  persistAccounts([...accounts, { profile, password: input.password }]);
  return { ok: true, profile, session: newSession(profile.id, profile.role) };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseLive && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      // Supabase reports "Email not confirmed" when the account exists but the
      // verification link was never clicked. Surface that distinctly so the UI
      // can offer to resend it instead of showing a dead-end error.
      if (/email not confirmed/i.test(error.message)) {
        return {
          ok: false,
          error: 'This account exists but its email is not confirmed. Resend the link below, or confirm the user in Supabase.',
          needsEmailVerification: true,
        };
      }
      return { ok: false, error: error.message };
    }
    if (!data.user.email_confirmed_at) return { ok: false, error: 'Please confirm your email before signing in.', needsEmailVerification: true };

    const { data: row } = await supabase.from(SUPABASE_TABLES.profiles).select('*').eq('id', data.user.id).single();
    return {
      ok: true,
      profile: row ? rowToProfile(row) : undefined,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: (data.session.expires_at ?? 0) * 1000,
        userId: data.user.id,
      },
    };
  }

  const accounts = mockAccounts();
  const account = accounts.find((item) => item.profile.email === cleanEmail);
  if (!account) return { ok: false, error: 'No account found with that email.' };
  if (account.password !== password) return { ok: false, error: 'Incorrect password.' };
  if (!account.profile.emailVerified)
    return { ok: false, error: 'Confirm your email address to activate the account.', needsEmailVerification: true, profile: account.profile };

  return { ok: true, profile: account.profile, session: newSession(account.profile.id, account.profile.role) };
}

export async function signOut(): Promise<void> {
  if (isSupabaseLive && supabase) await supabase.auth.signOut();
}

/** Re-sends the Supabase confirmation email for an unconfirmed account. */
export async function resendConfirmation(email: string): Promise<AuthResult> {
  if (!isSupabaseLive || !supabase) return { ok: false, error: 'Supabase is not configured.' };
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: `${window.location.origin}/?verified=1` },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * True when the Supabase profile layer is unreachable — either credentials are
 * absent or the `profiles` table has not been migrated yet. In that state the
 * app runs on the local driver, so the demo shortcuts must stay available.
 */
export async function profilesTableReady(): Promise<boolean> {
  if (!isSupabaseLive || !supabase) return false;
  try {
    const { error } = await supabase.from(SUPABASE_TABLES.profiles).select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export function persistProfile(profile: Profile): void {
  const accounts = mockAccounts();
  const index = accounts.findIndex((account) => account.profile.id === profile.id);
  if (index >= 0) {
    const updated = [...accounts];
    updated[index] = { ...updated[index], profile };
    persistAccounts(updated);
  }
  if (isSupabaseLive && supabase) {
    void supabase
      .from(SUPABASE_TABLES.profiles)
      .update({
        full_name: profile.fullName,
        phone: profile.phone,
        tier: profile.tier,
        tier_expiry: profile.tierExpiry,
        is_seller: profile.isSeller,
        business_name: profile.businessName,
        bio: profile.bio,
        verification: profile.verification,
        storefront_url: profile.storefrontUrl,
        storefront_handle: profile.storefrontHandle,
        hide_phone: profile.hidePhone,
        location: profile.location,
      })
      .eq('id', profile.id);
  }
}

export function allLocalProfiles(): Profile[] {
  return mockAccounts().map((account) => account.profile);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToProfile(row: any): Profile {
  return {
    id: row.id,
    fullName: row.full_name ?? '',
    username: row.username ?? '',
    email: row.email ?? '',
    phone: row.phone ?? null,
    emailVerified: true,
    role: (row.role ?? 'user') as UserRole,
    tier: row.tier ?? 'free',
    tierExpiry: row.tier_expiry ?? null,
    isSeller: !!row.is_seller,
    businessName: row.business_name ?? null,
    bio: row.bio ?? null,
    verification: row.verification ?? 'none',
    storefrontUrl: row.storefront_url ?? null,
    storefrontHandle: row.storefront_handle ?? null,
    avatarColor: row.avatar_color ?? '#f2713a',
    location: row.location ?? 'India',
    hidePhone: !!row.hide_phone,
    rating: row.rating ?? 5,
    responseTime: row.response_time ?? 'New member',
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

/** Public seller view of a profile (used by storefronts and listing cards). */
export function profileToSeller(profile: Profile): {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatarColor: string;
  location: string;
  phone: string;
  hidePhone: boolean;
  verification: Profile['verification'];
  storefrontUrl: string;
  memberSince: string;
  rating: number;
  responseTime: string;
} {
  const handle = profile.storefrontHandle ?? profile.username;
  return {
    id: profile.id,
    name: profile.businessName ?? profile.fullName,
    handle,
    bio: profile.bio ?? 'EXY member storefront.',
    avatarColor: profile.avatarColor,
    location: profile.location,
    phone: profile.phone ?? '+91 00000 00000',
    hidePhone: profile.hidePhone,
    verification: profile.verification,
    storefrontUrl: profile.storefrontUrl ?? `${handle}.exy.in`,
    memberSince: profile.createdAt.slice(0, 10),
    rating: profile.rating,
    responseTime: profile.responseTime,
  };
}
