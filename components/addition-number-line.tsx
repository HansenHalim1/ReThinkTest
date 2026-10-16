'use client';

import { useId, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function AdditionNumberLine() {
  const [x, setX] = useState(3);
  const [added, setAdded] = useState(0);
  const id = useId();
  const marker = id.replace(/:/g, '');
  const result = x + added;
  // Keep the scale fixed so moving the slider moves the endpoint, not the axis.
  const position = (value: number) => 35 + value / 24 * 570;

  return <div className="addition-numberline">
    <p className="numberline-direction"><ArrowRight size={17} />Tambah → bergerak ke kanan. Satu lompatan berarti +1.</p>
    <p className="numberline-example">Titik awal berada di <strong>x = {x}</strong>. Geser nilai x untuk memindahkan titik awal, atau ubah bilangan yang ditambahkan untuk mengatur jumlah lompatan.</p>
    <div className="viz-equation" aria-live="polite"><strong className="term-purple">x</strong><span>+</span><strong>{added}</strong><span>=</span><strong className="term-green">{result}</strong></div>
    <p className="numberline-scroll-hint">Geser ke samping untuk melihat seluruh garis.</p>
    <div className="numberline-scroll" tabIndex={0} role="region" aria-label="Garis bilangan penjumlahan dari nol sampai dua puluh empat">
      <div className="numberline-row">
        <svg viewBox="0 0 640 190" fill="#81708f" role="img" aria-label={`Mulai di x = ${x}, maju ${added} lompatan ke kanan, hasil ${result}.`}>
          <defs><marker id={marker} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#8067bb" /></marker></defs>
          <text x="320" y="22" textAnchor="middle" fill="#8067bb">+{added}: {added} lompatan ke kanan</text>
          <path d="M25 95H615" stroke="#b7a7c8" strokeWidth="2" />
          {Array.from({ length: 25 }, (_, value) => <g key={value}><path d={`M${position(value)} 90V101`} stroke="#b7a7c8" /><text x={position(value)} y="120" textAnchor="middle">{value}</text></g>)}
          {Array.from({ length: added }, (_, index) => {
            const from = position(x + index), to = position(x + index + 1);
            return <g key={index} data-jump={index + 1}><path d={`M${from} 83Q${(from + to) / 2} 41 ${to} 83`} fill="none" stroke="#8067bb" strokeWidth="2" markerEnd={`url(#${marker})`} /><text x={(from + to) / 2} y="55" textAnchor="middle" fill="#8067bb">+1</text></g>;
          })}
          <circle data-start="true" cx={position(x)} cy="95" r="9" fill="white" stroke="#8067bb" strokeWidth="3" />
          <circle data-result="true" cx={position(result)} cy="95" r="5" fill="#589875" />
          <text x={position(x)} y="146" textAnchor="middle" fill="#8067bb">x = {x}</text>
          <text x={position(result)} y="172" textAnchor="middle" fill="#589875">Hasil: {result}</text>
        </svg>
      </div>
    </div>
    <div className="viz-controls addition-numberline-control">
      <label className="viz-range" htmlFor={`${id}-x`}><span>Nilai x<b>{x}</b></span><input id={`${id}-x`} type="range" min={0} max={12} value={x} onChange={event => setX(Number(event.target.value))} /></label>
      <label className="viz-range" htmlFor={`${id}-added`}><span>Bilangan yang ditambahkan ke x<b>{added}</b></span><input id={`${id}-added`} type="range" min={0} max={12} value={added} onChange={event => setAdded(Number(event.target.value))} /></label>
    </div>
    <p className="numberline-result" role="status">{x} + {added} = {result}. {added === 0 ? 'Belum ada lompatan: hasil masih di posisi x.' : `Dari x = ${x}, maju ${added} langkah ke kanan sampai ${result}.`}</p>
  </div>;
}
