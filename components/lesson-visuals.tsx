'use client';

import { useId, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import type { ConceptId } from '@/lib/content';
import NumberLineComparison from '@/components/number-line-comparison';
import BlockBalance from '@/components/block-balance';
import AdditionNumberLine from '@/components/addition-number-line';

type Mode = 'visual' | 'worked' | 'practice';
type Props = { id: ConceptId; mode?: Mode; step?: number };

function Range({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const inputId = useId();
  return <label className="viz-range" htmlFor={inputId}><span>{label}<b>{value}</b></span><input id={inputId} type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}

function Distribution({ mode, step = 3 }: { mode: Mode; step?: number }) {
  const [tab, setTab] = useState('groups');
  const [x, setX] = useState(3);
  const [groups, setGroups] = useState(3);
  const [units, setUnits] = useState(2);
  const marker = useId().replace(/:/g, '');
  const g = mode === 'visual' ? groups : mode === 'worked' ? 2 : 5;
  const u = mode === 'visual' ? units : mode === 'worked' ? 4 : 2;
  const faded = mode === 'practice';
  const showVariable = mode !== 'worked' || step >= 1;
  const showConstant = mode !== 'worked' || step >= 2;
  const purpleWidth = 340 * x / (x + u);
  return <div className="learning-viz" data-visual="distribution">
    <div className="viz-heading"><div><h3>Satu ide, tiga cara melihat</h3></div><span className="tag neutral">{faded ? 'Bantuan sebagian' : 'Eksplorasi visual'}</span></div>
    <div className="viz-tabs" role="group" aria-label="Representasi sifat distributif">{[['groups', 'Kelompok'], ['area', 'Luas'], ['arrows', 'Alur perkalian']].map(([key, label]) => <button type="button" key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}</div>
    <div className="viz-equation" aria-live="polite"><strong>{g}(x + {u})</strong><span>=</span><strong className={showVariable ? 'term-purple' : 'term-hidden'}>{showVariable ? `${g}x` : '?'}</strong><span>+</span><strong className={showConstant ? 'term-green' : 'term-hidden'}>{showConstant && !faded ? g * u : '?'}</strong></div>
    {tab === 'groups' && <div className="viz-group-grid">{Array.from({ length: g }, (_, i) => <div className="viz-group" key={i}><span className={`viz-x-block ${!showVariable ? 'muted-block' : ''}`}><b>x</b><small>{x} satuan</small></span><div className={`viz-unit-grid ${!showConstant ? 'muted-block' : ''}`} aria-label={`${u} satuan tambahan`}>{Array.from({ length: u }, (_, j) => <i key={j} />)}</div><span className="viz-group-label">Kelompok {i + 1}</span></div>)}</div>}
    {tab === 'area' && <svg className="viz-diagram" viewBox="0 0 460 220" role="img" aria-label={`Persegi panjang dengan ${g} baris; setiap baris memiliki panjang x ditambah ${u}. Bagian ungu mewakili x dan bagian hijau mewakili bilangan.`}>
      <text x={75 + purpleWidth / 2} y="25" textAnchor="middle" className="term-purple">x</text><text x={75 + purpleWidth + (340 - purpleWidth) / 2} y="25" textAnchor="middle" className="term-green">{u}</text>
      <text x="40" y="106" textAnchor="middle">{g}</text>
      {Array.from({ length: g }, (_, i) => <g key={i}><rect x="75" y={42 + i * 120 / g} width={purpleWidth} height={120 / g} className={`area-purple ${!showVariable ? 'muted-block' : ''}`} /><rect x={75 + purpleWidth} y={42 + i * 120 / g} width={340 - purpleWidth} height={120 / g} className={`area-green ${!showConstant ? 'muted-block' : ''}`} /></g>)}
      <text x={75 + purpleWidth / 2} y="188" textAnchor="middle" className="term-purple">{showVariable ? `${g}x` : '?'}</text><text x={75 + purpleWidth + (340 - purpleWidth) / 2} y="188" textAnchor="middle" className="term-green">{showConstant && !faded ? g * u : '?'}</text>
      <text x="245" y="214" textAnchor="middle" className="diagram-caption">Luas total = luas bagian ungu + luas bagian hijau</text>
    </svg>}
    {tab === 'arrows' && <svg className="viz-diagram" viewBox="0 0 460 205" role="img" aria-label="Dua panah menunjukkan pengali di luar kurung dikalikan ke kedua suku di dalam kurung.">
      <defs><marker id={`${marker}-p`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="#8067bb" /></marker><marker id={`${marker}-g`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="#589875" /></marker></defs>
      <text x="150" y="100" className="arrow-formula">{g}</text><text x="186" y="100" className="arrow-formula">(</text><text x="218" y="100" className="arrow-formula term-purple">x</text><text x="260" y="100" className="arrow-formula">+</text><text x="306" y="100" className="arrow-formula term-green">{u}</text><text x="342" y="100" className="arrow-formula">)</text>
      <path d="M158 68 Q194 13 226 65" className="arrow-purple" markerEnd={`url(#${marker}-p)`} /><path d="M158 107 Q242 181 316 108" className="arrow-green" markerEnd={`url(#${marker}-g)`} />
      <text x="192" y="27" textAnchor="middle" className="diagram-caption term-purple">{g} × x</text><text x="242" y="181" textAnchor="middle" className="diagram-caption term-green">{g} × {u}</text>
    </svg>}
    <div className="viz-legend"><span><i className="legend-purple" />Bagian variabel</span><span><i className="legend-green" />Bagian bilangan</span></div>
    {mode === 'visual' ? <><div className="viz-controls"><Range label="Banyak kelompok" value={groups} min={1} max={5} onChange={setGroups} /><Range label="Satuan tambahan" value={units} min={1} max={4} onChange={setUnits} /><Range label="Nilai x (untuk gambar)" value={x} min={1} max={6} onChange={setX} /></div><p className="viz-observation" aria-live="polite">Saat x = {x}, kedua bentuk bernilai {g * (x + u)}. Pengali menyentuh setiap bagian kelompok.</p></> : <p className="viz-observation">{faded ? 'Hitung bagian bilangan dari semua kelompok. Model membantu prosesmu; isi jawabanmu sendiri di bawah.' : step < 2 ? 'Perhatikan satu bagian dahulu, lalu terapkan pengali ke bagian berikutnya.' : 'Ungu dan hijau sama-sama dikalikan. Jumlahkan kedua bagian untuk mendapatkan bentuk tanpa kurung.'}</p>}
  </div>;
}

function Inverse({ mode, step = 3 }: { mode: Mode; step?: number }) {
  const [tab, setTab] = useState('balance');
  const a = mode === 'worked' ? 4 : 6;
  const n = mode === 'worked' ? 6 : 5;
  const total = n + a;
  const r = mode === 'worked' && step >= 2 ? a : 0;
  const right = total - r;
  const hidden = mode === 'practice';
  return <div className="learning-viz" data-visual="inverse">
    <div className="viz-heading"><div><h3>{hidden ? 'Bantu bayangkan persamaannya' : 'Jaga kedua sisi seimbang'}</h3></div><span className="tag neutral">{hidden ? 'Bantuan sebagian' : 'Eksplorasi visual'}</span></div>
    <div className="viz-tabs" role="group" aria-label="Representasi operasi invers">{[['balance', 'Timbangan'], ['numberline', 'Garis bilangan']].map(([key, label]) => <button type="button" key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}</div>
    {mode !== 'visual' && <div className="viz-equation" aria-live="polite"><strong className="term-purple">x</strong>{a - r > 0 && <><span>+</span><strong className="term-green">{a - r}</strong></>}<span>=</span><strong>{right}</strong></div>}
    {mode === 'visual' && tab === 'balance' && <BlockBalance />}
    {tab === 'balance' && mode !== 'visual' && <svg className="viz-diagram" viewBox="0 0 460 250" role="img" aria-label={hidden ? 'Timbangan untuk membayangkan operasi yang sama di kedua sisi.' : `Timbangan seimbang. Dengan x = ${n}, kedua sisi bernilai ${right}.`}>
      <path d="M230 151L196 226H264Z" fill="#e8e1f4" stroke="#b3a0cd" /><rect x="163" y="227" width="134" height="7" rx="3" fill="#b3a0cd" />
      <g transform="rotate(0 230 100)" className="scale-beam"><path d="M90 100H370" stroke="#ad99c8" strokeWidth="7" strokeLinecap="round" /><circle cx="230" cy="100" r="8" fill="#8468b1" />
        <path d="M103 105L78 158H153L128 105M332 105L307 158H382L357 105" stroke="#b9a7ce" fill="none" strokeWidth="2" /><path d="M72 162Q115 198 159 162M301 162Q344 198 388 162" fill="#f0eafa" stroke="#b9a7ce" strokeWidth="2" />
        <rect x="73" y="34" width="45" height="47" rx="7" className="area-purple" /><text x="95" y="63" textAnchor="middle" className="term-purple">x</text>
        {Array.from({ length: a }, (_, i) => <rect key={i} x={127 + (i % 3) * 13} y={66 - Math.floor(i / 3) * 16} width="11" height="13" rx="2" className={i >= a - r ? 'removed-unit' : 'area-green'} />)}
        <rect x="309" y="36" width="71" height="44" rx="7" fill="#e8f2ec" stroke="#abc8b7" /><text x="344" y="64" textAnchor="middle">{right}</text>
      </g>
      <text x="115" y="213" textAnchor="middle" className="diagram-caption term-purple">Sisi kiri</text><text x="344" y="213" textAnchor="middle" className="diagram-caption term-green">Sisi kanan</text>
    </svg>}
    {tab === 'numberline' && (mode === 'visual' ? <AdditionNumberLine /> : <NumberLineComparison key={`${mode}-${step}`} leftStart={total} rightStart={total} removed={r} rightRemoved={r} hidden={hidden} />)}
    {mode !== 'visual' && <p className="viz-observation">{hidden ? `Kamu mengurangi ${a} dari kedua sisi. Tentukan sendiri jumlah satuan yang tersisa; jawaban tidak ditampilkan di model ini.` : step < 2 ? 'Kenali bilangan yang ditambahkan. Operasi pengurangan yang sama perlu diterapkan pada kedua sisi.' : 'Setelah kedua sisi dikurangi dengan jumlah yang sama, variabel berdiri sendiri.'}</p>}
  </div>;
}

export function ConceptVisual({ id, mode = 'visual', step }: Props) {
  return id === 'distribution' ? <Distribution key={`${id}-${mode}`} mode={mode} step={step} /> : <Inverse key={`${id}-${mode}`} mode={mode} step={step} />;
}

export function WorkedVisual({ id, steps }: { id: ConceptId; steps: string[] }) {
  const [step, setStep] = useState(0);
  return <div className="worked-explorer"><div className="worked-navigation" role="group" aria-label="Langkah contoh pengerjaan">{steps.map((_, i) => <button type="button" key={i} aria-pressed={step === i} onClick={() => setStep(i)}>Langkah {i + 1}</button>)}</div><div className="worked-focus" aria-live="polite"><span>{step + 1}</span><p>{steps[step]}</p></div><ConceptVisual id={id} mode="worked" step={step} /><div className="worked-pagination"><button type="button" className="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={15} />Sebelumnya</button><span>{step + 1} / {steps.length}</span><button type="button" className="secondary" disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}>Berikutnya<ArrowRight size={15} /></button></div></div>;
}

export function PracticeVisual({ id }: { id: ConceptId }) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  return <div className="practice-visual"><button type="button" className="text-button" aria-expanded={open} aria-controls={panel} onClick={() => setOpen(!open)}>{open ? <EyeOff size={16} /> : <Eye size={16} />}{open ? 'Sembunyikan bantuan visual' : 'Butuh gambaran? Buka bantuan visual'}</button><div id={panel}>{open && <ConceptVisual id={id} mode="practice" />}</div></div>;
}
