'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, ArrowLeft, BookOpen, Check, CheckCircle2, ChevronRight, Download, GitBranch, GraduationCap, LayoutDashboard, Lightbulb, LoaderCircle, RotateCcw, Sparkles, Target, TrendingUp, X, Menu, History } from 'lucide-react';
import { concepts, getConcept, getQuestion, type ConceptId, type QuestionRole } from '@/lib/content';
import { advance, grade, newSession, reinforce, submit, type AdaptiveSelection, type Session, type Stage } from '@/lib/engine';
import { curatedFeedback } from '@/lib/feedback';
import { accountRequest, apiUrl } from '@/lib/api';
import { useAuth } from '@/components/auth-gate';
import { readSaved, type Saved } from '@/lib/storage';
import { ConceptVisual, WorkedVisual, PracticeVisual } from '@/components/lesson-visuals';
import ConceptExplorer from '@/components/concept-explorer';
import SmaRoadmap from '@/components/sma-roadmap';
import ConceptMap from '@/components/concept-map';
import { pretestsComplete, type CurriculumProgress } from '@/lib/curriculum';

type View = 'dashboard' | 'learn' | 'explore' | 'map' | 'history' | 'curriculum';
const stageOrder: Stage[] = ['diagnosis', 'probe', 'visual', 'worked', 'practice', 'retry', 'transfer', 'complete'];
const stageLabels: Record<Stage, string> = { diagnosis: 'Mulai dari pemikiranmu', probe: 'Kenali pola berpikir', visual: 'Lihat konsepnya', worked: 'Ikuti satu contoh', practice: 'Coba dengan bimbingan', retry: 'Sekarang, mandiri', transfer: 'Gunakan di situasi baru', complete: 'Refleksi belajar' };
function aiLabel(value: unknown) {
  const result = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  if (result.source === 'gemini') return `Feedback Gemini · ${typeof result.model === 'string' ? result.model : 'Gemini'}`;
  const reasons: Record<string, string> = {
    'not-configured': 'key Gemini belum tersedia', 'invalid-configuration': 'konfigurasi model tidak valid',
    'invalid-api-key': 'key Gemini ditolak',
    'provider-unavailable': 'Gemini tidak merespons', 'rate-limited': 'permintaan Gemini dibatasi',
    'invalid-response': 'balasan Gemini tidak lolos validasi', 'no-candidates': 'soal probe tidak tersedia',
    'endpoint-unavailable': 'endpoint analisis tidak tersedia',
  };
  const reason = typeof result.reason === 'string' ? reasons[result.reason] || result.reason : 'status pemanggilan tidak diterima';
  const status = typeof result.providerStatus === 'number' && Number.isSafeInteger(result.providerStatus) ? ` · HTTP ${result.providerStatus}` : '';
  return `Fallback kurasi · ${reason}${status}`;
}

