'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Eye } from 'lucide-react';
import { concepts, getConcept, type ConceptId } from '@/lib/content';
import { ConceptVisual } from '@/components/lesson-visuals';

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

export default function ConceptExplorer() {
  const [selected, setSelected] = useState<ConceptId | null>(null);
  const [mode, setMode] = useState<'formulas' | 'visuals'>('formulas');
  const heading = useRef<HTMLHeadingElement>(null);
  const topicButtons = useRef<Partial<Record<ConceptId, HTMLButtonElement | null>>>({});
  useEffect(() => { if (selected) heading.current?.focus(); }, [selected]);

  if (!selected) return <>
    <div className="page-heading"><div><h1>Jelajahi konsep</h1><p>Temukan rumus dan pahami lewat visual. Pilih topik yang ingin kamu jelajahi.</p></div><span className="edition">{concepts.length} topik</span></div>
    <div className="concept-grid">{concepts.map((concept, index) => <button type="button" className="concept-card" key={concept.id} ref={element => { topicButtons.current[concept.id] = element; }} onClick={() => { setMode('formulas'); setSelected(concept.id); }}>
      <div className="concept-top"><span className={`concept-symbol ${index ? 'mint' : 'lavender'}`}>{index ? 'x = ?' : '(a+b)'}</span><span className="tag neutral">Aljabar dasar</span></div>
      <h2 className="explorer-card-title">{concept.title}</h2><p>{concept.subtitle}</p>
      <div className="concept-bottom"><span>Rumus & visualisasi interaktif</span><span className="circle-arrow"><ArrowRight size={18} /></span></div>
    </button>)}</div>
  </>;

  const concept = getConcept(selected);
  const content = reference[selected];
  function back() {
    const previous = selected!;
    setSelected(null);
    requestAnimationFrame(() => topicButtons.current[previous]?.focus());
  }
  return <>
    <div className="page-heading"><div><button type="button" className="text-button" onClick={back}><ArrowLeft size={15} />Semua topik</button><h1 ref={heading} tabIndex={-1}>{concept.title}</h1><p>{concept.subtitle}</p></div></div>
    <div className="explorer-modes" role="group" aria-label="Tampilan konsep">
      <button type="button" aria-pressed={mode === 'formulas'} aria-controls="concept-reference" onClick={() => setMode('formulas')}><BookOpen size={17} />Rumus</button>
      <button type="button" aria-pressed={mode === 'visuals'} aria-controls="concept-reference" onClick={() => setMode('visuals')}><Eye size={17} />Visualisasi</button>
    </div>
    <section id="concept-reference" aria-label={`${mode === 'formulas' ? 'Rumus' : 'Visualisasi'} ${concept.title}`}>
      {mode === 'formulas' ? <div className="explorer-reference"><p className="explorer-summary">{content.summary}</p><div className="explorer-formulas">{content.formulas.map(item => <article className="explorer-formula" key={item.title}><h2>{item.title}</h2><p className="explorer-equation">{item.formula}</p><p>{item.note}</p></article>)}</div><article className="explorer-example"><h2>Lihat rumusnya bekerja</h2><ol>{content.example.map(line => <li key={line}>{line}</li>)}</ol><button type="button" className="text-button" onClick={() => setMode('visuals')}>Pahami lewat visual<ArrowRight size={16} /></button></article></div> : <><p className="explorer-summary">Ubah nilai dan amati hubungan antara gambar dan bentuk aljabarnya.</p><ConceptVisual key={selected} id={selected} /></>}
    </section>
  </>;
}
