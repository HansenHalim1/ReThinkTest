'use client';
import { useId, useRef, useState } from 'react';
import { buildTeachingScene, sceneToSvg, teachingStories, numberText } from '@/lib/teaching-scenes';

export default function TopicVisualization({ id }: { id: string }) {
 const story=teachingStories.find(s=>s.topicId===id);
 const [value,setValue]=useState(story?.control.initial||0);
 const [stage,setStage]=useState<number|null>(0);
 const controlId=useId();
 const enlarged=useRef<HTMLDialogElement>(null);
 if(!story)return null;
 const scene=buildTeachingScene(id,value);
 return <section className="sma-interactive topic-visualization" aria-label={story.title}>
  <span className="eyebrow">UBAH · AMATI · PAHAMI</span><h2>{story.title}</h2><p>{story.question}</p>
  <div className="teaching-stage-tabs" role="group" aria-label="Contoh bertahap">{story.stages.map((s,i)=><button type="button" key={i} aria-pressed={stage===i} onClick={()=>{setValue(s.value);setStage(i);}}>Langkah {i+1}</button>)}</div>
  <label className="sma-visual-control" htmlFor={controlId}><span>{story.control.label}<output>{numberText(value,4)}</output></span><input id={controlId} type="range" min={story.control.min} max={story.control.max} step={story.control.step} value={value} onChange={e=>{setValue(Number(e.target.value));setStage(null);}} /></label>
  <button type="button" className="text-button teaching-enlarge" onClick={()=>enlarged.current?.showModal()}>Perbesar diagram</button>
  <img className="teaching-diagram" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(sceneToSvg(scene))}`} width="640" height="240" alt={scene.description} />
  <div className="teaching-observation" role="status"><strong>{scene.result}</strong><p>{stage===null?'Amati diagram dan bandingkan hasilnya dengan contoh bertahap.':story.stages[stage].caption}</p></div>
  <dialog ref={enlarged} className="teaching-dialog" aria-labelledby={`${controlId}-diagram-title`}><div className="teaching-dialog-heading"><h2 id={`${controlId}-diagram-title`}>{story.title}</h2><button type="button" className="secondary" onClick={()=>enlarged.current?.close()}>Tutup diagram besar</button></div><p>Geser diagram ke samping jika perlu. Nilai mengikuti contoh yang sedang kamu amati.</p><div className="teaching-dialog-canvas"><img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(sceneToSvg(scene))}`} width="640" height="240" alt={scene.description} /></div><p className="teaching-dialog-result">{scene.result}</p></dialog>
  <p className="teaching-takeaway"><strong>Ingat idenya:</strong> {story.takeaway}</p>
  <button type="button" className="text-button" onClick={()=>{setValue(story.control.initial);setStage(0);}}>Kembalikan contoh awal</button>
 </section>;
}
