'use client';

import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { GitBranch, LoaderCircle } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { authRedirectUrl } from '@/lib/auth-redirect';
import VerificationNotice from '@/components/verification-notice';
import { signupErrorMessage } from '@/lib/auth-errors';

type Auth = { session: Session | null; demo: boolean; signOut: () => Promise<void> };
const AuthContext = createContext<Auth | null>(null);
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw Error('Account context missing');
  return context;
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'signin' | 'signup' | 'verify' | 'reset' | 'recovery'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!resendAt) return;
    const tick = () => setCooldown(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(() => { tick(); if (Date.now() >= resendAt) clearInterval(timer); }, 1000);
    return () => clearInterval(timer);
  }, [resendAt]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) { setLoading(false); return; }
    setConfigured(true);
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next);
      setLoading(false);
      if (event === 'PASSWORD_RECOVERY') setMode('recovery');
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setError('Sesi belum dapat dimuat. Silakan masuk kembali.');
      setSession(data.session);
      setLoading(false);
    }).catch(() => { if (active) { setError('Sesi belum dapat dimuat. Coba lagi.'); setLoading(false); } });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  async function signOut() {
    if (demo) { setDemo(false); setMode('signin'); setPassword(''); setMessage(''); return; }
    const supabase = getSupabase();
    if (!supabase) return;
    // Sign out this device without ending sessions on the user's other devices.
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw Error('Belum dapat keluar. Coba lagi.');
    setSession(null);
    setMode('signin');
    setPassword('');
    setMessage('');
  }
  function changeMode(next: typeof mode) { setMode(next); setPassword(''); setMessage(''); setError(''); }
  function startCooldown() { setCooldown(60); setResendAt(Date.now() + 60000); }
  async function resendVerification() {
    const supabase = getSupabase();
    if (!supabase || busy || Date.now() < resendAt) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: authRedirectUrl() } });
      if (error) {
        if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
          startCooldown();
          throw Error('Tunggu sebentar sebelum meminta email baru. Cek juga folder Spam.');
        }
        throw Error('Email belum dapat dikirim ulang. Coba lagi sebentar.');
      }
      startCooldown(); setMessage('Permintaan terkirim. Jika akunmu belum dikonfirmasi, periksa email terbaru.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Email belum dapat dikirim. Coba lagi.'); }
    finally { setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error?.code === 'email_not_confirmed') { changeMode('verify'); return; }
        if (error) throw Error('Belum berhasil masuk. Periksa email dan kata sandi.');
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim() }, emailRedirectTo: authRedirectUrl() } });
        if (error) throw Error(signupErrorMessage(error));
        if (!data.session) { setEmail(email.trim()); changeMode('verify'); startCooldown(); }
        setPassword('');
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: authRedirectUrl(true) });
        if (error) throw Error('Tautan belum dapat dikirim. Coba lagi nanti.');
        setMessage('Jika email terdaftar, tautan pengaturan ulang akan dikirim.');
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw Error('Kata sandi belum dapat diperbarui. Minta tautan baru atau coba lagi.');
        setPassword(''); setMode('signin'); setMessage('Kata sandi berhasil diperbarui.');
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Layanan belum dapat dihubungi. Coba lagi.'); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="auth-shell"><p className="loading"><LoaderCircle className="spin" />Memeriksa sesi…</p></div>;
  if (demo) return <AuthContext.Provider value={{ session: null, demo: true, signOut }}><div key="demo">{children}</div></AuthContext.Provider>;
  if (session && mode !== 'recovery') return <AuthContext.Provider value={{ session, demo: false, signOut }}><div key={session.user.id}>{children}</div></AuthContext.Provider>;

  const title = mode === 'signup' ? 'Mulai perjalanan belajarmu.' : mode === 'reset' ? 'Atur ulang kata sandi.' : mode === 'recovery' ? 'Buat kata sandi baru.' : 'Selamat datang kembali.';
  return <div className="auth-shell"><section className="auth-card" aria-labelledby="auth-title">
    <div className="brand"><span className="brand-icon"><GitBranch size={24} /></span>ReThink<span className="brand-dot">.</span></div>
    {mode === 'verify' ? <VerificationNotice email={email} busy={busy} cooldown={cooldown} error={error} message={message} onResend={() => { void resendVerification(); }} onSignIn={() => changeMode('signin')} onChangeEmail={() => changeMode('signup')} /> : <>
    <h1 id="auth-title">{title}</h1><p>Masuk untuk menyimpan perjalanan belajar dan melanjutkannya di perangkat lain.</p>
    {!configured && <p className="notice" role="status">Layanan masuk belum tersedia. Silakan coba lagi nanti.</p>}
    <form onSubmit={submit}>
      {mode === 'signup' && <><label className="field-label" htmlFor="auth-name">Nama</label><input id="auth-name" autoComplete="name" maxLength={80} required value={name} onChange={e => setName(e.target.value)} disabled={busy || !configured} /></>}
      {mode !== 'recovery' && <><label className="field-label" htmlFor="auth-email">Email</label><input id="auth-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={e => setEmail(e.target.value)} disabled={busy || !configured} /></>}
      {mode !== 'reset' && <><label className="field-label" htmlFor="auth-password">Kata sandi</label><input id="auth-password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={mode === 'signin' ? 1 : 8} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} disabled={busy || !configured} />{mode !== 'signin' && <small className="field-help">Gunakan minimal 8 karakter.</small>}</>}
      {error && <p className="error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}
      <button className="primary auth-submit" type="submit" disabled={busy || !configured}>{busy ? <LoaderCircle className="spin" size={17} /> : mode === 'signin' ? 'Masuk' : mode === 'signup' ? 'Buat akun' : mode === 'reset' ? 'Kirim tautan' : 'Simpan kata sandi'}</button>
    </form>
    <div className="auth-actions">{mode === 'signin' ? <><button type="button" className="text-button" disabled={busy} onClick={() => changeMode('signup')}>Belum punya akun? Daftar</button><button type="button" className="text-button" disabled={busy} onClick={() => changeMode('reset')}>Lupa kata sandi?</button><button type="button" className="text-button" disabled={busy} onClick={() => setDemo(true)}>Coba tanpa akun (demo)</button><small className="field-help">Progres demo hanya tersimpan selama halaman terbuka.</small></> : mode === 'recovery' ? <button type="button" className="text-button" disabled={busy} onClick={() => { void signOut().catch(cause => setError(cause.message)); }}>Keluar</button> : <button type="button" className="text-button" disabled={busy} onClick={() => changeMode('signin')}>Kembali ke masuk</button>}</div>
    </>}
  </section></div>;
}
