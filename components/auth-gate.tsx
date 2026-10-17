'use client';

import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { GitBranch, LoaderCircle } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

type Auth = { session: Session; signOut: () => Promise<void> };
const AuthContext = createContext<Auth | null>(null);
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw Error('Account context missing');
  return context;
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset' | 'recovery'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState(false);

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
  async function submit(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw Error(error.code === 'email_not_confirmed' ? 'Konfirmasi emailmu sebelum masuk.' : 'Belum berhasil masuk. Periksa email dan kata sandi.');
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim() }, emailRedirectTo: `${window.location.origin}/` } });
        if (error) throw Error('Akun belum dapat dibuat. Periksa isian atau coba lagi nanti.');
        if (!data.session) setMessage('Periksa email untuk konfirmasi akun, lalu masuk.');
        setPassword('');
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/?auth=recovery` });
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
  if (session && mode !== 'recovery') return <AuthContext.Provider value={{ session, signOut }}><div key={session.user.id}>{children}</div></AuthContext.Provider>;

  const title = mode === 'signup' ? 'Mulai perjalanan belajarmu.' : mode === 'reset' ? 'Atur ulang kata sandi.' : mode === 'recovery' ? 'Buat kata sandi baru.' : 'Selamat datang kembali.';
  return <div className="auth-shell"><section className="auth-card" aria-labelledby="auth-title">
    <div className="brand"><span className="brand-icon"><GitBranch size={24} /></span>ReThink<span className="brand-dot">.</span></div>
    <h1 id="auth-title">{title}</h1><p>Masuk untuk menyimpan perjalanan belajar dan melanjutkannya di perangkat lain.</p>
    {!configured && <p className="notice" role="status">Layanan masuk belum tersedia. Silakan coba lagi nanti.</p>}
    <form onSubmit={submit}>
      {mode === 'signup' && <><label className="field-label" htmlFor="auth-name">Nama</label><input id="auth-name" autoComplete="name" maxLength={80} required value={name} onChange={e => setName(e.target.value)} disabled={busy || !configured} /></>}
      {mode !== 'recovery' && <><label className="field-label" htmlFor="auth-email">Email</label><input id="auth-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={e => setEmail(e.target.value)} disabled={busy || !configured} /></>}
      {mode !== 'reset' && <><label className="field-label" htmlFor="auth-password">Kata sandi</label><input id="auth-password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={mode === 'signin' ? 1 : 8} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} disabled={busy || !configured} />{mode !== 'signin' && <small className="field-help">Gunakan minimal 8 karakter.</small>}</>}
      {error && <p className="error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}
      <button className="primary auth-submit" type="submit" disabled={busy || !configured}>{busy ? <LoaderCircle className="spin" size={17} /> : mode === 'signin' ? 'Masuk' : mode === 'signup' ? 'Buat akun' : mode === 'reset' ? 'Kirim tautan' : 'Simpan kata sandi'}</button>
    </form>
    <div className="auth-actions">{mode === 'signin' ? <><button type="button" className="text-button" disabled={busy} onClick={() => changeMode('signup')}>Belum punya akun? Daftar</button><button type="button" className="text-button" disabled={busy} onClick={() => changeMode('reset')}>Lupa kata sandi?</button></> : mode === 'recovery' ? <button type="button" className="text-button" disabled={busy} onClick={() => { void signOut().catch(cause => setError(cause.message)); }}>Keluar</button> : <button type="button" className="text-button" disabled={busy} onClick={() => changeMode('signin')}>Kembali ke masuk</button>}</div>
  </section></div>;
}
