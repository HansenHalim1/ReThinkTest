'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, ArrowLeft, BookOpen, Check, CheckCircle2, ChevronRight, CircleHelp, Download, GitBranch, GraduationCap, LayoutDashboard, Lightbulb, LoaderCircle, RotateCcw, Sparkles, Target, TrendingUp, X, Menu, History } from 'lucide-react';
import { concepts, getConcept, type ConceptId, type QuestionRole } from '@/lib/content';
import { diagnosisLabels, masteryLabels, newSession, submit, type Session, type Stage } from '@/lib/engine';
import { curatedFeedback } from '@/lib/feedback';
import { accountRequest, apiUrl } from '@/lib/api';
import { useAuth } from '@/components/auth-gate';
import { readSaved, type Saved } from '@/lib/storage';
import { ConceptVisual, WorkedVisual, PracticeVisual } from '@/components/lesson-visuals';
import ConceptExplorer from '@/components/concept-explorer';

type View = 'dashboard' | 'learn' | 'explore' | 'map' | 'history';
const stageOrder: Stage[] = ['diagnosis', 'probe', 'visual', 'worked', 'practice', 'retry', 'transfer', 'complete'];
const stageLabels: Record<Stage, string> = { diagnosis: 'Mulai dari pemikiranmu', probe: 'Kenali pola berpikir', visual: 'Lihat konsepnya', worked: 'Ikuti satu contoh', practice: 'Coba dengan bimbingan', retry: 'Sekarang, mandiri', transfer: 'Gunakan di situasi baru', complete: 'Refleksi belajar' };
const masteryClass = (s?: Session) => s?.mastery === 'understood' ? 'green' : s?.mastery === 'procedural-only' ? 'blue' : s?.mastery === 'needs-reinforcement' ? 'amber' : 'neutral';

