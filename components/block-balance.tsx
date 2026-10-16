'use client';

import { useId, useState } from 'react';

export default function BlockBalance() {
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);
  const [xInput, setXInput] = useState('0');
  const [xValue, setXValue] = useState(0);
  const id = useId();
  const validX = /^\d+$/.test(xInput) && Number(xInput) <= 12;
  const leftWeight = left + xValue;
  const angle = Math.max(-18, Math.min(18, (right - leftWeight) * 3));
  const radians = angle * Math.PI / 180;
  const status = leftWeight === right ? 'Seimbang' : leftWeight > right ? 'Kiri lebih berat' : 'Kanan lebih berat';
  const comparison = leftWeight === right ? '=' : leftWeight > right ? '>' : '<';

  return <div className="block-balance">
    <p className="block-balance-intro">Setiap balok satuan memiliki berat yang sama. Geser slider kiri atau kanan untuk menambahkan balok ke sisi tersebut.</p>
    <div className="viz-equation" aria-hidden="true"><strong className="term-purple">{`${xValue} + ${left}`}</strong><span>{comparison}</span><strong className="term-green">{right}</strong></div>
    <svg className="viz-diagram block-balance-diagram" viewBox="0 0 460 290" role="img" aria-label={`${status}. Kiri ${left} balok ditambah x = ${xValue}, total ${leftWeight}, kanan ${right} balok. Sisi yang lebih berat turun.`}>
      <path d="M230 108L193 241H267Z" fill="#e8e1f4" stroke="#b3a0cd" /><rect x="163" y="242" width="134" height="8" rx="4" fill="#b3a0cd" />
      <path className="scale-beam" transform={`rotate(${angle} 230 100)`} d="M90 100H370" stroke="#ad99c8" strokeWidth="7" strokeLinecap="round" />
      {[
        { side: 'left', label: 'Kiri', count: left, direction: -1, color: '#8067bb', fill: '#e7dcf7' },
        { side: 'right', label: 'Kanan', count: right, direction: 1, color: '#589875', fill: '#dbede1' },
      ].map(pan => {
        const x = 230 + pan.direction * 140 * Math.cos(radians);
        const y = 100 + pan.direction * 140 * Math.sin(radians);
        return <g key={pan.side} data-pan={pan.side} transform={`translate(${x} ${y})`} className="block-balance-pan">
          <path d="M0 0L-48 64M0 0L48 64" fill="none" stroke={pan.color} strokeWidth="2" />
          <path d="M-51 65Q0 96 51 65Z" fill={pan.fill} stroke={pan.color} strokeWidth="2" />
          {pan.side === 'left' && <g data-x-block="true"><rect x="-47" y="23" width="25" height="40" rx="4" fill="#ccb7e9" stroke={pan.color} strokeWidth="1.5" /><text x="-34.5" y="39" textAnchor="middle" className="diagram-caption term-purple">x</text><text x="-34.5" y="55" textAnchor="middle" className="diagram-caption term-purple">{xValue}</text></g>}
          {Array.from({ length: pan.count }, (_, index) => <rect data-block="true" key={index} x={(pan.side === 'left' ? -15 : -28) + (index % 3) * (pan.side === 'left' ? 18 : 20)} y={47 - Math.floor(index / 3) * 17} width="16" height="16" rx="3" fill={pan.fill} stroke={pan.color} strokeWidth="1.5" />)}
          <text x="0" y="109" textAnchor="middle" className={`diagram-caption ${pan.side === 'left' ? 'term-purple' : 'term-green'}`}>{pan.label}: {pan.side === 'left' ? `${xValue} + ${left} = ${leftWeight}` : `${pan.count} balok`}</text>
        </g>;
      })}
      <circle cx="230" cy="100" r="8" fill="#8468b1" />
    </svg>
    <div className="viz-controls two-controls">
      <div className="block-left-controls">
        <label className="viz-range" htmlFor={`${id}-left`}><span>Jumlah balok kiri<b>{left}</b></span><input id={`${id}-left`} type="range" min={0} max={12} value={left} onChange={event => setLeft(Number(event.target.value))} /></label>
        <div id={`${id}-x-panel`} className="block-x-panel">
          <label htmlFor={`${id}-x`}>Nilai x</label>
          <input id={`${id}-x`} type="number" min={0} max={12} step={1} inputMode="numeric" value={xInput} aria-invalid={!validX} aria-describedby={`${id}-x-help${!validX ? ` ${id}-x-error` : ''}`} onChange={event => {
            const value = event.target.value;
            setXInput(value);
            if (/^\d+$/.test(value) && Number(value) <= 12) setXValue(Number(value));
          }} />
          <p id={`${id}-x-help`}>Isi bilangan bulat 0–12. Berat balok x mengikuti nilai yang kamu coba.</p>
          {!validX && <p id={`${id}-x-error`} className="error" role="alert">Isi nilai x yang valid. Timbangan masih memakai x = {xValue}.</p>}
          <p className="block-x-target">Cari nilai x agar <strong>x + {left} = {right}</strong>.</p>
          {left > right && <p className="block-x-hint">Balok kiri sudah lebih banyak. Kurangi balok kiri atau tambah balok kanan agar ada nilai x ≥ 0 yang bisa menyeimbangkan.</p>}
        </div>
      </div>
      <label className="viz-range" htmlFor={`${id}-right`}><span>Jumlah balok kanan<b>{right}</b></span><input id={`${id}-right`} type="range" min={0} max={12} value={right} onChange={event => setRight(Number(event.target.value))} /></label>
    </div>
    <p className={`viz-observation ${leftWeight !== right ? 'unbalanced' : ''}`} role="status"><strong>{status}: {leftWeight} {comparison} {right}.</strong> {!validX ? 'Isi nilai x untuk melanjutkan percobaan.' : leftWeight === right ? `Nilai x = ${xValue} membuat kedua sisi sama berat!` : 'Coba ubah nilai x sampai kedua sisi sama berat.'}</p>
  </div>;
}
