'use client';

import { useEffect, useId, useState } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';

type Props = { leftStart: number; rightStart: number; removed: number; rightRemoved: number; hidden?: boolean };

export default function NumberLineComparison({ leftStart, rightStart, removed, rightRemoved, hidden = false }: Props) {
  const [displayed, setDisplayed] = useState(removed);
  const [playing, setPlaying] = useState(false);
  const marker = useId().replace(/:/g, '');
  const maximum = Math.max(10, leftStart, rightStart);
  const position = (value: number) => 35 + value / maximum * 570;
  const leftNow = leftStart - displayed;
  const rightNow = rightStart - Math.min(displayed, rightRemoved);

  useEffect(() => {
    if (!playing) return;
    if (displayed >= removed) { setPlaying(false); return; }
    const timer = setTimeout(() => setDisplayed(value => value + 1), 700);
    return () => clearTimeout(timer);
  }, [playing, displayed, removed]);

  function play() {
    if (playing) { setPlaying(false); return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(removed);
      return;
    }
    if (displayed >= removed) setDisplayed(0);
    setPlaying(true);
  }

  return <div className="numberline-comparison">
    <p className="numberline-direction"><ArrowLeft size={17} />Kurangi → bergerak ke kiri. Satu lompatan berarti −1.</p>
    {!hidden && <p className="numberline-example">Kiri mulai dari {leftStart}. Kanan mulai dari {rightStart}. {rightRemoved === 0 && removed > 0 ? 'Hanya sisi kiri yang bergerak.' : 'Pengurangan yang sama menggeser kedua penanda dengan jumlah langkah yang sama.'}</p>}
    <p className="numberline-scroll-hint">Geser ke samping untuk melihat seluruh garis.</p>
    <div className="numberline-scroll" tabIndex={0} role="region" aria-label="Dua garis bilangan dengan skala yang sama">
      {[
        { id: 'left', label: 'Sisi kiri', start: leftStart, amount: displayed, color: '#8067bb' },
        { id: 'right', label: 'Sisi kanan', start: rightStart, amount: Math.min(displayed, rightRemoved), color: '#589875' },
      ].map(row => <div className="numberline-row" key={row.id} data-side={row.id}>
        <h4 style={{ color: row.color }}>{row.label}{!hidden && <span>{row.start} − {row.amount} = <b>{row.start - row.amount}</b></span>}</h4>
        <svg viewBox="0 0 640 150" fill="#81708f" role="img" aria-label={hidden ? `${row.label}: garis bilangan untuk membayangkan pengurangan, tanpa hasil ditampilkan.` : `${row.label}: mulai ${row.start}, mundur ${row.amount} langkah, berakhir di ${row.start - row.amount}.`}>
          <defs><marker id={`${marker}-${row.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill={row.color} /></marker></defs>
          <path d="M25 90H615" stroke="#b7a7c8" strokeWidth="2" />
          {Array.from({ length: maximum + 1 }, (_, value) => <g key={value}><path d={`M${position(value)} 85V96`} stroke="#b7a7c8" /><text x={position(value)} y="115" textAnchor="middle">{hidden && value !== 0 ? '' : value}</text></g>)}
          {!hidden && <>
            <text x="320" y="18" textAnchor="middle" fill={row.color}>{row.amount > 0 ? `−${row.amount} : ${row.amount} lompatan ke kiri` : row.id === 'right' && removed > 0 && rightRemoved === 0 ? 'Tetap: sisi kanan tidak dikurangi' : 'Titik awal'}</text>
            <circle cx={position(row.start)} cy="90" r="6" fill="white" stroke={row.color} strokeWidth="2" />
            {Array.from({ length: row.amount }, (_, index) => {
              const from = position(row.start - index), to = position(row.start - index - 1);
              return <g key={index} data-jump={index + 1}><path d={`M${from} 78Q${(from + to) / 2} 37 ${to} 78`} fill="none" stroke={row.color} strokeWidth="2" markerEnd={`url(#${marker}-${row.id})`} /><text x={(from + to) / 2} y="50" textAnchor="middle" fill={row.color}>−1</text></g>;
            })}
            <circle cx={position(row.start - row.amount)} cy="90" r="7" fill={row.color} />
            <text x={position(row.start - row.amount)} y="140" textAnchor="middle" fill={row.color}>Hasil: {row.start - row.amount}</text>
          </>}
          {hidden && <text x="320" y="42" textAnchor="middle">Bayangkan lompatan ke kiri pada kedua garis.</text>}
        </svg>
      </div>)}
    </div>
    {!hidden && <>
      <div className="numberline-playback">
        <button type="button" className="secondary" disabled={removed === 0} onClick={play}>{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? 'Jeda' : displayed < removed ? 'Lanjutkan' : 'Putar langkah'}</button>
        <button type="button" className="secondary" disabled={removed === 0} onClick={() => { setPlaying(false); setDisplayed(0); }}><RotateCcw size={15} />Ulangi dari awal</button>
        <button type="button" className="secondary" disabled={playing || displayed >= removed} onClick={() => setDisplayed(value => value + 1)}>Satu langkah</button>
      </div>
      <p className="numberline-result" role="status">Langkah {displayed} dari {removed}. Kiri: {leftNow}. Kanan: {rightNow}. {leftNow === rightNow ? 'Seimbang: kedua penanda berada pada angka yang sama.' : 'Belum seimbang: kedua penanda berada pada angka berbeda.'}</p>
    </>}
  </div>;
}
