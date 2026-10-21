'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { accountRequest } from '@/lib/api';
import { demoExplanation, readVideoHelp, type VideoHelp } from '@/lib/video-help';
import type { ConceptVideo } from '@/lib/videos';

export default function TranscriptHelp({ video, cueIndex, demo, onClose }: {
  video: ConceptVideo; cueIndex: number; demo: boolean; onClose: () => void;
}) {
  const cue = video.transcript[cueIndex];
  const [question, setQuestion] = useState('Bisa jelaskan bagian ini dengan lebih sederhana?');
  const [answer, setAnswer] = useState<VideoHelp | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    heading.current?.focus();
    return () => pending.current?.abort();
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current || !question.trim()) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true); setError(''); setAnswer(null);
    try {
      const response = await accountRequest('/api/video-help', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ videoId: video.id, videoVersion: video.version, cueIndex, question: question.trim() }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        if (response.status === 409) throw Error('Video diperbarui. Muat ulang halaman sebelum bertanya.');
        if (response.status === 401) throw Error('Silakan masuk kembali untuk bertanya kepada AI.');
        throw Error('Pertanyaan belum dapat dijawab. Coba lagi.');
      }
      const result = readVideoHelp(data, video.id, video.version, cueIndex);
      if (!result) throw Error('Penjelasan belum dapat dimuat. Coba lagi.');
      if (!controller.signal.aborted) setAnswer(result);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Pertanyaan belum dapat dijawab. Coba lagi.');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      pending.current = null;
    }
  }
  function showExample() {
    const explanation = demoExplanation(video.id, cueIndex);
    if (explanation) setAnswer({ videoId: video.id, videoVersion: video.version, cueIndex, explanation, source: 'curated', reason: 'demo' });
    else setError('Contoh penjelasan untuk bagian ini belum tersedia.');
  }
  return <section className="transcript-help" aria-labelledby={`${video.id}-help-heading`}>
    <div className="transcript-help-heading"><h3 id={`${video.id}-help-heading`} ref={heading} tabIndex={-1}><MessageCircle size={18} />Pahami bagian ini</h3><button type="button" className="icon-button" aria-label="Tutup pertanyaan transkrip" onClick={onClose}><X size={18} /></button></div>
    <p className="video-note">Bagian {Math.floor(cue.startSeconds / 60)}:{String(cue.startSeconds % 60).padStart(2, '0')} · {video.title}</p>
    <blockquote>{cue.text}</blockquote>
    {demo ? <><p className="video-note">Mode demo menampilkan contoh penjelasan terkurasi. Masuk ke akunmu untuk mengirim pertanyaan khusus kepada AI.</p><button type="button" className="secondary" onClick={showExample}>Lihat penjelasan contoh</button></> : <form onSubmit={submit}>
      <label className="field-label" htmlFor={`${video.id}-help-question`}>Apa yang belum kamu pahami?</label>
      <textarea id={`${video.id}-help-question`} maxLength={800} rows={3} required value={question} disabled={busy} onChange={e => setQuestion(e.target.value)} aria-describedby={`${video.id}-help-disclosure`} />
      <p className="video-note" id={`${video.id}-help-disclosure`}>Pertanyaanmu dan konteks transkrip dikirim melalui Vercel AI Gateway ke layanan AI untuk menyusun penjelasan.</p>
      <button type="submit" className="primary" disabled={busy || !question.trim()}><MessageCircle size={16} />{busy ? 'Menyusun penjelasan…' : 'Tanyakan ke AI'}</button>
    </form>}
    {busy && <p role="status" className="video-note">Sedang menjelaskan bagian yang kamu pilih…</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {answer && <div className="transcript-help-answer" role="status"><strong>{demo ? 'Penjelasan contoh' : answer.source === 'gateway' ? 'Penjelasan AI · DeepSeek' : 'Penjelasan terkurasi'}</strong>{!demo && answer.source === 'curated' && <p className="video-note">Jawaban AI belum tersedia. Berikut penjelasan terkurasi untuk bagian ini.</p>}<p>{answer.explanation}</p></div>}
  </section>;
}
