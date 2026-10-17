'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight, Inbox, LoaderCircle, Mail, RefreshCw, ShieldCheck } from 'lucide-react';

type Props = { email: string; busy: boolean; cooldown: number; error: string; message: string; onResend: () => void; onSignIn: () => void; onChangeEmail: () => void };

export default function VerificationNotice({ email, busy, cooldown, error, message, onResend, onSignIn, onChangeEmail }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <div className="verification-notice">
    <div className="verification-art" aria-hidden="true"><span className="verification-orbit" /><Mail size={38} strokeWidth={1.5} /><span className="verification-seal"><ShieldCheck size={18} /></span></div>
    <span className="verification-kicker">SATU LANGKAH LAGI</span>
    <h1 id="auth-title" ref={heading} tabIndex={-1}>Cek kotak masukmu.</h1>
    <p>Buka email konfirmasi ReThink untuk mengaktifkan akunmu dan mulai belajar.</p>
    <div className="verification-address"><Mail size={16} /><strong>{email}</strong><button type="button" className="text-button" onClick={onChangeEmail} disabled={busy}>Ubah</button></div>
    <ol className="verification-steps"><li><span>1</span><div><strong>Buka email konfirmasi akunmu</strong><p>Periksa folder Spam atau Promosi jika belum terlihat.</p></div></li><li><span>2</span><div><strong>Klik tautan konfirmasi</strong><p>Tautan akan membawamu kembali ke ReThink.</p></div></li></ol>
    {error && <p className="error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}
    <button type="button" className="primary auth-submit" disabled={busy} onClick={onSignIn}>Lanjutkan masuk<ArrowRight size={17} /></button>
    <div className="verification-resend"><p><Inbox size={15} />Belum menerima email?</p><button type="button" className="text-button" disabled={busy || cooldown > 0} onClick={onResend}>{busy ? <LoaderCircle size={14} className="spin" /> : <RefreshCw size={14} />}{busy ? 'Mengirim…' : cooldown > 0 ? `Kirim ulang dalam ${cooldown} dtk` : 'Kirim ulang email verifikasi'}</button></div>
    <p className="verification-footnote">Sudah mengklik tautan di perangkat lain? Masuk menggunakan email dan kata sandimu.</p>
  </div>;
}
