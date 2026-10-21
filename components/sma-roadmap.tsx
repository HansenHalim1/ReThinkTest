'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, GraduationCap, LockKeyhole, RotateCcw } from 'lucide-react';
import LessonMedia from '@/components/lesson-media';
import { accountRequest } from '@/lib/api';
import { getMaterial, gradeLevels, materials, curriculumTracks, curriculumVersion, type CurriculumTrack, type CurriculumProgress, type GradeLevel } from '@/lib/curriculum';

export default function SmaRoadmap({ unlocked, demo, progress, onProgress, onPretest, initialMaterialId = null }: {
  initialMaterialId?: string | null; unlocked: boolean; demo: boolean; progress: CurriculumProgress;
  onProgress: (progress: CurriculumProgress) => void; onPretest: () => void;
}) {
  const [track, setTrack] = useState<CurriculumTrack>(getMaterial(initialMaterialId || '')?.track || 'general');
  const [grade, setGrade] = useState<GradeLevel>(getMaterial(initialMaterialId || '')?.grade || 10);
  const [selected, setSelected] = useState<string | null>(unlocked ? initialMaterialId : null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [ready, setReady] = useState(demo || !unlocked);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const writing = useRef(false);
  const active = useRef(true);
  const lesson = selected ? getMaterial(selected) : undefined;
  const pathway = materials.filter(m => m.track === track);
  const trackInfo = curriculumTracks.find(t => t.id === track)!;
  const completed = pathway.filter(m => progress[m.id]?.completed).length;
  const nextMaterial = pathway.find(m => !progress[m.id]?.completed);
  useEffect(() => {
    active.current = true;
    const controller = new AbortController();
    if (!demo && unlocked) {
      setReady(false); setError('');
      accountRequest('/api/curriculum', { signal: controller.signal }).then(async response => {
        if (!response.ok) throw Error('Materi belum dapat dimuat. Coba lagi setelah backend diperbarui.');
        const data = await response.json();
        if (!data.unlocked) throw Error('Selesaikan pretest dasar terlebih dahulu. Muat ulang halaman untuk memperbarui kemajuan.');
        if (data.curriculumVersion !== curriculumVersion) throw Error('Versi materi backend berbeda. Perbarui backend lalu muat ulang halaman.');
        if (!Array.isArray(data.progress)) throw Error('Data materi tidak dapat dibaca.');
        if (!controller.signal.aborted) {
          onProgress(Object.fromEntries(data.progress.map((row: CurriculumProgress[string]) => [row.moduleId, row])));
          setReady(true);
        }
      }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Materi belum dapat dimuat.'); });
    }
    return () => { active.current = false; controller.abort(); };
  }, [demo, unlocked, reload, onProgress]);
  function open(id: string) {
    if (!unlocked || !ready || writing.current) return;
    const target = getMaterial(id);
    if (!target) return;
    setTrack(target.track); setGrade(target.grade);
    setSelected(id); setAnswer(''); setResult(null); setError(''); window.scrollTo(0, 0);
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!lesson || !answer || writing.current || !ready) return;
    writing.current = true; setBusy(true); setError('');
    try {
      const previous = progress[lesson.id];
      if (demo) {
        const correct = answer === lesson.quiz.correctOption;
        onProgress({ ...progress, [lesson.id]: { moduleId: lesson.id, completed: previous?.completed === true || correct, attempts: (previous?.attempts || 0) + 1, revision: (previous?.revision || 0) + 1 } });
        setResult({ correct, explanation: lesson.quiz.explanation });
      } else {
        const response = await accountRequest('/api/curriculum', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleId: lesson.id, answerId: answer, expectedRevision: previous?.revision || 0 }) });
        if (!active.current) return;
        if (response.status === 409) { setReload(value => value + 1); throw Error('Kemajuan berubah di perangkat lain. Periksa kemajuan terbaru, lalu coba lagi.'); }
        const data = await response.json();
        if (!response.ok) throw Error(typeof data.error === 'string' ? data.error : 'Jawaban belum dapat disimpan. Coba lagi.');
        if (!data.progress || data.progress.moduleId !== lesson.id || typeof data.correct !== 'boolean' || typeof data.explanation !== 'string') throw Error('Balasan penyimpanan tidak valid.');
        onProgress({ ...progress, [lesson.id]: data.progress });
        setResult({ correct: data.correct, explanation: data.explanation });
      }
    } catch (cause) { if (active.current) setError(cause instanceof Error ? cause.message : 'Jawaban belum dapat disimpan.'); }
    finally { writing.current = false; if (active.current) setBusy(false); }
  }
  if (lesson) {
    const index = pathway.findIndex(m => m.id === lesson.id);
    const next = pathway[index + 1];
    return <div className="sma-page">
      <button className="text-button" disabled={busy} onClick={() => { setSelected(null); setResult(null); setError(''); }}><ArrowLeft size={16} /> Kembali ke roadmap</button>
      <div className="page-heading"><div><span className="eyebrow">{lesson.track === 'advanced' ? 'TINGKAT LANJUT · PILIHAN' : 'MATEMATIKA UMUM'} · SARAN KELAS {lesson.grade} · MATERI {String(index + 1).padStart(2, '0')}</span><h1>{lesson.title}</h1><p>{lesson.summary}</p></div><span className="edition">{lesson.duration}</span></div>
      <p className="curriculum-placement">{lesson.phase === 'prerequisite' ? 'Penguat prasyarat' : `Fase ${lesson.phase}`} · Penempatan kelas adalah saran urutan belajar ReThink.</p>
      <div className="sma-lesson-layout"><div>
        <section className="sma-paper"><span className="eyebrow">01 / PAHAMI IDENYA</span><h2>Mulai dari konsep</h2>{lesson.explanation.map(text => <p key={text}>{text}</p>)}<div className="sma-formulas" aria-label="Rumus utama">{lesson.formulas.map(formula => <div key={formula}>{formula}</div>)}</div></section>
        <LessonMedia key={lesson.id} topicId={lesson.id} demo={demo} />
        <section className="sma-paper"><span className="eyebrow">02 / IKUTI CONTOHNYA</span><h2>Satu soal, langkah demi langkah.</h2><p className="sma-problem">{lesson.example.problem}</p><ol className="sma-worked">{lesson.example.steps.map(step => <li key={step}>{step}</li>)}</ol></section>
        {lesson.additionalExamples.map((example, i) => <section className="sma-paper" key={example.problem}><span className="eyebrow">CONTOH TAMBAHAN {i + 1}</span><h2>Coba lihat dari situasi lain.</h2><p className="sma-problem">{example.problem}</p><ol className="sma-worked">{example.steps.map(step => <li key={step}>{step}</li>)}</ol></section>)}
        <section className="sma-paper"><h2>Kesalahan yang perlu diwaspadai</h2><ul>{lesson.commonMistakes.map(text => <li key={text}>{text}</li>)}</ul></section>
        <section className="sma-paper"><span className="eyebrow">03 / COBA SENDIRI</span><h2>Cek pemahamanmu</h2><form onSubmit={submit}><fieldset className="sma-quiz" disabled={busy || !ready}><legend>{lesson.quiz.prompt}</legend>{lesson.quiz.options.map(option => <label key={option.id} className={answer === option.id ? 'chosen' : ''}><input type="radio" name="material-answer" value={option.id} checked={answer === option.id} onChange={() => { setAnswer(option.id); setResult(null); }} required /><span>{option.text}</span></label>)}</fieldset>
          {error && <p className="error" role="alert">{error}</p>}
          {result && <div className={`sma-answer ${result.correct ? 'correct' : ''}`} role="status"><strong>{result.correct ? 'Tepat. Materi ini selesai!' : 'Belum tepat. Coba telusuri lagi.'}</strong><p>{result.explanation}</p>{!demo && <small>Jawaban dan kemajuan tersimpan di akunmu.</small>}</div>}
          <div className="sma-actions"><button className="primary" type="submit" disabled={busy || !answer || !ready}>{busy ? 'Menyimpan…' : 'Periksa jawaban'}<Check size={16} /></button>{progress[lesson.id]?.completed && (next ? <button className="secondary" type="button" disabled={busy} onClick={() => { setGrade(next.grade); open(next.id); }}>Materi berikutnya<ArrowRight size={16} /></button> : <button className="secondary" type="button" disabled={busy} onClick={() => setSelected(null)}>Lihat seluruh kemajuan<ArrowRight size={16} /></button>)}</div>
        </form></section>
      </div><aside className="sma-objectives"><GraduationCap size={26} /><h3>Yang akan kamu pelajari</h3><ul>{lesson.objectives.map(text => <li key={text}>{text}</li>)}</ul>{lesson.prerequisites.length > 0 && <><h3>Prasyarat yang disarankan</h3><ul>{lesson.prerequisites.map(id => <li key={id}>{getMaterial(id) ? <button className="text-button" disabled={busy} onClick={() => open(id)}>{getMaterial(id)!.title}</button> : id === 'inverse' ? 'Operasi invers' : 'Sifat distributif'}</li>)}</ul></>}{lesson.alignment.sourceUrl && <a href={lesson.alignment.sourceUrl} target="_blank" rel="noreferrer">Rujukan topik · bagian {lesson.alignment.section}</a>}<p>Satu soal ini adalah cek singkat. Kamu tetap bisa membaca ulang dan berlatih lagi.</p>{progress[lesson.id]?.completed && <span className="tag green"><CheckCircle2 size={14} /> Materi selesai</span>}</aside></div>
    </div>;
  }
  return <div className="sma-page">
    <div className="page-heading"><div><span className="eyebrow">PERJALANAN BERIKUTNYA</span><h1>Matematika SMA.<br /><em>Satu ide pada satu waktu.</em></h1><p>Dari fondasi kelas 10 sampai penerapan di kelas 12. Pilih kelasmu, pahami konsepnya, lalu coba sendiri.</p></div><span className="edition">KELAS 10 — 12</span></div>
    <div className="curriculum-track-tabs" role="group" aria-label="Pilih jalur matematika">{curriculumTracks.map(t => <button type="button" key={t.id} aria-pressed={track === t.id} onClick={() => { setTrack(t.id); setGrade(t.id === 'advanced' ? 11 : 10); setError(''); }}>{t.title}</button>)}</div>
    <p className="curriculum-placement">{trackInfo.description} Materi tingkat lanjut tidak dihitung sebagai kewajiban di jalur umum.</p>
    <section className="sma-banner"><div><span className="eyebrow">{unlocked ? 'FONDASI SUDAH DICOBA' : 'LANGKAH AWAL'}</span><h2>{unlocked ? 'Pretest dasar selesai. Perjalananmu terbuka.' : 'Kenali fondasimu lewat satu pretest.'}</h2><p>{unlocked ? 'Kamu bisa mulai dari kelas 10 atau memilih topik yang sedang dipelajari di sekolah.' : 'Selesaikan pretest dasar lintas topik untuk membuka seluruh materi SMA.'}</p>{unlocked ? ready && <button className="primary" onClick={() => { const next = nextMaterial || pathway[0]; setGrade(next.grade); open(next.id); }}>{completed ? 'Lanjutkan materi' : 'Mulai jalur ini'}<ArrowRight size={17} /></button> : <button className="primary" onClick={onPretest}>Lanjutkan pretest<ArrowRight size={17} /></button>}</div><div className="sma-progress"><strong>{completed}<span> / {pathway.length}</span></strong><span>materi selesai</span><progress aria-label="Kemajuan materi SMA" value={completed} max={pathway.length} /></div></section>
    {error && <div className="notice" role="alert">{error} <button className="text-button" onClick={() => setReload(value => value + 1)}><RotateCcw size={14} />Coba lagi</button></div>}
    {!ready && !error && <p role="status">Memuat kemajuan materi…</p>}
    <div className="sma-grade-tabs" aria-label="Pilih kelas">{gradeLevels.filter(level => pathway.some(m => m.grade === level)).map(level => { const topics = pathway.filter(m => m.grade === level); const done = topics.filter(m => progress[m.id]?.completed).length; return <button type="button" key={level} aria-pressed={grade === level} className={grade === level ? 'active' : ''} onClick={() => setGrade(level)}><span>Kelas {level}</span><small>{done}/{topics.length} materi selesai</small></button>; })}</div>
    <div className="section-heading"><div><span className="eyebrow">ROADMAP KELAS {grade}</span><h2>{track === 'advanced' ? grade === 11 ? 'Perluas bahasa aljabar dan geometri.' : 'Dari model menuju kalkulus.' : grade === 10 ? 'Bangun bahasa matematikamu.' : grade === 11 ? 'Hubungkan fungsi, bentuk, dan data.' : 'Gunakan pola untuk mengambil keputusan.'}</h2><p>Urutan belajar ReThink. Pembagian topik di sekolahmu bisa berbeda.</p></div></div>
    <ol className="sma-roadmap">{pathway.filter(m => m.grade === grade).map((material, index) => { const done = progress[material.id]?.completed; const started = !!progress[material.id]; return <li key={material.id} className={done ? 'done' : ''}><span className="sma-node" aria-hidden="true">{done ? <Check size={20} /> : String(index + 1).padStart(2, '0')}</span><article className="sma-material"><div><span className="eyebrow">{material.phase === 'prerequisite' ? 'PENGUAT PRASYARAT' : `FASE ${material.phase}`} · {material.duration} · {done ? 'SELESAI' : started ? 'SUDAH DICOBA' : 'BELUM DIMULAI'}</span><h3>{material.title}</h3><p>{material.summary}</p></div><button className="secondary" disabled={!unlocked || !ready} onClick={() => open(material.id)} aria-label={`${done ? 'Baca ulang' : 'Buka materi'} ${material.title}`}>{!unlocked ? <><LockKeyhole size={16} />Pretest dulu</> : done ? <>Baca ulang<BookOpen size={16} /></> : <>Buka materi<ArrowRight size={16} /></>}</button></article></li>; })}</ol>
    {completed === pathway.length && <div className="sma-finished" role="status"><CheckCircle2 size={28} /><div><h2>Semua materi di jalur ini sudah kamu coba.</h2><p>Kamu bisa kembali ke materi mana pun untuk memperkuat pemahaman.</p></div></div>}
  </div>;
}
