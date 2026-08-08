import { useState } from 'react';
import type { Profile, Session } from '../types';
import { confirmEmail, signIn, signUp, USERNAME_RE } from '../lib/auth';
import { isSupabaseLive } from '../lib/supabase';
import { Modal } from './Ui';
import { IconCheck, IconLock, IconShield, IconUser } from './Icons';

type Mode = 'signin' | 'signup' | 'verify';

interface Props {
  open: boolean;
  onClose: () => void;
  onAuth: (profile: Profile, session: Session) => void;
  onPendingProfile: (profile: Profile) => void;
  reason?: string;
}

export function AuthModal({ open, onClose, onAuth, onPendingProfile, reason }: Props) {
  const [mode, setMode] = useState<Mode>('signin');
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const set = <K extends keyof typeof form>(key: K, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const usernameOk = !form.username || USERNAME_RE.test(form.username.toLowerCase());

  async function submit() {
    setError('');
    setBusy(true);

    if (mode === 'signup') {
      const result = await signUp({
        fullName: form.fullName,
        username: form.username.toLowerCase(),
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      setBusy(false);
      if (!result.ok) return setError(result.error ?? 'Sign-up failed.');
      if (result.profile) onPendingProfile(result.profile);
      setPendingEmail(form.email.trim().toLowerCase());
      setMode('verify');
      return;
    }

    const result = await signIn(form.email, form.password);
    setBusy(false);
    if (!result.ok) {
      if (result.needsEmailVerification) {
        setPendingEmail(form.email.trim().toLowerCase());
        setMode('verify');
      }
      return setError(result.error ?? 'Sign-in failed.');
    }
    if (result.profile && result.session) {
      onAuth(result.profile, result.session);
      setForm({ ...form, password: '' });
      onClose();
    }
  }

  /** Demo-mode one-click entry: signs up, confirms and logs in immediately. */
  async function demoLogin(kind: 'admin' | 'user') {
    setError('');
    setBusy(true);
    const email = kind === 'admin' ? 'admin@exy.in' : 'buyer@exy.in';
    const password = 'exydemo123';

    let result = await signIn(email, password);
    if (!result.ok) {
      await signUp({
        fullName: kind === 'admin' ? 'EXY Admin' : 'Demo Buyer',
        username: kind === 'admin' ? 'exyadmin' : 'demobuyer',
        email,
        password,
      });
      await confirmEmail(email);
      result = await signIn(email, password);
    }

    setBusy(false);
    if (!result.ok || !result.profile || !result.session) {
      return setError(result.error ?? 'Demo sign-in failed.');
    }
    onAuth(result.profile, result.session);
    onClose();
  }

  async function activate() {
    setBusy(true);
    const result = await confirmEmail(pendingEmail);
    setBusy(false);
    if (!result.ok) return setError(result.error ?? 'Activation failed.');
    if (result.profile && result.session) {
      onAuth(result.profile, result.session);
      setForm({ fullName: '', username: '', email: '', password: '', phone: '' });
      setMode('signin');
      onClose();
    }
  }

  /* ------------------------------ verify screen ----------------------------- */
  if (mode === 'verify') {
    return (
      <Modal open={open} onClose={onClose} size="slim" title="Confirm your email" subtitle={pendingEmail}>
        <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
          <div className="pay-success__tick" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <IconLock size={32} />
          </div>
          <p className="prose" style={{ fontSize: 14 }}>
            {isSupabaseLive
              ? 'We sent an activation link to your inbox. Click it to activate your EXY account, then sign in.'
              : 'Demo mode — Supabase would email an activation link here. Use the button below to simulate clicking it.'}
          </p>
        </div>

        {error && <div className="field__error" style={{ marginBottom: 12 }}>{error}</div>}

        {!isSupabaseLive && (
          <button className="btn btn--primary btn--block btn--lg" onClick={activate} disabled={busy}>
            {busy ? <span className="spinner" /> : <IconCheck size={16} />} Simulate email confirmation
          </button>
        )}

        <button
          className="btn btn--ghost btn--block"
          style={{ marginTop: 10 }}
          onClick={() => {
            setMode('signin');
            setError('');
          }}
        >
          Back to sign in
        </button>
      </Modal>
    );
  }

  /* --------------------------- sign in / sign up ---------------------------- */
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="slim"
      title={mode === 'signin' ? 'Sign in to EXY' : 'Create your EXY account'}
      subtitle={reason ?? 'Your listings, saved ads, messages and analytics stay synced.'}
    >
      <div className="auth-switch">
        <button
          className={mode === 'signin' ? 'is-on' : ''}
          onClick={() => {
            setMode('signin');
            setError('');
          }}
        >
          Sign in
        </button>
        <button
          className={mode === 'signup' ? 'is-on' : ''}
          onClick={() => {
            setMode('signup');
            setError('');
          }}
        >
          Create account
        </button>
      </div>

      {mode === 'signup' && (
        <>
          <div className="field">
            <label className="field__label" htmlFor="au-name">
              Full name
            </label>
            <input
              id="au-name"
              className="input"
              value={form.fullName}
              onChange={(event) => set('fullName', event.target.value)}
              placeholder="Ravi Kumar"
              autoComplete="name"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="au-username">
              Username
            </label>
            <input
              id="au-username"
              className="input"
              value={form.username}
              onChange={(event) => set('username', event.target.value.toLowerCase())}
              placeholder="ravikumar"
              autoComplete="username"
              style={!usernameOk ? { borderColor: 'var(--danger)' } : undefined}
            />
            <span className="field__hint">
              3–20 characters · lowercase letters, numbers and underscore · must be unique.
            </span>
          </div>
        </>
      )}

      <div className="field">
        <label className="field__label" htmlFor="au-email">
          Email address
        </label>
        <input
          id="au-email"
          className="input"
          type="email"
          value={form.email}
          onChange={(event) => set('email', event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        {mode === 'signup' && (
          <span className="field__hint">Primary login. We send an activation link before the account goes live.</span>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="au-pass">
          Password
        </label>
        <input
          id="au-pass"
          className="input"
          type="password"
          value={form.password}
          onChange={(event) => set('password', event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && void submit()}
          placeholder="••••••••"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />
        {mode === 'signup' && <span className="field__hint">Minimum 8 characters. Stored by Supabase Auth.</span>}
      </div>

      {mode === 'signup' && (
        <div className="field">
          <label className="field__label" htmlFor="au-phone">
            Phone number <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>— optional</span>
          </label>
          <input
            id="au-phone"
            className="input"
            value={form.phone}
            onChange={(event) => set('phone', event.target.value)}
            placeholder="+91 98765 43210"
            autoComplete="tel"
          />
          <span className="field__hint">No OTP required at this stage. Phone-based OTP login arrives in a later release.</span>
        </div>
      )}

      {error && <div className="field__error" style={{ marginBottom: 12 }}>{error}</div>}

      <button className="btn btn--primary btn--block btn--lg" onClick={() => void submit()} disabled={busy}>
        {busy ? <span className="spinner" /> : mode === 'signin' ? <IconLock size={16} /> : <IconUser size={16} />}
        {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in securely' : 'Create account'}
      </button>

      <div className="divider" />

      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-3)' }}>
        {mode === 'signin' ? "Don't have an account?" : 'Already registered?'}{' '}
        <button
          style={{ color: 'var(--accent)', fontWeight: 700 }}
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError('');
          }}
        >
          {mode === 'signin' ? 'Create one free' : 'Sign in instead'}
        </button>
      </div>

      {!isSupabaseLive && (
        <div className="auth-demo">
          <b>Demo shortcuts</b>
          <span>No email needed — these create and activate an account instantly.</span>
          <div className="pill-row" style={{ marginTop: 10 }}>
            <button className="btn btn--soft btn--sm" onClick={() => void demoLogin('admin')} disabled={busy}>
              <IconShield size={14} /> Enter as Admin
            </button>
            <button className="btn btn--soft btn--sm" onClick={() => void demoLogin('user')} disabled={busy}>
              <IconUser size={14} /> Enter as Buyer
            </button>
          </div>
        </div>
      )}

      <p className="field__hint" style={{ textAlign: 'center', marginTop: 14 }}>
        {isSupabaseLive
          ? 'Secured by Supabase Auth.'
          : 'Demo mode · any email starting with admin@ gets the Super-Admin role.'}
      </p>
    </Modal>
  );
}
