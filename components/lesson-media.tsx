'use client';
import { useState } from 'react';
import { Eye, Film } from 'lucide-react';
import SmaConceptVisual from '@/components/sma-concept-visual';
import DerivativeVisual from '@/components/derivative-visual';
import ConceptVideoPanel from '@/components/concept-video';
export default function LessonMedia({topicId,demo}:{topicId:string;demo:boolean}) {
 const[mode,setMode]=useState<'visual'|'video'>('visual');
 return <section className="lesson-media"><h2>Lihat konsepnya bekerja.</h2><p>Ubah nilai untuk mengamati hubungan, atau ikuti satu contoh dalam video.</p><div className="explorer-modes" role="group" aria-label="Media pembelajaran"><button type="button" aria-pressed={mode==='visual'} onClick={()=>setMode('visual')}><Eye size={17}/>Visualisasi</button><button type="button" aria-pressed={mode==='video'} onClick={()=>setMode('video')}><Film size={17}/>Video konsep</button></div>{mode==='video'?<ConceptVideoPanel key={topicId} topicId={topicId} demo={demo}/>:topicId==='advanced-derivatives'?<DerivativeVisual/>:<SmaConceptVisual key={topicId} id={topicId}/>}</section>;
}
