'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Expand, LockKeyhole, Minus, Plus, X } from 'lucide-react';
import type { ConceptId } from '@/lib/content';
import type { CurriculumProgress } from '@/lib/curriculum';
import { connectedTopics, graphEdges, graphNodes, graphSize, prerequisites, topicGroups, topicTitle } from '@/lib/concept-map';

export default function ConceptMap({ unlocked, completedPretests, progress, loading, error, onRetry, onExplore, onLearn, onPretest }: {
  unlocked: boolean; completedPretests: ConceptId[]; progress: CurriculumProgress; loading: boolean; error: string;
  onRetry: () => void; onExplore: (id: string) => void; onLearn: (id: string) => void; onPretest: (id: ConceptId) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(.85);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const marker = useId().replace(/:/g, '');
  const topic = graphNodes.find(node => node.id === selected);
  const neighbors = selected ? connectedTopics(selected) : null;
  const incoming = selected ? prerequisites[selected] || [] : [];
  const outgoing = graphEdges.filter(edge => edge.source === selected).map(edge => edge.target);
  useEffect(() => {
    const width = viewport.current?.clientWidth || 900;
    const initialZoom = width < 600 ? Math.min(.8, (width - 24) / 464) : Math.min(1, width / graphSize.width);
    setZoom(initialZoom);
    requestAnimationFrame(() => { if (viewport.current) { viewport.current.scrollLeft = 694 * initialZoom - width / 2; viewport.current.scrollTop = 0; } });
  }, []);
  function changeZoom(next: number) {
    const value = Math.max(.2, Math.min(1.5, next));
    const el = viewport.current;
    if (!el) return;
    const x = (el.scrollLeft + el.clientWidth / 2) / zoom;
    const y = (el.scrollTop + el.clientHeight / 2) / zoom;
    setZoom(value);
    requestAnimationFrame(() => { el.scrollLeft = x * value - el.clientWidth / 2; el.scrollTop = y * value - el.clientHeight / 2; });
  }
  function fit() {
    const el = viewport.current;
    if (!el) return;
    setZoom(Math.max(.2, Math.min(el.clientWidth / graphSize.width, el.clientHeight / graphSize.height)));
    el.scrollTo({ left: 0, top: 0 });
  }
  function select(id: string) { setSelected(id); }
  function focusTopic(id: string) {
    select(id);
    const node = graphNodes.find(item => item.id === id);
    if (node && viewport.current) viewport.current.scrollTo({ left: (node.x + graphSize.nodeWidth / 2) * zoom - viewport.current.clientWidth / 2, top: (node.y + graphSize.nodeHeight / 2) * zoom - viewport.current.clientHeight / 2, behavior: 'smooth' });
  }
  function status(id: string) {
    if (id === 'distribution' || id === 'inverse') return completedPretests.includes(id) ? 'Pretest selesai' : 'Pretest awal';
    if (!unlocked) return 'Pretest dulu';
    if (loading || error) return 'Status belum dimuat';
    return progress[id]?.completed ? 'Selesai' : progress[id] ? 'Sudah dicoba' : 'Belum dimulai';
  }
  function complete(id: string) { return id === 'distribution' || id === 'inverse' ? completedPretests.includes(id) : progress[id]?.completed === true; }
  function learn(id: string) { if (id === 'distribution' || id === 'inverse') onPretest(id); else onLearn(id); }
  return <div className="topic-map">
    <div className="page-heading"><div><span className="eyebrow">DARI FONDASI KE PENERAPAN</span><h1>Peta konsep</h1><p>Ikuti garis penghubung untuk melihat bagaimana satu ide membangun ide berikutnya. Pilih simpul untuk menyorot hubungannya.</p></div><span className="edition">20 KONSEP TERHUBUNG</span></div>
    <div className="graph-summary"><span>{completedPretests.length}/2 pretest selesai · {unlocked ? 'Materi SMA terbuka' : 'Selesaikan dua pretest untuk membuka materi SMA'}</span><span className="graph-direction">Konsep prasyarat <span aria-hidden="true">↓</span> Konsep lanjutan</span></div>
    {loading && <p role="status" className="topic-map-status">Memuat kemajuan materi…</p>}
    {error && <div className="notice" role="alert">{error}<button className="text-button" onClick={onRetry}>Coba lagi</button></div>}
    <section className="concept-graph" aria-label="Graf hubungan konsep matematika">
      <div className="graph-toolbar"><div className="graph-legend"><span><i className="graph-dot foundation" />Fondasi</span><span><i className="graph-dot" />Materi SMA</span><span><i className="graph-dot complete" />Selesai</span></div><div className="graph-zoom"><button type="button" className="icon-button" aria-label="Perkecil peta" disabled={zoom <= .2} onClick={() => changeZoom(zoom - .15)}><Minus size={17} /></button><output aria-label="Skala peta">{Math.round(zoom * 100)}%</output><button type="button" className="icon-button" aria-label="Perbesar peta" disabled={zoom >= 1.5} onClick={() => changeZoom(zoom + .15)}><Plus size={17} /></button><button type="button" className="text-button" onClick={fit}><Expand size={15} />Lihat semua</button></div></div>
      <div className="graph-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Peta interaktif. Geser untuk menjelajah, gunakan tombol skala untuk memperbesar, lalu pilih konsep."
        onPointerDown={event => { if (event.pointerType !== 'mouse' || event.button !== 0 || (event.target as Element).closest('button')) return; event.preventDefault(); const el = event.currentTarget; drag.current = { x: event.clientX, y: event.clientY, left: el.scrollLeft, top: el.scrollTop }; el.setPointerCapture(event.pointerId); el.classList.add('dragging'); }}
        onPointerMove={event => { if (!drag.current) return; event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x); event.currentTarget.scrollTop = drag.current.top - (event.clientY - drag.current.y); }}
        onPointerUp={event => { drag.current = null; event.currentTarget.classList.remove('dragging'); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
        onLostPointerCapture={event => { drag.current = null; event.currentTarget.classList.remove('dragging'); }}
        onPointerCancel={event => { drag.current = null; event.currentTarget.classList.remove('dragging'); }}>
        <div className="graph-scaled" style={{ width: graphSize.width * zoom, height: graphSize.height * zoom }}><div className="graph-canvas" style={{ width: graphSize.width, height: graphSize.height, transform: `scale(${zoom})` }}>
          {topicGroups.map((group, index) => <div className="graph-lane" key={group.id} style={{ left: 16, top: 26 + index * 270, width: graphSize.width - 32, height: 226 }}><span>{group.label}</span><small>{group.id === 'foundation' ? 'KENALI TITIK AWALMU' : group.id === 10 ? 'BANGUN BAHASA MATEMATIKA' : group.id === 11 ? 'HUBUNGKAN IDE' : 'TERAPKAN PEMAHAMAN'}</small></div>)}
          <svg className="graph-edges" width={graphSize.width} height={graphSize.height} aria-hidden="true"><defs>{['base','incoming','outgoing'].map(kind => <marker id={`${marker}-${kind}`} key={kind} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L8 4L0 8Z" fill={kind === 'outgoing' ? '#d75335' : kind === 'incoming' ? '#2849ad' : '#929caf'} /></marker>)}</defs>{graphEdges.map((edge,index) => {
            const from = graphNodes.find(node => node.id === edge.source)!;
            const to = graphNodes.find(node => node.id === edge.target)!;
            const sameLevel = from.y === to.y;
            const sx = sameLevel ? from.x + graphSize.nodeWidth + 2 : from.x + graphSize.nodeWidth / 2;
            const sy = sameLevel ? from.y + graphSize.nodeHeight / 2 : from.y + graphSize.nodeHeight + 2;
            const tx = sameLevel ? to.x - 4 : to.x + graphSize.nodeWidth / 2;
            const ty = sameLevel ? to.y + graphSize.nodeHeight / 2 : to.y - 5;
            const bend = sameLevel ? Math.max(35, Math.abs(tx - sx) * .45) : Math.max(50, (ty - sy) * .45);
            const path = sameLevel ? (tx - sx < 60 ? `M${sx} ${sy}L${tx} ${ty}` : `M${sx} ${sy}C${sx+bend} ${sy-150},${tx-bend} ${ty-150},${tx} ${ty}`) : `M${sx} ${sy}C${sx} ${sy+bend},${tx} ${ty-bend},${tx} ${ty}`;
            const kind = edge.target === selected ? 'incoming' : edge.source === selected ? 'outgoing' : 'base';
            return <path key={index} d={path} className={`graph-edge ${kind} ${selected && kind === 'base' ? 'muted' : ''}`} markerEnd={`url(#${marker}-${kind})`} />;
          })}</svg>
          {graphNodes.map(node => <button type="button" key={node.id} className={`graph-node ${node.group === 'foundation' ? 'foundation' : ''} ${complete(node.id) ? 'complete' : ''} ${selected === node.id ? 'selected' : ''} ${neighbors && !neighbors.has(node.id) ? 'dimmed' : ''}`} style={{ left: node.x, top: node.y, width: graphSize.nodeWidth, height: graphSize.nodeHeight }} aria-pressed={selected === node.id} onClick={() => select(node.id)}><span className="graph-node-status">{complete(node.id) ? <CheckCircle2 size={13} /> : !unlocked && node.group !== 'foundation' ? <LockKeyhole size={13} /> : <BookOpen size={13} />}{status(node.id)}</span><strong>{node.title}</strong></button>)}
        </div></div>
      </div>
      <div className="graph-help"><span>Geser peta untuk menjelajah. Pilih konsep untuk menyorot prasyarat dan lanjutannya.</span>{selected && <button type="button" className="text-button" onClick={() => setSelected(null)}>Tampilkan semua hubungan<X size={14} /></button>}</div>
    </section>
    <section className="graph-detail" aria-label="Detail konsep terpilih" aria-live="polite">{topic ? <>
      <div className="graph-detail-heading"><div><span className="eyebrow">{topic.group === 'foundation' ? 'FONDASI' : `KELAS ${topic.group}`} · {status(topic.id)}</span><h2>{topic.title}</h2><p>{topic.summary}</p></div><div className="graph-detail-actions"><button className="secondary" onClick={() => onExplore(topic.id)}>Rumus & visual<ArrowRight size={16} /></button><button className="primary" onClick={() => learn(topic.id)}>{topic.group === 'foundation' ? 'Buka pretest' : unlocked ? 'Buka materi' : 'Kerjakan pretest'}<ArrowRight size={16} /></button></div></div>
      <div className="graph-relations"><div><strong><i className="graph-line incoming" />Bangun dari</strong>{incoming.length ? incoming.map(id => <button className="topic-dependency" key={id} onClick={() => focusTopic(id)}>{topicTitle(id)}<ArrowRight size={12} /></button>) : <p>{topic.group === 'foundation' ? 'Fondasi awal untuk perjalanan belajarmu.' : 'Membaca dan menghitung data sederhana.'}</p>}</div><div><strong><i className="graph-line outgoing" />Lanjutkan ke</strong>{outgoing.length ? outgoing.map(id => <button className="topic-dependency" key={id} onClick={() => focusTopic(id)}>{topicTitle(id)}<ArrowRight size={12} /></button>) : <p>Gunakan konsep ini untuk latihan dan penerapan berikutnya.</p>}</div></div>
    </> : <div className="graph-empty-detail"><BookOpen size={23} /><div><h2>Mulai dari satu konsep.</h2><p>Pilih simpul pada peta untuk melihat hubungan, rumus, dan materi belajarnya.</p></div></div>}</section>
    <p className="graph-footnote">Garis menunjukkan saran prasyarat, bukan syarat tambahan untuk membuka materi. Rumus dan visual dapat dijelajahi kapan saja.</p>
  </div>;
}
