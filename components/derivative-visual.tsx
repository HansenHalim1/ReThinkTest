'use client';

import { useState } from 'react';
export default function DerivativeVisual() {
  const [h, setH] = useState(1);
  const px = (x: number) => 50 + x * 130;
  const py = (y: number) => 315 - y * 42;
  const curve = Array.from({ length: 101 }, (_, i) => { const x = i * 2.6 / 100; return `${i ? 'L' : 'M'} ${px(x)} ${py(x*x)}`; }).join(' ');
  return <div className="derivative-visual"><p className="explorer-summary">Pada y = x², titik pertama tetap di (1, 1). Dekatkan titik kedua dengan mengurangi h.</p><div className="derivative-graph"><svg viewBox="0 0 450 350" role="img" aria-label={`Kurva y sama dengan x kuadrat. Jarak horizontal h ${h.toFixed(2)}, gradien sekan ${(2+h).toFixed(2)}, gradien singgung 2.`}>
    <path d="M 50 15 V 315 H 425" fill="none" stroke="#aaa0b5" />
    {[0,1,2].map(x => <text key={x} x={px(x)} y={337} textAnchor="middle" fill="currentColor">{x}</text>)}
    <path d={curve} fill="none" stroke="#9470c9" strokeWidth="3" />
    <line x1={px(0.65)} y1={py(0.3)} x2={px(2.35)} y2={py(3.7)} stroke="#369d88" strokeWidth="2" strokeDasharray="6 5" />
    <line x1={px(0.65)} y1={py(1+(2+h)*(-0.35))} x2={px(2.35)} y2={py(1+(2+h)*1.35)} stroke="#ba791d" strokeWidth="2" />
    <circle cx={px(1)} cy={py(1)} r="6" fill="#369d88" /><circle cx={px(1+h)} cy={py((1+h)**2)} r="6" fill="#ba791d" />
    <text x="290" y="45" fill="#9470c9">y = x²</text><text x="65" y="25" fill="currentColor">y</text><text x="425" y="337" fill="currentColor">x</text>
  </svg></div><label className="field-label" htmlFor="secant-distance">Jarak horizontal h: {h.toFixed(2)}</label><input id="secant-distance" type="range" min="0.02" max="1" step="0.02" value={h} onChange={e => setH(Number(e.target.value))} /><p aria-live="polite">Gradien sekan: <strong>{(2+h).toFixed(2)}</strong> · Gradien singgung: <strong>2</strong></p><p className="video-note">Garis emas adalah sekan; garis hijau putus-putus adalah singgung. Saat h mendekati nol, gradien sekan mendekati 2.</p></div>;
}
