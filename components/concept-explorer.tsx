'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Eye } from 'lucide-react';
import { getConcept, type ConceptId } from '@/lib/content';
import { ConceptVisual } from '@/components/lesson-visuals';
import { getMaterial } from '@/lib/curriculum';
import { referenceTopics, topicGroups } from '@/lib/concept-map';
import SmaConceptVisual from '@/components/sma-concept-visual';

const reference: Record<ConceptId, { summary: string; formulas: { title: string; formula: string; note: string }[]; example: string[] }> = {
  distribution: {
    summary: 'Kalikan bilangan di luar kurung dengan setiap suku di dalamnya, lalu gabungkan hasilnya.',
    formulas: [
      { title: 'Distributif terhadap penjumlahan', formula: 'a(b + c) = ab + ac', note: 'Pengali a berlaku untuk b dan c.' },
      { title: 'Distributif terhadap pengurangan', formula: 'a(b − c) = ab − ac', note: 'Tanda pengurangan tetap mengikuti suku kedua.' },
      { title: 'Mengeluarkan faktor yang sama', formula: 'ab + ac = a(b + c)', note: 'Gunakan arah sebaliknya untuk mengubah penjumlahan menjadi bentuk perkalian.' },
    ],
    example: ['2(x + 4)', '= 2 × x + 2 × 4', '= 2x + 8'],
  },
  inverse: {
    summary: 'Gunakan operasi kebalikan pada kedua sisi persamaan agar variabel berdiri sendiri dan keseimbangan terjaga.',
    formulas: [
      { title: 'Membalikkan penjumlahan', formula: 'x + a = b  →  x = b − a', note: 'Kurangi kedua sisi dengan a.' },
      { title: 'Membalikkan pengurangan', formula: 'x − a = b  →  x = b + a', note: 'Tambahkan a pada kedua sisi.' },
      { title: 'Membalikkan perkalian', formula: 'ax = b  →  x = b ÷ a', note: 'Bagi kedua sisi dengan a, dengan syarat a ≠ 0.' },
      { title: 'Membalikkan pembagian', formula: 'x ÷ a = b  →  x = ab', note: 'Kalikan kedua sisi dengan a, dengan syarat a ≠ 0.' },
    ],
    example: ['x + 4 = 10', 'x + 4 − 4 = 10 − 4', 'x = 6'],
  },
};