export default function Workspace() {
  const { session: account, demo, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('Siswa ReThink');
  const revisions = useRef<Partial<Record<ConceptId, number>>>({});
  const mutation = useRef(false);
  const lifetime = useRef<AbortController | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [selected, setSelected] = useState<ConceptId>('distribution');
  const [saved, setSaved] = useState<Saved>({ version: 1, sessions: {} });
  const [exploreTopic, setExploreTopic] = useState<string | null>(null);
  const [materialToOpen, setMaterialToOpen] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState('');
  const [mapReload, setMapReload] = useState(0);
  const [curriculumProgress, setCurriculumProgress] = useState<CurriculumProgress>({});
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
  const question = ['diagnosis', 'probe', 'practice', 'retry', 'transfer'].includes(stage) ? getQuestion(session.currentQuestionId || c.questions[stage as QuestionRole].id) || null : null;
  const attempted = (role: QuestionRole) => session.attempts.some(a => getQuestion(a.questionId)?.role === role);
  const totalAttempts = Object.values(saved.sessions).reduce((n, s) => n + (s?.attempts.length ?? 0), 0);
  const completedSessions = Object.values(saved.sessions).filter(s => s?.stage === 'complete').length;
  const smaUnlocked = pretestsComplete(saved.sessions);
  const nextPretest = concepts.find(concept => saved.sessions[concept.id]?.stage !== 'complete');
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
    if (pretestsComplete(parsed.sessions)) setView(previous => previous === 'dashboard' ? 'curriculum' : previous);
    setReady(true);
    setStorageMessage('');
  }
  useEffect(() => {
    window.scrollTo(0, 0);
    const controller = new AbortController(); lifetime.current = controller;
    if (demo) {
      setDisplayName('Mode demo');
      setSaved({ version: 1, sessions: {} });
      setReady(true);
      fetch(apiUrl('/api/health'), { signal: controller.signal }).then(r => r.json()).then(v => { if (!controller.signal.aborted) setAi(v.aiConfigured === true); }).catch(() => { if (!controller.signal.aborted) setAi(false); });
      return () => { controller.abort(); pending.current?.abort(); };
    }
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

  useEffect(() => {
    if (!ready || demo || !smaUnlocked || view !== 'map') return;
    const controller = new AbortController();
    setMapLoading(true); setMapError('');
    accountRequest('/api/curriculum', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw Error('Kemajuan materi belum dapat dimuat.');
      const data = await response.json();
      if (!data.unlocked || !Array.isArray(data.progress)) throw Error('Kemajuan materi berubah. Muat ulang halaman untuk memperbaruinya.');
      if (!controller.signal.aborted) setCurriculumProgress(Object.fromEntries(data.progress.map((row: CurriculumProgress[string]) => [row.moduleId, row])));
    }).catch(cause => { if (!controller.signal.aborted) setMapError(cause instanceof Error ? cause.message : 'Kemajuan materi belum dapat dimuat.'); })
      .finally(() => { if (!controller.signal.aborted) setMapLoading(false); });
    return () => controller.abort();
  }, [ready, demo, smaUnlocked, view, mapReload]);

  async function commitProgress(action: 'submit' | 'advance' | 'reinforce' | 'reset', fields: { answer?: string; reasoning?: string } = {}): Promise<Session | null> {
    if (mutation.current) return null;
    mutation.current = true; setBusy(true); setError(''); setLastSaved(false);
    try {
      if (demo) {
        const current = saved.sessions[selected] ?? newSession(selected);
        let next: Session | null = null;
        if (action === 'submit') {
          let selection: AdaptiveSelection | undefined;
          if (current.stage === 'diagnosis' || current.stage === 'probe') {
            try {
              const response = await fetch(apiUrl('/api/diagnostic'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ concept: selected, session: current, answer: fields.answer ?? '', reasoning: fields.reasoning ?? '' }), signal: AbortSignal.any([lifetime.current?.signal || new AbortController().signal, AbortSignal.timeout(9000)]), cache: 'no-store' });
              const value = await response.json();
              if (response.ok && typeof value.questionId === 'string') selection = { questionId: value.questionId, ...(typeof value.hypothesis === 'string' ? { hypothesis: value.hypothesis } : {}) };
            } catch { selection = undefined; }
          }
          next = submit(current, fields.answer ?? '', fields.reasoning ?? '', new Date().toISOString(), selection);
        }
        else if (action === 'advance' && ['visual', 'worked'].includes(current.stage)) next = advance(current);
        else if (action === 'reinforce' && current.stage === 'complete') next = reinforce(current);
        else if (action === 'reset') next = newSession(selected);
        if (!next) throw Error('Tindakan belajar tidak valid.');
        const updated: Saved = { version: 1, sessions: { ...saved.sessions, [selected]: next } };
        setSaved(updated);
        setLastSaved(true);
        return next;
      }
      const response = await accountRequest('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: lifetime.current?.signal, body: JSON.stringify({ concept: selected, action, expectedRevision: revisions.current[selected] || 0, ...fields }) });
      if (response.status === 409) {
        await loadProgress(lifetime.current?.signal);
        throw Error('Kemajuan diperbarui dari perangkat lain. Periksa tahap terbaru sebelum mencoba lagi.');
      }
      const data = await response.json();
      if (response.status === 401) throw Error('Sesi Supabase ditolak. Masuk kembali; analisis Gemini tidak dijalankan.');
      if (!response.ok) throw Error(typeof data.error === 'string' ? data.error : 'Kemajuan gagal disimpan. Coba lagi.');
      const parsed = readSaved(JSON.stringify({ version: 1, sessions: { [selected]: data.session } }));
      const next = parsed?.sessions[selected];
      if (!next || !Number.isSafeInteger(data.revision) || data.revision < 1) throw Error('Balasan penyimpanan tidak valid.');
      revisions.current[selected] = data.revision;
      setSaved(previous => ({ version: 1, sessions: { ...previous.sessions, [selected]: next } }));
      setLastSaved(true);
      return next;
    } catch (cause) {
      if (!lifetime.current?.signal.aborted) setError(cause instanceof TypeError ? 'CORS/koneksi backend gagal. Gemini tidak dipanggil.' : cause instanceof Error ? cause.message : 'Kemajuan gagal disimpan. Coba lagi.');
      return null;
    } finally { mutation.current = false; if (!lifetime.current?.signal.aborted) setBusy(false); }
  }
  async function performAction(action: 'advance' | 'reinforce' | 'reset') {
    if (await commitProgress(action)) { clearInputs(); setConfirmReset(false); }
  }
  function clearInputs() { if (mutation.current) return; pending.current?.abort(); setBusy(false); setAnswer(''); setReasoning(''); setFeedback(null); setError(''); }
  function navigate(next: View) { if (mutation.current) return; clearInputs(); if (next === 'map' && view !== 'map' && !demo && smaUnlocked) { setMapLoading(true); setMapError(''); } if (next === 'explore') setExploreTopic(null); if (next === 'curriculum') setMaterialToOpen(null); setView(next); setMenu(false); setConfirmReset(false); window.scrollTo(0, 0); }
  function start(id: ConceptId) { if (mutation.current) return; clearInputs(); setSelected(id); setView('learn'); setMenu(false); window.scrollTo(0, 0); }
  function openExplorer(id: string) { if (mutation.current) return; navigate('explore'); setExploreTopic(id); }
  function openMaterial(id: string) {
    if (mutation.current) return;
    if (id === 'distribution' || id === 'inverse') { start(id); return; }
    if (!smaUnlocked) { start(nextPretest?.id || 'distribution'); return; }
    navigate('curriculum'); setMaterialToOpen(id);
  }
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!question || busy) return;
    if (!grade(question, answer)) { setError('Gunakan angka, pecahan, atau ekspresi linear dengan x. Contoh format: 2x + 8 atau x = 6.'); return; }
    setError('');
    const committed = await commitProgress('submit', { answer, reasoning });
    if (!committed) return;
    if (committed.stage === 'complete' && pretestsComplete({ ...saved.sessions, [selected]: committed })) { navigate('curriculum'); return; }
    setAnswer(''); setReasoning('');
    if (validation) { setFeedback(null); return; }
    const baseline = curatedFeedback(question, answer);
    if (stage === 'diagnosis' || stage === 'probe') {
      setFeedback({ text: baseline, source: 'Pendamping belajar' });
      return;
    }
    if (demo) { setFeedback({ text: baseline, source: 'Mode demo · materi terkurasi' }); return; }
    setFeedback({ text: baseline, source: 'Materi terkurasi' });
    setBusy(true);
    const controller = new AbortController(); pending.current = controller;
    try {
      const response = await accountRequest('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: question.id, answer, reasoning }), signal: controller.signal });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setFeedback({ text: baseline, source: 'Sesi Supabase ditolak · Gemini tidak dipanggil' });
          return;
        }
        throw Error('Backend feedback tidak merespons.');
      }
      const v = await response.json();
      if (typeof v.feedback === 'string') setFeedback({ text: v.feedback, source: aiLabel(v) });
    } catch (cause) {
      if (!controller.signal.aborted) {
        const authFailure = cause instanceof Error && /akun belum tersedia|masuk kembali|sesi berakhir/i.test(cause.message);
        setFeedback({ text: baseline, source: authFailure ? 'Sesi Supabase tidak tersedia · Gemini tidak dipanggil' : 'CORS/koneksi backend gagal · Gemini belum dipanggil' });
      }
    }
    finally { if (pending.current === controller) { pending.current = null; setBusy(false); } }
  }
  function exportProgress() {
    const sessions = Object.fromEntries(Object.entries(saved.sessions).map(([concept, session]) => {
      if (!session) return [concept, session];
      const { diagnosis: _diagnosis, mastery: _mastery, hypothesis: _hypothesis, attempts, ...progress } = session;
      return [concept, { ...progress, attempts: attempts.map(({ knownError: _knownError, errorType: _errorType, ...attempt }) => attempt) }];
    }));
    const blob = new Blob([JSON.stringify({ version: saved.version, sessions, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'rethink-kemajuan.json'; a.click(); URL.revokeObjectURL(url);
  }

  return <div className="app-shell">
    <aside className={`sidebar ${menu ? 'open' : ''}`}>
      <a className="brand" href="#" onClick={e => { e.preventDefault(); navigate('dashboard'); }}><span className="brand-icon" aria-hidden="true"><svg viewBox="0 0 36 36"><path d="M10 27V9h9a5 5 0 0 1 0 10h-8m9 0 8 8" /><circle cx="25.5" cy="9.5" r="2.5" /></svg></span><span>ReThink</span><span className="brand-dot">.</span></a>
      <div className="workspace-label">RUANG BELAJAR</div>
      <nav aria-label="Navigasi utama">{([
        ['dashboard', LayoutDashboard, 'Beranda'], ['learn', BookOpen, 'Pretest dasar'], ['curriculum', GraduationCap, 'Matematika SMA'], ['explore', Lightbulb, 'Jelajahi Konsep'], ['map', GitBranch, 'Peta konsep'], ['history', History, 'Riwayat belajar'],
      ] as const).map(([id, Icon, label]) => <button key={id} className={view === id ? 'nav-item active' : 'nav-item'} onClick={() => navigate(id)}><Icon size={19} />{label}{view === id && <span className="nav-dot" />}</button>)}</nav>
      <div className="sidebar-note"><span className="note-icon"><Lightbulb size={20} /></span><strong>Pelan-pelan, sampai paham.</strong><p>Setiap kesalahan adalah petunjuk untuk langkah berikutnya.</p></div>
        <div className="profile"><div className="avatar">{displayName.charAt(0).toUpperCase()}</div><div><strong>{displayName}</strong><small>{demo ? 'Progres sementara di tab ini' : account?.user.email}</small></div><GraduationCap size={19} /></div>
    </aside>
    {menu && <button className="menu-backdrop" aria-label="Tutup navigasi" onClick={() => setMenu(false)} />}
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" aria-label="Buka navigasi" onClick={() => setMenu(!menu)}><Menu size={22} /></button><span>Ruang belajar</span><ChevronRight size={14} /><strong>{view === 'dashboard' ? 'Beranda' : view === 'learn' ? 'Pretest dasar' : view === 'curriculum' ? 'Matematika SMA' : view === 'explore' ? 'Jelajahi Konsep' : view === 'map' ? 'Peta konsep' : 'Riwayat belajar'}</strong></div><div className="topbar-right"><span className={`status ${ai ? 'connected' : ''}`}><i />{ai === null ? 'Memeriksa Gemini' : ai ? 'Key Gemini tersedia · koneksi belum diuji' : 'Mode terkurasi'}</span><button type="button" className="text-button account-logout" disabled={busy} onClick={() => { void signOut().catch(cause => setStorageMessage(cause.message)); }}>Keluar</button></div></header>
      <main>
        {demo && <div className="notice" role="status">Mode demo aktif. Tidak ada akun atau database yang digunakan; progres hilang saat halaman dimuat ulang.</div>}
        {storageMessage && <div className="notice" role="status">{storageMessage}</div>}{error && !question && <p className="error" role="alert">{error}</p>}
        {!ready ? <div className="loading">{storageMessage ? <button type="button" className="secondary" onClick={() => { setStorageMessage(''); void loadProgress(lifetime.current?.signal).catch(() => setStorageMessage('Kemajuan belum dapat dimuat. Coba lagi.')); }}>Coba lagi</button> : <><LoaderCircle className="spin" />Memuat kemajuan akunmu…</>}</div> : <>
        {view === 'dashboard' && <>
          <div className="page-heading home-heading"><div><span className="eyebrow">CATATAN 01 <i /> RUANG BELAJAR</span><h1>Matematika yang <em>akhirnya masuk akal.</em></h1><p>Pelajari idenya, lihat hubungan antarbagian, lalu coba dengan caramu sendiri.</p></div><span className="edition">2 pretest · kelas 10–12</span></div>
          <section className="hero-card home-hero"><div className="hero-copy"><span className="hero-kicker">PRETEST DASAR <b>01</b></span><h2>Kurung itu<br /><em>bisa dibuka.</em></h2><p>Lihat bagaimana satu pengali bekerja pada setiap suku. Mulai dari bentuknya, baru hitung hasilnya.</p><button className="primary" onClick={() => start('distribution')}>{saved.sessions.distribution && saved.sessions.distribution.stage !== 'complete' ? 'Lanjutkan belajar' : 'Bongkar sifat distributif'}<ArrowRight size={18} /></button><small className="hero-caption">BERANGKAT DARI JAWABANMU</small></div><div className="hero-art home-area-model"><span className="hero-stamp">BENTUK 01 <i>↗</i></span><svg viewBox="0 0 480 290" role="img" aria-label="Model luas menunjukkan a kali b ditambah c sama dengan ab ditambah ac"><defs><pattern id="workbook-grid" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" fill="none" stroke="#2345a7" strokeOpacity=".08" strokeWidth="1" /></pattern></defs><rect x="24" y="18" width="432" height="252" fill="url(#workbook-grid)" /><path d="M88 82h302v124H88z" fill="none" stroke="#263f9c" strokeWidth="2" /><path d="M88 82h172v124H88z" fill="#f0c956" stroke="#263f9c" strokeWidth="2" /><path d="M260 82h130v124H260z" fill="#ec6a4b" stroke="#263f9c" strokeWidth="2" /><path d="M260 75v-19m-172 19v-19m302 19v-19m-172 19v-19" stroke="#263f9c" strokeWidth="1.5" /><path d="M80 82h-20m20 124H60m0-124v124" fill="none" stroke="#263f9c" strokeWidth="1.5" /><text x="220" y="48" textAnchor="middle" className="area-side">b + c</text><text x="174" y="156" textAnchor="middle" className="area-term">ab</text><text x="325" y="156" textAnchor="middle" className="area-term">ac</text><text x="47" y="151" textAnchor="middle" className="area-side">a</text><text x="174" y="232" textAnchor="middle" className="area-side">b</text><text x="325" y="232" textAnchor="middle" className="area-side">c</text><text x="88" y="264" className="area-equation">a(b + c) = ab + ac</text></svg></div></section>
          <div className="stats-grid home-stats"><div className="stat-card"><span className="stat-icon lavender"><BookOpen size={21} /></span><div><strong>{Object.keys(saved.sessions).length}<small> / 2</small></strong><span>Pretest dimulai</span></div></div><div className="stat-card"><span className="stat-icon mint"><CheckCircle2 size={21} /></span><div><strong>{completedSessions}</strong><span>Sesi selesai</span></div></div><div className="stat-card"><span className="stat-icon peach"><TrendingUp size={21} /></span><div><strong>{totalAttempts}</strong><span>Jawaban dicoba</span></div></div></div>
          <div className="section-heading"><div><span className="eyebrow">PILIH JALURMU</span><h2>Dua pretest sebelum melangkah.</h2><p>Selesaikan keduanya untuk membuka materi Matematika SMA kelas 10–12.</p></div><button className="text-button" onClick={() => navigate('map')}>Lihat peta konsep <ArrowRight size={16} /></button></div>
          <div className="concept-grid home-topics">{concepts.map((concept, i) => { const s = saved.sessions[concept.id]; const status = !s ? 'Belum dimulai' : s.stage === 'complete' ? 'Sesi selesai' : 'Sedang dipelajari'; return <button className={`concept-card home-topic ${i === 0 ? 'featured' : ''}`} key={concept.id} onClick={() => start(concept.id)}><div className="concept-top"><span className={`concept-symbol ${i ? 'mint' : 'lavender'}`}>{i ? 'x + 6 = 11' : 'a × (b + c)'}</span><span className="tag neutral">{status}</span></div><span className="concept-index">0{i + 1} <i /> {concept.duration}</span><h3>{concept.title}</h3><p>{concept.subtitle}</p><div className="concept-prerequisite">Mulai dari: {concept.prerequisite}</div><div className="concept-bottom"><span>Belajar · coba · refleksi</span><span className="circle-arrow"><ArrowRight size={18} /></span></div></button>; })}</div>
          <section className="sma-banner"><div><span className="eyebrow">SETELAH PRETEST · KELAS 10–12</span><h2>Roadmap Matematika SMA</h2><p>{smaUnlocked ? 'Kedua pretest selesai. Materi utamamu sudah terbuka.' : `${completedSessions}/2 pretest selesai. Kenali alur materi yang akan kamu pelajari berikutnya.`}</p><button className="primary" onClick={() => navigate('curriculum')}>{smaUnlocked ? 'Buka materi SMA' : 'Lihat roadmap'}<ArrowRight size={17} /></button></div><GraduationCap size={65} /></section>
          <section className="journey home-journey"><div><span className="eyebrow">TIGA LANGKAH</span><h3>Pelan-pelan, sampai polanya terlihat.</h3></div><div className="journey-step"><span className="step-number">01</span><div><strong>Kenali yang mengganjal</strong><small>Mulai dari jawaban dan cara berpikirmu</small></div></div><ChevronRight size={17} className="journey-chevron" /><div className="journey-step"><span className="step-number">02</span><div><strong>Bangun gambarnya</strong><small>Lihat konsep bekerja lewat visual</small></div></div><ChevronRight size={17} className="journey-chevron" /><div className="journey-step"><span className="step-number">03</span><div><strong>Coba tanpa bantuan</strong><small>Uji idenya di soal yang baru</small></div></div></section>
        </>}

        {view === 'curriculum' && <SmaRoadmap key={materialToOpen || 'roadmap'} initialMaterialId={materialToOpen} unlocked={smaUnlocked} demo={demo} progress={curriculumProgress} onProgress={setCurriculumProgress} onPretest={() => start(nextPretest?.id || 'distribution')} />}

        {view === 'explore' && <ConceptExplorer key={exploreTopic || 'topics'} initialTopic={exploreTopic} unlocked={smaUnlocked} onLearn={openMaterial} />}

        {view === 'learn' && <>
          <div className="section-heading learning-heading"><div><button className="text-button" onClick={() => navigate('dashboard')}><ArrowLeft size={15} /> Kembali ke beranda</button><h1>{c.title}</h1><p>{c.subtitle}</p></div><label className="concept-select">Konsep <select value={selected} disabled={busy} onChange={e => start(e.target.value as ConceptId)}>{concepts.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}</select></label></div>
          <div className="learning-layout"><section className="lesson-card">
            <div className="lesson-top"><span className="eyebrow">{['diagnosis', 'probe'].includes(stage) ? 'Diagnosis' : ['visual', 'worked', 'practice'].includes(stage) ? 'Bangun konsep' : 'Uji pemahaman'}</span><span className={`tag ${validation ? 'blue' : 'neutral'}`}>{validation ? 'Tanpa bantuan' : stage === 'complete' ? 'Sesi selesai' : 'Langkah demi langkah'}</span></div>
            <h2 tabIndex={-1}>{stageLabels[stage]}</h2>
            {feedback && !validation && <div className="feedback" role="status"><Sparkles size={19} /><div><p>{feedback.text}</p><small>{feedback.source}{busy && ' · Menyiapkan feedback…'}</small></div></div>}
            {question && <form onSubmit={onSubmit} key={question.id}>
              <p className="question-prompt">{question.prompt}</p>{question.math && <div className="math-display">{question.math}</div>}
              {stage === 'practice' && <div className="hint"><Lightbulb size={18} />{question.hint}</div>}
              {stage === 'practice' && <PracticeVisual key={selected} id={selected} />}<label className="field-label" htmlFor="answer">Jawabanmu</label><input id="answer" autoComplete="off" autoFocus maxLength={160} value={answer} onChange={e => setAnswer(e.target.value)} placeholder={question.kind === 'expression' ? 'Tuliskan ekspresi tanpa kurung' : 'Tuliskan nilai bilangan'} required disabled={busy} aria-describedby={error ? 'answer-error' : 'answer-format'} />
              <small id="answer-format" className="field-help">{question.kind === 'expression' ? 'Gunakan x, +, −, *, atau /. Tuliskan bentuk tanpa kurung.' : 'Angka, desimal, pecahan, atau x = angka diterima.'}</small>
              <label className="field-label" htmlFor="reasoning">{validation ? 'Catatan cara berpikir' : 'Bagaimana kamu memikirkannya?'} <span>(opsional)</span></label><textarea id="reasoning" maxLength={1200} value={reasoning} onChange={e => setReasoning(e.target.value)} placeholder="Ceritakan langkah atau alasanmu…" rows={3} disabled={busy} />
              {!validation && <small className="field-help">{['diagnosis', 'probe'].includes(stage) ? 'Jika Gemini aktif, jawaban dan alasan membantu memilih pertanyaan berikutnya.' : 'Jika Gemini aktif, jawaban dan alasan membantu menyusun feedback.'}</small>}
              {error && <p className="error" role="alert" id="answer-error">{error}</p>}
              <div className="form-footer"><span><Target size={15} />{validation ? 'Kerjakan dengan pemahamanmu sendiri' : 'Kesalahan adalah bagian dari belajar'}</span><button className="primary" type="submit" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin" /> : <>Periksa jawaban <ArrowRight size={17} /></>}</button></div>
            </form>}
            {stage === 'visual' && <><p className="question-prompt">{c.visual}</p><ConceptVisual id={selected} /><button className="primary lesson-next" disabled={busy} onClick={() => { void performAction('advance'); }}>Lihat contoh berikutnya <ArrowRight size={17} /></button></>}
            {stage === 'worked' && <><p className="question-prompt">Perhatikan bagaimana konsep digunakan di setiap langkah.</p><WorkedVisual key={selected} id={selected} steps={c.worked} /><button className="primary lesson-next" disabled={busy} onClick={() => { void performAction('advance'); }}>Coba latihan terbimbing <ArrowRight size={17} /></button></>}
            {stage === 'complete' && <div className="result-content"><span className="result-icon neutral"><BookOpen size={36} /></span><h3>Sesi selesai</h3><p>{smaUnlocked ? 'Kedua pretest selesai. Kamu bisa melanjutkan ke materi Matematika SMA.' : 'Pretest ini selesai. Lanjutkan pretest berikutnya untuk membuka materi Matematika SMA.'}</p><div className="result-actions"><button className="primary" onClick={() => smaUnlocked ? navigate('curriculum') : start(nextPretest?.id || 'distribution')}>{smaUnlocked ? 'Buka Matematika SMA' : 'Lanjutkan pretest berikutnya'}<ArrowRight size={16} /></button><button className="secondary" disabled={busy} onClick={() => { void performAction('reinforce'); }}>Ulangi materi <RotateCcw size={16} /></button></div></div>}
          </section><aside className="lesson-aside"><div className="path-card"><h3>Perjalanan konsep</h3><ol>{stageOrder.filter(s => s !== 'complete').map((s, i) => <li className={s === stage ? 'current' : s !== 'visual' && s !== 'worked' && attempted(s as QuestionRole) ? 'done' : ''} key={s}><span>{s !== 'visual' && s !== 'worked' && attempted(s as QuestionRole) ? <Check size={13} /> : i + 1}</span><div><strong>{stageLabels[s]}</strong>{s === stage && <small>{s === 'probe' ? `Pertanyaan lanjutan ${session.attempts.filter(a => getQuestion(a.questionId)?.role === 'probe').length + 1}` : 'Sedang dikerjakan'}</small>}</div></li>)}</ol></div><button className="text-button reset-button" onClick={() => setConfirmReset(true)}><RotateCcw size={14} /> Mulai ulang konsep ini</button></aside></div>
        </>}

        {view === 'map' && <ConceptMap unlocked={smaUnlocked} completedPretests={concepts.filter(c => saved.sessions[c.id]?.stage === 'complete').map(c => c.id)} progress={curriculumProgress} loading={mapLoading} error={mapError} onRetry={() => setMapReload(value => value + 1)} onExplore={openExplorer} onLearn={openMaterial} onPretest={start} />}

        {view === 'history' && <><div className="page-heading"><div><h1>Riwayat belajar</h1><p>Jawaban dan proses berpikirmu, tersimpan di akunmu.</p></div><button className="secondary" onClick={exportProgress}><Download size={16} />Unduh kemajuan</button></div>{totalAttempts === 0 ? <div className="empty-state"><History size={40} /><h2>Perjalananmu mulai di sini.</h2><p>Belum ada jawaban. Pilih konsep dan coba soal pertamamu.</p><button className="primary" onClick={() => start('distribution')}>Mulai belajar <ArrowRight size={16} /></button></div> : <div className="history-list">{Object.values(saved.sessions).flatMap(s => (s?.attempts ?? []).map(a => ({ ...a, concept: s!.concept }))).sort((a, b) => b.at.localeCompare(a.at)).map((a, i) => <article className="history-item" key={`${a.at}-${i}`}><span className={`attempt-icon ${a.correct ? 'green' : 'amber'}`}>{a.correct ? <Check size={19} /> : <RotateCcw size={18} />}</span><div><h3>{getConcept(a.concept).title} <span>{stageLabels[getQuestion(a.questionId)?.role as Stage] || 'Pertanyaan adaptif'}</span></h3><p>Jawaban: <strong>{a.answer}</strong></p>{a.reasoning && <p className="reasoning-note">“{a.reasoning}”</p>}<small>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(a.at))}</small></div><span className={`tag ${a.correct ? 'green' : 'amber'}`}>{a.correct ? 'Setara' : 'Belum setara'}</span></article>)}</div>}</>}
        <footer className="page-footer"><span>ReThink<span className="brand-dot">.</span> <span>Ruang untuk berpikir lagi.</span></span><span>{demo ? 'Progres sementara di tab ini' : `${lastSaved ? 'Tersimpan di akunmu' : 'Kemajuan tersimpan di akunmu'} · Dapat dilanjutkan di perangkat lain`}</span></footer>
        </>}
      </main>
    </div>
    {confirmReset && <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="reset-title"><button autoFocus className="icon-button modal-close" aria-label="Tutup" onClick={() => setConfirmReset(false)}><X size={20} /></button><h2 id="reset-title">Mulai ulang {c.title.toLowerCase()}?</h2><p>Progres latihan konsep ini akan direset di akunmu pada semua perangkat. Konsep lain tetap tersimpan.</p><div className="result-actions"><button className="secondary" onClick={() => setConfirmReset(false)}>Batal</button><button className="primary" disabled={busy} onClick={() => { void performAction('reset'); }}>Mulai ulang</button></div></div></div>}
  </div>;
}