export default function Workspace() {
  const { session: account, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('Siswa ReThink');
  const revisions = useRef<Partial<Record<ConceptId, number>>>({});
  const mutation = useRef(false);
  const lifetime = useRef<AbortController | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [selected, setSelected] = useState<ConceptId>('distribution');
  const [saved, setSaved] = useState<Saved>({ version: 1, sessions: {} });
  const [ready, setReady] = useState(false);
  const [storageMessage, setStorageMessage] = useState('');
  const [ai, setAi] = useState<boolean | null>(null);
  const [answer, setAnswer] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; source: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [lastSaved, setLastSaved] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const c = getConcept(selected);
  const session = saved.sessions[selected] ?? newSession(selected);
  const stage = session.stage;
  const question = ['diagnosis', 'probe', 'practice', 'retry', 'transfer'].includes(stage) ? c.questions[stage as QuestionRole] : null;
  const totalAttempts = Object.values(saved.sessions).reduce((n, s) => n + (s?.attempts.length ?? 0), 0);
  const understood = Object.values(saved.sessions).filter(s => s?.mastery === 'understood').length;
  const validation = stage === 'retry' || stage === 'transfer';

  async function loadProgress(signal?: AbortSignal) {
    const response = await accountRequest('/api/progress', { signal });
    if (!response.ok) throw Error('Kemajuan belum dapat dimuat. Coba lagi.');
    const data = await response.json();
    const parsed = readSaved(JSON.stringify(data));
    if (!parsed || !data.revisions || typeof data.revisions !== 'object' || Object.values(data.revisions).some(value => !Number.isSafeInteger(value) || Number(value) < 1)) throw Error('Data kemajuan tidak dapat dibaca.');
    if (signal?.aborted) return;
    revisions.current = data.revisions;
    setSaved(parsed);
    setReady(true);
    setStorageMessage('');
  }
  useEffect(() => {
    const controller = new AbortController(); lifetime.current = controller;
    loadProgress(controller.signal).catch(() => { if (!controller.signal.aborted) setStorageMessage('Kemajuan belum dapat dimuat. Periksa koneksi lalu coba lagi.'); });
    accountRequest('/api/me', { signal: controller.signal }).then(async response => {
      if (response.ok) { const profile = await response.json(); if (!controller.signal.aborted && typeof profile.displayName === 'string') setDisplayName(profile.displayName); }
    }).catch(() => {});
    fetch(apiUrl('/api/health'), { signal: controller.signal }).then(r => {
      if (!r.ok) throw Error('Health check unavailable');
      return r.json();
    }).then(v => { if (!controller.signal.aborted) setAi(v.aiConfigured === true); }).catch(() => { if (!controller.signal.aborted) setAi(false); });
    return () => { controller.abort(); pending.current?.abort(); };
  }, []);

  async function commitProgress(action: 'submit' | 'advance' | 'reinforce' | 'reset', fields: { answer?: string; reasoning?: string } = {}): Promise<Session | null> {
    if (mutation.current) return null;
    mutation.current = true; setBusy(true); setError(''); setLastSaved(false);
    try {
      const response = await accountRequest('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: lifetime.current?.signal, body: JSON.stringify({ concept: selected, action, expectedRevision: revisions.current[selected] || 0, ...fields }) });
      if (response.status === 409) {
        await loadProgress(lifetime.current?.signal);
        throw Error('Kemajuan diperbarui dari perangkat lain. Periksa tahap terbaru sebelum mencoba lagi.');
      }
      const data = await response.json();
      if (!response.ok) throw Error(typeof data.error === 'string' ? data.error : 'Kemajuan gagal disimpan. Coba lagi.');
      const parsed = readSaved(JSON.stringify({ version: 1, sessions: { [selected]: data.session } }));
      const next = parsed?.sessions[selected];
      if (!next || !Number.isSafeInteger(data.revision) || data.revision < 1) throw Error('Balasan penyimpanan tidak valid.');
      revisions.current[selected] = data.revision;
      setSaved(previous => ({ version: 1, sessions: { ...previous.sessions, [selected]: next } }));
      setLastSaved(true);
      return next;
    } catch (cause) {
      if (!lifetime.current?.signal.aborted) setError(cause instanceof Error ? cause.message : 'Kemajuan gagal disimpan. Coba lagi.');
      return null;
    } finally { mutation.current = false; if (!lifetime.current?.signal.aborted) setBusy(false); }
  }
  async function performAction(action: 'advance' | 'reinforce' | 'reset') {
    if (await commitProgress(action)) { clearInputs(); setConfirmReset(false); }
  }
  function clearInputs() { if (mutation.current) return; pending.current?.abort(); setBusy(false); setAnswer(''); setReasoning(''); setFeedback(null); setError(''); }
  function navigate(next: View) { if (mutation.current) return; clearInputs(); setView(next); setMenu(false); setConfirmReset(false); }
  function start(id: ConceptId) { if (mutation.current) return; clearInputs(); setSelected(id); setView('learn'); setMenu(false); }
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!question || busy) return;
    const next = submit(session, answer, reasoning);
    if (!next) { setError('Gunakan angka, pecahan, atau ekspresi linear dengan x. Contoh format: 2x + 8 atau x = 6.'); return; }
    setError('');
    if (!await commitProgress('submit', { answer, reasoning })) return;
    setAnswer(''); setReasoning('');
    if (validation) { setFeedback(null); return; }
    const baseline = curatedFeedback(question, answer);
    setFeedback({ text: baseline, source: 'Materi terkurasi' });
    setBusy(true);
    const controller = new AbortController(); pending.current = controller;
    try {
      const response = await accountRequest('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: question.id, answer, reasoning }), signal: controller.signal });
      if (!response.ok) throw Error('Feedback unavailable');
      const v = await response.json();
      if (typeof v.feedback === 'string') setFeedback({ text: v.feedback, source: v.source === 'gemini' ? (typeof v.model === 'string' ? v.model : 'Gemini') : v.reason === 'not-configured' ? 'Materi terkurasi · AI belum diaktifkan' : 'Materi terkurasi · AI tidak tersedia' });
    } catch { if (!controller.signal.aborted) setFeedback({ text: baseline, source: 'Materi terkurasi · AI tidak tersedia' }); }
    finally { if (pending.current === controller) { pending.current = null; setBusy(false); } }
  }
  function exportProgress() {
    const blob = new Blob([JSON.stringify({ ...saved, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'rethink-kemajuan.json'; a.click(); URL.revokeObjectURL(url);
  }

  return <div className="app-shell">
    <aside className={`sidebar ${menu ? 'open' : ''}`}>
      <a className="brand" href="#" onClick={e => { e.preventDefault(); navigate('dashboard'); }}><span className="brand-icon"><GitBranch size={23} /></span>ReThink<span className="brand-dot">.</span></a>
      <div className="workspace-label">RUANG BELAJARMU</div>
      <nav aria-label="Navigasi utama">{([
        ['dashboard', LayoutDashboard, 'Beranda'], ['learn', BookOpen, 'Belajar'], ['explore', Lightbulb, 'Jelajahi Konsep'], ['map', GitBranch, 'Peta konsep'], ['history', History, 'Riwayat belajar'],
      ] as const).map(([id, Icon, label]) => <button key={id} className={view === id ? 'nav-item active' : 'nav-item'} onClick={() => navigate(id)}><Icon size={19} />{label}{view === id && <span className="nav-dot" />}</button>)}</nav>
      <div className="sidebar-note"><span className="note-icon"><Lightbulb size={20} /></span><strong>Pelan-pelan, sampai paham.</strong><p>Setiap kesalahan adalah petunjuk untuk langkah berikutnya.</p></div>
      <div className="profile"><div className="avatar">{displayName.charAt(0).toUpperCase()}</div><div><strong>{displayName}</strong><small>{account.user.email}</small></div><GraduationCap size={19} /></div>
    </aside>
    {menu && <button className="menu-backdrop" aria-label="Tutup navigasi" onClick={() => setMenu(false)} />}
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" aria-label="Buka navigasi" onClick={() => setMenu(!menu)}><Menu size={22} /></button><span>Ruang belajar</span><ChevronRight size={14} /><strong>{view === 'dashboard' ? 'Beranda' : view === 'learn' ? 'Belajar' : view === 'explore' ? 'Jelajahi Konsep' : view === 'map' ? 'Peta konsep' : 'Riwayat belajar'}</strong></div><div className="topbar-right"><span className={`status ${ai ? 'connected' : ''}`}><i />{ai === null ? 'Memeriksa AI' : ai ? 'AI dikonfigurasi' : 'Mode terkurasi'}</span><button type="button" className="text-button account-logout" disabled={busy} onClick={() => { void signOut().catch(cause => setStorageMessage(cause.message)); }}>Keluar</button></div></header>
      <main>
        {storageMessage && <div className="notice" role="status">{storageMessage}</div>}{error && !question && <p className="error" role="alert">{error}</p>}
        {!ready ? <div className="loading">{storageMessage ? <button type="button" className="secondary" onClick={() => { setStorageMessage(''); void loadProgress(lifetime.current?.signal).catch(() => setStorageMessage('Kemajuan belum dapat dimuat. Coba lagi.')); }}>Coba lagi</button> : <><LoaderCircle className="spin" />Memuat kemajuan akunmu…</>}</div> : <>
        {view === 'dashboard' && <>
          <div className="page-heading"><div><div className="eyebrow">SELAMAT DATANG DI RETHINK</div><h1>Belajar sampai <em>benar-benar paham.</em></h1><p>Temukan yang menghambatmu. Bangun kembali konsepnya. Coba dengan percaya diri.</p></div><span className="edition">ALJABAR DASAR <span>01</span></span></div>
          <section className="hero-card"><div className="hero-copy"><span className="pill"><Sparkles size={14} /> LANGKAH KECIL, PEMAHAMAN BESAR</span><h2>Jawaban salah?<br />Itu awal yang baik.</h2><p>Kita tidak hanya mengecek jawaban. Kita mencari konsep yang perlu diperkuat, lalu membantumu memahaminya.</p><button className="primary" onClick={() => start('distribution')}>{saved.sessions.distribution && saved.sessions.distribution.stage !== 'complete' ? 'Lanjutkan belajar' : 'Mulai belajar'}<ArrowRight size={18} /></button><span className="hero-caption">Tanpa tekanan. Sesuai langkahmu.</span></div><div className="hero-art" aria-hidden="true"><div className="art-grid" /><div className="formula-card"><span>PAHAMI POLANYA</span><div>a(b + c)</div><div className="formula-arrow">↓</div><div><b>ab</b> + <b>ac</b></div><small>Setiap suku punya bagiannya.</small></div><span className="floating-chip chip-one"><Check size={14} /> Konsep terhubung</span><span className="floating-chip chip-two"><Lightbulb size={17} /> Aha, sekarang paham!</span><span className="art-spark spark-one">✳</span><span className="art-spark spark-two">+</span></div></section>
          <div className="stats-grid"><div className="stat-card"><span className="stat-icon lavender"><BookOpen size={21} /></span><div><strong>{Object.keys(saved.sessions).length}<small> / 2</small></strong><span>Konsep dipelajari</span></div></div><div className="stat-card"><span className="stat-icon mint"><CheckCircle2 size={21} /></span><div><strong>{understood}</strong><span>Pemahaman tervalidasi</span></div></div><div className="stat-card"><span className="stat-icon peach"><TrendingUp size={21} /></span><div><strong>{totalAttempts}</strong><span>Jawaban dicoba</span></div></div></div>
          <div className="section-heading"><div><h2>Pilih titik awalmu</h2><p>Dua konsep dasar, satu perjalanan menuju pemahaman.</p></div><button className="text-button" onClick={() => navigate('map')}>Lihat peta konsep <ArrowRight size={16} /></button></div>
          <div className="concept-grid">{concepts.map((concept, i) => { const s = saved.sessions[concept.id]; return <button className="concept-card" key={concept.id} onClick={() => start(concept.id)}><div className="concept-top"><span className={`concept-symbol ${i ? 'mint' : 'lavender'}`}>{i ? 'x = ?' : '(a+b)'}</span><span className={`tag ${masteryClass(s)}`}>{s?.mastery && s.mastery !== 'unassessed' ? masteryLabels[s.mastery] : s ? 'Sedang dipelajari' : 'Siap dipelajari'}</span></div><h3>{concept.title}</h3><p>{concept.subtitle}</p><div className="concept-prerequisite">Prasyarat: {concept.prerequisite}</div><div className="concept-bottom"><span>{concept.duration} <span>·</span> 3 tahap belajar</span><span className="circle-arrow"><ArrowRight size={18} /></span></div></button>; })}</div>
          <section className="journey"><div><span className="eyebrow">CARA BELAJAR DI RETHINK</span><h3>Satu alur. Pemahaman yang lebih kuat.</h3></div><div className="journey-step"><span>01</span><div><strong>Kenali hambatan</strong><small>Temukan pola dari jawabanmu</small></div></div><ChevronRight size={17} className="journey-chevron" /><div className="journey-step"><span>02</span><div><strong>Bangun konsep</strong><small>Visual, contoh, latihan terbimbing</small></div></div><ChevronRight size={17} className="journey-chevron" /><div className="journey-step"><span>03</span><div><strong>Uji pemahaman</strong><small>Mandiri, lalu situasi baru</small></div></div></section>
        </>}

        {view === 'explore' && <ConceptExplorer />}

        {view === 'learn' && <>
          <div className="section-heading learning-heading"><div><button className="text-button" onClick={() => navigate('dashboard')}><ArrowLeft size={15} /> Kembali ke beranda</button><h1>{c.title}</h1><p>{c.subtitle}</p></div><label className="concept-select">Konsep <select value={selected} disabled={busy} onChange={e => start(e.target.value as ConceptId)}>{concepts.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}</select></label></div>
          <div className="learning-layout"><section className="lesson-card">
            <div className="lesson-top"><span className="eyebrow">{['diagnosis', 'probe'].includes(stage) ? '01 / DIAGNOSIS' : ['visual', 'worked', 'practice'].includes(stage) ? '02 / BANGUN KONSEP' : '03 / VALIDASI PEMAHAMAN'}</span><span className={`tag ${validation ? 'blue' : 'neutral'}`}>{validation ? 'Tanpa bantuan' : stage === 'complete' ? 'Sesi selesai' : 'Langkah demi langkah'}</span></div>
            <h2 tabIndex={-1}>{stageLabels[stage]}</h2>
            {feedback && !validation && <div className="feedback" role="status"><Sparkles size={19} /><div><p>{feedback.text}</p><small>{feedback.source}{busy && ' · Menyiapkan feedback…'}</small></div></div>}
            {question && <form onSubmit={onSubmit} key={question.id}>
              <p className="question-prompt">{question.prompt}</p>{question.math && <div className="math-display">{question.math}</div>}
              {stage === 'practice' && <div className="hint"><Lightbulb size={18} />{question.hint}</div>}
              {stage === 'practice' && <PracticeVisual key={selected} id={selected} />}<label className="field-label" htmlFor="answer">Jawabanmu</label><input id="answer" autoComplete="off" autoFocus maxLength={160} value={answer} onChange={e => setAnswer(e.target.value)} placeholder={question.kind === 'expression' ? 'Tuliskan ekspresi tanpa kurung' : 'Tuliskan nilai bilangan'} required disabled={busy} aria-describedby={error ? 'answer-error' : 'answer-format'} />
              <small id="answer-format" className="field-help">{question.kind === 'expression' ? 'Gunakan x, +, −, *, atau /. Tuliskan bentuk tanpa kurung.' : 'Angka, desimal, pecahan, atau x = angka diterima.'}</small>
              <label className="field-label" htmlFor="reasoning">{validation ? 'Catatan cara berpikir' : 'Bagaimana kamu memikirkannya?'} <span>(opsional)</span></label><textarea id="reasoning" maxLength={1200} value={reasoning} onChange={e => setReasoning(e.target.value)} placeholder="Ceritakan langkah atau alasanmu…" rows={3} disabled={busy} />
              {!validation && <small className="field-help">Jika Gemini aktif, jawaban dan alasan dikirim ke Google untuk feedback.</small>}
              {error && <p className="error" role="alert" id="answer-error">{error}</p>}
              <div className="form-footer"><span><Target size={15} />{validation ? 'Kerjakan dengan pemahamanmu sendiri' : 'Kesalahan adalah bagian dari belajar'}</span><button className="primary" type="submit" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin" /> : <>Periksa jawaban <ArrowRight size={17} /></>}</button></div>
            </form>}
            {stage === 'visual' && <><p className="question-prompt">{c.visual}</p><ConceptVisual id={selected} /><button className="primary lesson-next" disabled={busy} onClick={() => { void performAction('advance'); }}>Lihat contoh berikutnya <ArrowRight size={17} /></button></>}
            {stage === 'worked' && <><p className="question-prompt">Perhatikan bagaimana konsep digunakan di setiap langkah.</p><WorkedVisual key={selected} id={selected} steps={c.worked} /><button className="primary lesson-next" disabled={busy} onClick={() => { void performAction('advance'); }}>Coba latihan terbimbing <ArrowRight size={17} /></button></>}
            {stage === 'complete' && <div className="result-content"><span className={`result-icon ${masteryClass(session)}`}>{session.mastery === 'understood' ? <CheckCircle2 size={36} /> : <BookOpen size={36} />}</span><h3>{masteryLabels[session.mastery]}</h3><p>{session.mastery === 'understood' ? 'Kamu berhasil mengerjakan soal mandiri dan menerapkan konsep pada situasi baru. Ini bukti pemahaman untuk konsep yang diuji hari ini.' : session.mastery === 'procedural-only' ? 'Soal mandiri berhasil, tetapi penerapan pada situasi baru masih perlu latihan. Mari hubungkan kembali konsep dengan konteksnya.' : session.diagnosis === 'uncertain' ? 'Jawaban belum cukup untuk memastikan satu hambatan. Tinjau kembali konsep ini atau diskusikan langkahmu dengan guru; diagnosis tetap belum pasti.' : 'Soal mandiri belum berhasil. Kembali ke penjelasan dan contoh, lalu coba lagi tanpa bantuan.'}</p><div className="result-actions"><button className="primary" onClick={() => navigate('map')}>Lihat peta konsep <GitBranch size={16} /></button>{session.mastery !== 'understood' && <button className="secondary" disabled={busy} onClick={() => { void performAction('reinforce'); }}>Pelajari kembali <RotateCcw size={16} /></button>}</div></div>}
          </section><aside className="lesson-aside"><div className="path-card"><h3>Perjalanan konsep</h3><ol>{stageOrder.filter(s => s !== 'complete').map((s, i) => <li className={s === stage ? 'current' : session.attempts.some(a => a.questionId === selected + "-" + s) ? 'done' : ''} key={s}><span>{session.attempts.some(a => a.questionId === selected + "-" + s) ? <Check size={13} /> : i + 1}</span><div><strong>{stageLabels[s]}</strong>{s === stage && <small>Sedang dikerjakan</small>}</div></li>)}</ol></div><div className="evidence-card"><h3><CircleHelp size={17} /> Apa yang sudah diketahui?</h3><small>DIAGNOSIS KONSEP</small><span className={`tag ${session.diagnosis === 'confirmed' ? 'amber' : 'neutral'}`}>{diagnosisLabels[session.diagnosis]}</span><small>STATUS PEMAHAMAN</small><span className={`tag ${masteryClass(session)}`}>{masteryLabels[session.mastery]}</span><p>Diagnosis dan pemahaman adalah dua hal berbeda. Pemahaman diuji lewat kerja mandiri dan transfer.</p></div><button className="text-button reset-button" onClick={() => setConfirmReset(true)}><RotateCcw size={14} /> Mulai ulang konsep ini</button></aside></div>
        </>}

        {view === 'map' && <><div className="page-heading"><div><div className="eyebrow">HUBUNGKAN PEMAHAMANMU</div><h1>Peta konsep</h1><p>Lihat prasyarat dan hasil belajar untuk konsep yang sudah diuji.</p></div><span className="edition">2 KONSEP MVP</span></div><div className="map-legend"><span><i className="dot green" />Tervalidasi</span><span><i className="dot blue" />Prosedural</span><span><i className="dot amber" />Perlu penguatan</span><span><i className="dot neutral" />Belum diuji</span></div><section className="map-card"><div className="map-foundation"><GraduationCap size={26} /><h3>Fondasi aritmetika</h3><p>Prasyarat · belum dinilai dalam MVP</p></div><div className="map-connector" /><div className="map-nodes">{concepts.map(v => <div className={`map-node ${masteryClass(saved.sessions[v.id])}`} key={v.id}><span className="eyebrow">{v.prerequisite}</span><h3>{v.title}</h3><span className={`tag ${masteryClass(saved.sessions[v.id])}`}>{masteryLabels[saved.sessions[v.id]?.mastery ?? 'unassessed']}</span><p>{diagnosisLabels[saved.sessions[v.id]?.diagnosis ?? 'unassessed']}</p><button className="text-button" onClick={() => start(v.id)}>Buka konsep <ArrowRight size={16} /></button></div>)}</div><div className="map-target"><Target size={20} /><div><strong>Persamaan linear</strong><p>Tujuan lanjutan · belum tersedia di MVP</p></div></div></section><div className="info-strip"><CircleHelp size={18} /><p>Peta ini menunjukkan hasil pada soal yang didukung, bukan nilai kemampuan matematika secara keseluruhan atau penguasaan jangka panjang.</p></div></>}

        {view === 'history' && <><div className="page-heading"><div><div className="eyebrow">SETIAP LANGKAH BERARTI</div><h1>Riwayat belajar</h1><p>Jawaban dan proses berpikirmu, tersimpan di akunmu.</p></div><button className="secondary" onClick={exportProgress}><Download size={16} />Unduh kemajuan</button></div>{totalAttempts === 0 ? <div className="empty-state"><History size={40} /><h2>Perjalananmu mulai di sini.</h2><p>Belum ada jawaban. Pilih konsep dan coba soal pertamamu.</p><button className="primary" onClick={() => start('distribution')}>Mulai belajar <ArrowRight size={16} /></button></div> : <div className="history-list">{Object.values(saved.sessions).flatMap(s => (s?.attempts ?? []).map(a => ({ ...a, concept: s!.concept }))).sort((a, b) => b.at.localeCompare(a.at)).map((a, i) => <article className="history-item" key={`${a.at}-${i}`}><span className={`attempt-icon ${a.correct ? 'green' : 'amber'}`}>{a.correct ? <Check size={19} /> : <RotateCcw size={18} />}</span><div><h3>{getConcept(a.concept).title} <span>{stageLabels[a.questionId.split('-').at(-1) as Stage]}</span></h3><p>Jawaban: <strong>{a.answer}</strong></p>{a.reasoning && <p className="reasoning-note">“{a.reasoning}”</p>}<small>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(a.at))}</small></div><span className={`tag ${a.correct ? 'green' : 'amber'}`}>{a.correct ? 'Setara' : 'Belum setara'}</span></article>)}</div>}</>}
        <footer className="page-footer"><span>ReThink<span className="brand-dot">.</span> <span>Ruang untuk berpikir lagi.</span></span><span>{lastSaved ? 'Tersimpan di akunmu' : 'Kemajuan tersimpan di akunmu'} · Dapat dilanjutkan di perangkat lain</span></footer>
        </>}
      </main>
    </div>
    {confirmReset && <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="reset-title"><button autoFocus className="icon-button modal-close" aria-label="Tutup" onClick={() => setConfirmReset(false)}><X size={20} /></button><h2 id="reset-title">Mulai ulang {c.title.toLowerCase()}?</h2><p>Jawaban dan hasil konsep ini akan direset di akunmu pada semua perangkat. Konsep lain tetap tersimpan.</p><div className="result-actions"><button className="secondary" onClick={() => setConfirmReset(false)}>Batal</button><button className="primary" disabled={busy} onClick={() => { void performAction('reset'); }}>Mulai ulang</button></div></div></div>}
  </div>;
}
