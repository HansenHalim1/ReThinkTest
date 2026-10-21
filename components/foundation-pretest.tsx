'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react';
import { accountRequest, apiUrl } from '@/lib/api';
import { readAssessmentView, type AssessmentView } from '@/lib/assessment';

export default function FoundationPretest({ demo, value, onChange, onContinue }: {
  demo: boolean; value: AssessmentView | null; onChange: (value: AssessmentView) => void; onContinue: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [option, setOption] = useState('');
  const [checked, setChecked] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [reload, setReload] = useState(0);
  const live = useRef<AbortController | null>(null);
  const writing = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const change = useRef(onChange); change.current = onChange;
  useEffect(() => {
    const controller = new AbortController(); live.current = controller;
    if (demo && value) { setLoading(false); return () => controller.abort(); }
    setLoading(true); setError(''); setLoadFailed(false); setBusy(false); writing.current = false;
    const path = demo ? '/api/assessment-demo' : '/api/assessment';
    const request = demo ? fetch(apiUrl(path), { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]), cache: 'no-store' }) : accountRequest(path, { signal: controller.signal });
    request.then(async r => {
      const data = await r.json();
      if (!r.ok) throw Error(data.error || 'Pretest belum dapat dimuat.');
      const parsed = readAssessmentView(data);
      if (!parsed) throw Error('Balasan pretest tidak valid.');
      if (!controller.signal.aborted) change.current(parsed);
    }).catch(e => { if (!controller.signal.aborted) { setLoadFailed(true); setError(e instanceof Error ? e.message : 'Pretest belum dapat dimuat.'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
    // Always refresh signed-in progress when this screen is reopened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, reload]);
  useEffect(() => { setOption(''); if (value?.answered) heading.current?.focus(); }, [value?.question?.id, value?.status]);
  useEffect(() => {
    if (value?.status === 'complete') { setChecked(value.topics.filter(t => t.checked).map(t => t.id)); setDirty(false); }
  }, [value]);
  async function send(command: Record<string, unknown>) {
    if (!value || writing.current) return;
    const controller = live.current;
    writing.current = true; setBusy(true); setError('');
    try {
      const path = demo ? '/api/assessment-demo' : '/api/assessment';
      const init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller?.signal, body: JSON.stringify({ ...command, expectedRevision: value.revision, ...(demo ? { demoSession: value.demoSession } : {}) }) };
      const response = demo ? await fetch(apiUrl(path), { ...init, signal: AbortSignal.any([controller!.signal, AbortSignal.timeout(15000)]), cache: 'no-store' }) : await accountRequest(path, init);
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) { setReload(n => n + 1); throw Error('Kemajuan berubah. Pretest dimuat ulang; periksa soal sebelum menjawab lagi.'); }
        throw Error(data.error || 'Jawaban belum tersimpan. Coba lagi.');
      }
      const parsed = readAssessmentView(data);
      if (!parsed) throw Error('Balasan pretest tidak valid. Muat ulang sebelum melanjutkan.');
      if (!controller?.signal.aborted) onChange(parsed);
    } catch (e) { if (!controller?.signal.aborted) setError(e instanceof Error ? e.message : 'Jawaban belum tersimpan.'); }
    finally { writing.current = false; if (!controller?.signal.aborted) setBusy(false); }
  }
  if (loading) return <div className="loading" role="status"><LoaderCircle className="spin" />Memuat pretest dasar…</div>;
  if (!value || loadFailed) return <section className="lesson-card"><h1>Pretest dasar</h1><p role="alert" className="error">{error || 'Pretest belum tersedia.'}</p><button className="secondary" onClick={() => setReload(n => n + 1)}>Coba lagi</button></section>;
  const q = value.question;
  const levels = ['Mulai dari dasar', 'Hubungkan langkahnya', 'Terapkan dalam situasi baru'];
  return <div className="foundation-pretest">
    <div className="page-heading"><div><span className="eyebrow">SATU TES · BERAGAM TOPIK</span><h1 ref={heading} tabIndex={-1}>{value.status === 'complete' ? 'Kenali titik awalmu.' : 'Pretest dasar'}</h1><p>{value.status === 'complete' ? 'Hasil ini adalah perkiraan awal dari jawabanmu, bukan penetapan penguasaan.' : 'Tidak perlu memilih topik. Kerjakan satu per satu dengan caramu sendiri.'}</p></div></div>
    {error && <p className="error" role="alert">{error}</p>}
    {value.status === 'complete' ? <section className="lesson-card assessment-results">
      <div className="lesson-top"><span className="eyebrow">PRETEST SELESAI</span><span className="tag green"><CheckCircle2 size={15} /> {value.answered} soal</span></div>
      <h2>Topik yang kamu rasa sudah dipahami</h2><p>Centang awal berasal dari hasil tes: setidaknya dua dari tiga jawaban benar. Kamu bisa mencentang atau menghapusnya sesuai pemahamanmu. Perubahan ini adalah penilaian dirimu dan tidak mengubah hasil jawaban.</p>
      <div className="assessment-checklist">{value.topics.map(t => <label key={t.id}><input type="checkbox" disabled={busy} checked={checked.includes(t.id)} onChange={e => { setChecked(ids => e.target.checked ? [...ids, t.id] : ids.filter(id => id !== t.id)); setDirty(true); }} /><span><strong>{t.title}</strong><small>{t.correct}/{t.total} jawaban benar · {t.suggestedKnown ? 'Terindikasi sudah dipahami' : 'Layak ditinjau kembali'}</small></span></label>)}</div>
      <div className="result-actions"><button className="secondary" disabled={busy || (!dirty && value.checklistSaved)} onClick={() => { void send({ action: 'review', knownTopicIds: checked }); }}>{busy ? 'Menyimpan…' : dirty || !value.checklistSaved ? 'Simpan checklist' : 'Checklist tersimpan'}</button><button className="primary" disabled={busy || dirty} onClick={onContinue}>Buka Matematika SMA <ArrowRight size={17} /></button></div>
      <p className="field-help" role="status">{dirty ? 'Ada perubahan checklist yang belum disimpan.' : value.checklistSaved ? demo ? 'Checklist disimpan sementara selama demo.' : 'Checklist tersimpan di akunmu.' : 'Kamu boleh menyimpan atau melanjutkan dengan perkiraan awal.'}</p>
    </section> : value.answered === 0 && !started ? <section className="lesson-card assessment-intro">
      <h2>Satu perjalanan untuk mengenali fondasimu.</h2><p>{value.total} pertanyaan pilihan ganda dari {value.topicCount} topik. Mulai dari konsep sederhana, lalu langkah rutin, dan penerapan. Tidak ada batas waktu.</p>
      <div className="assessment-stages">{levels.map((label, i) => <div key={label}><span>0{i + 1}</span><strong>{label}</strong></div>)}</div>
      <p>Bilangan · pecahan · rasio · persentase · aljabar · persamaan · koordinat · segitiga siku-siku.</p><p>Jika belum tahu, pilih “Belum tahu”. Di akhir tes kamu bisa meninjau checklist topik. {demo ? 'Progres demo hilang saat halaman dimuat ulang.' : 'Jawaban tersimpan di akunmu setelah setiap soal.'}</p><button className="primary" onClick={() => setStarted(true)}>Mulai pretest dasar <ArrowRight size={17} /></button>
    </section> : q && <section className="lesson-card assessment-question">
      <div className="lesson-top"><span className="eyebrow">SOAL {value.answered + 1} DARI {value.total}</span><span className="tag neutral">Tahap {q.difficulty}/3</span></div>
      <progress aria-label="Kemajuan pretest dasar" max={value.total} value={value.answered} />
      <p className="assessment-topic">{q.topicTitle}</p><h2>{levels[q.difficulty - 1]}</h2>
      <form onSubmit={e => { e.preventDefault(); if (option) void send({ action: 'answer', questionId: q.id, optionId: option }); }}>
        <fieldset disabled={busy}><legend>{q.prompt}</legend><div className="assessment-options">{q.options.map((o, i) => <label key={`${q.id}-${o.id}`} className={option === o.id ? 'selected' : ''}><input type="radio" name="assessment-answer" value={o.id} checked={option === o.id} onChange={() => setOption(o.id)} /><span className="option-letter">{String.fromCharCode(65 + i)}</span><span>{o.text}</span></label>)}</div></fieldset>
        <div className="form-footer"><button type="button" className="text-button" disabled={busy} onClick={() => { void send({ action: 'answer', questionId: q.id, optionId: '__unsure' }); }}>Belum tahu</button><button type="submit" className="primary" disabled={busy || !option}>{busy ? 'Menyimpan…' : value.answered + 1 === value.total ? 'Lihat hasil pretest' : 'Simpan & lanjut'}<ArrowRight size={17} /></button></div>
      </form><p className="field-help">Jawaban benar dan salah dirangkum setelah tes selesai.</p>
    </section>}
  </div>;
}