export default function ConceptExplorer({ initialTopic = null, unlocked = false, onLearn }: {
  initialTopic?: string | null; unlocked?: boolean; onLearn: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(initialTopic);
  const [group, setGroup] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'formulas' | 'visuals'>('formulas');
  const heading = useRef<HTMLHeadingElement>(null);
  const topicButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const listHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (selected) heading.current?.focus(); }, [selected]);

  if (!selected) {
    const visible = referenceTopics.filter(topic => (group === 'all' || String(topic.group) === group) && `${topic.title} ${topic.summary}`.toLocaleLowerCase('id-ID').includes(search.trim().toLocaleLowerCase('id-ID')));
    return <>
      <div className="page-heading"><div><span className="eyebrow">PERPUSTAKAAN IDE</span><h1 ref={listHeading} tabIndex={-1}>Jelajahi konsep</h1><p>Rumus, contoh, dan visual interaktif untuk dua fondasi dan seluruh materi SMA kelas 10–12.</p></div><span className="edition">{referenceTopics.length} topik</span></div>
      <div className="explorer-filters"><label className="explorer-search">Cari topik<input type="search" placeholder="Misalnya fungsi, peluang, atau lingkaran" value={search} onChange={e => setSearch(e.target.value)} /></label><div className="explorer-group-filters" aria-label="Filter kelas">{[{id:'all',label:'Semua'}, ...topicGroups].map(item => <button key={item.id} type="button" aria-pressed={group === String(item.id)} onClick={() => setGroup(String(item.id))}>{item.label}</button>)}</div></div>
      <p className="explorer-count" role="status">{visible.length} topik ditampilkan. Jelajahi tanpa mengubah kemajuan belajar.</p>
      {topicGroups.map(item => { const topics = visible.filter(topic => topic.group === item.id); return topics.length > 0 && <section className="explorer-topic-group" key={item.id} aria-labelledby={`explorer-group-${item.id}`}><div className="section-heading"><div><span className="eyebrow">{item.id === 'foundation' ? 'SEBELUM MATERI SMA' : 'MATEMATIKA SMA'}</span><h2 id={`explorer-group-${item.id}`}>{item.label}</h2></div><span>{topics.length} topik</span></div><div className="concept-grid">{topics.map((topic, index) => <button type="button" className="concept-card" key={topic.id} ref={element => { topicButtons.current[topic.id] = element; }} onClick={() => { setMode('formulas'); setSelected(topic.id); window.scrollTo(0, 0); }}>
        <div className="concept-top"><span className={`concept-symbol ${index % 2 ? 'mint' : 'lavender'}`}><BookOpen size={24} /></span><span className="tag neutral">{item.label}</span></div><h3 className="explorer-card-title">{topic.title}</h3><p>{topic.summary}</p><div className="concept-bottom"><span>Rumus & visualisasi interaktif</span><span className="circle-arrow"><ArrowRight size={18} /></span></div>
      </button>)}</div></section>; })}
      {visible.length === 0 && <div className="empty-state"><BookOpen size={35} /><h2>Topik belum ditemukan.</h2><p>Coba kata lain atau tampilkan semua kelas.</p><button className="secondary" onClick={() => { setGroup('all'); setSearch(''); }}>Tampilkan semua topik</button></div>}
    </>;
  }
  const foundational = selected === 'distribution' || selected === 'inverse';
  const material = foundational ? undefined : getMaterial(selected);
  const concept = foundational ? getConcept(selected as ConceptId) : undefined;
  const title = material?.title || concept?.title || '';
  const subtitle = material?.summary || concept?.subtitle || '';
  const content = foundational ? reference[selected as ConceptId] : {
    summary: material!.explanation[0],
    formulas: material!.formulas.map((formula, i) => ({ title: `Rumus ${i + 1}`, formula, note: '' })),
    example: material!.example.steps,
  };
  function back() {
    const previous = selected!;
    setSelected(null);
    requestAnimationFrame(() => (topicButtons.current[previous] || listHeading.current)?.focus());
  }
  return <>
    <div className="page-heading"><div><button type="button" className="text-button" onClick={back}><ArrowLeft size={15} />Semua topik</button><span className="eyebrow">{material ? `KELAS ${material.grade}` : 'FONDASI ALJABAR'}</span><h1 ref={heading} tabIndex={-1}>{title}</h1><p>{subtitle}</p></div></div>
    <div className="explorer-modes" role="group" aria-label="Tampilan konsep">
      <button type="button" aria-pressed={mode === 'formulas'} aria-controls="concept-reference" onClick={() => setMode('formulas')}><BookOpen size={17} />Rumus</button>
      <button type="button" aria-pressed={mode === 'visuals'} aria-controls="concept-reference" onClick={() => setMode('visuals')}><Eye size={17} />Visualisasi</button>
    </div>
    <section id="concept-reference" aria-label={`${mode === 'formulas' ? 'Rumus' : 'Visualisasi'} ${title}`}>
      {mode === 'formulas' ? <div className="explorer-reference"><p className="explorer-summary">{content.summary}</p><div className="explorer-formulas">{content.formulas.map(item => <article className="explorer-formula" key={item.title}><h2>{item.title}</h2><p className="explorer-equation">{item.formula}</p>{item.note && <p>{item.note}</p>}</article>)}</div><article className="explorer-example"><h2>Lihat rumusnya bekerja</h2>{material && <p className="explorer-summary">{material.example.problem}</p>}<ol>{content.example.map(line => <li key={line}>{line}</li>)}</ol><button type="button" className="text-button" onClick={() => setMode('visuals')}>Pahami lewat visual<ArrowRight size={16} /></button></article></div> : foundational ? <><p className="explorer-summary">Ubah nilai dan amati hubungan antara gambar dan bentuk aljabarnya.</p><ConceptVisual key={selected} id={selected as ConceptId} /></> : <SmaConceptVisual key={selected} id={selected} />}
    </section>
    <div className="explorer-lesson-link"><div><strong>Lanjutkan dengan soal latihan</strong><p>{foundational ? 'Kembali ke pretest dan pelajari konsep ini.' : unlocked ? 'Buka penjelasan lengkap dan simpan hasil latihan di perjalanan SMA-mu.' : 'Selesaikan dua pretest untuk membuka latihan dan menyimpan kemajuan materi SMA.'}</p></div><button className="primary" onClick={() => onLearn(selected)}>{foundational ? 'Buka pretest' : unlocked ? 'Buka materi' : 'Lanjutkan pretest'}<ArrowRight size={17} /></button></div>
  </>;
}
