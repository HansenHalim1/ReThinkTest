'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageCircle, Send, X, Film, BookOpen } from 'lucide-react';
import { accountRequest } from '@/lib/api';
import { referenceTopics } from '@/lib/concept-map';
import { demoVideoCatalog } from '@/lib/demo-videos';
import { demoExplanation } from '@/lib/video-help';
import { contextText, fromVideo, MAX_CONTEXT_CHARS, activeCue, youtubeChatContext, parseCaptions, timestamp, validCues, youtubeId, type ChatMessage, type StudySource } from '@/lib/study-chat';
import { useStudyChat } from './chat-context';
import StudyVideo, { type StudyVideoHandle } from './study-video';
export default function StudyChat({demo,visible}: {demo:boolean;visible:boolean}) {
  const {context,clear,openVersion} = useStudyChat();
  const [source,setSource] = useState<StudySource | null>(null);
  const [automaticContext,setAutomaticContext] = useState(true);
  const [playbackTime,setPlaybackTime] = useState(0);
  const player=useRef<StudyVideoHandle>(null);
  const onPlaybackTime=useCallback((time:number)=>setPlaybackTime(time),[]);
  const autoSource=automaticContext && source?.kind==='youtube' && source.transcript.length?source:null;
  const activeIndex=source?activeCue(source.transcript,playbackTime):-1;
  const [messages,setMessages] = useState<(ChatMessage & {contextLabel?:string;source?:string})[]>([]);
  const [question,setQuestion] = useState('');
  const [url,setUrl] = useState('');
  const [captions,setCaptions] = useState('');
  const [error,setError] = useState('');
  const [importError,setImportError] = useState('');
  const [loading,setLoading] = useState(false);
  const [busy,setBusy] = useState(false);
  const [language,setLanguage] = useState<'en' | 'id'>('en');
  useEffect(()=>{try {const saved=localStorage.getItem('rethink-caption-language');if(saved==='en' || saved==='id') setLanguage(saved);}catch {}},[]);
  const [topic,setTopic] = useState('distribution');
  const pending=useRef<AbortController | null>(null);
  const importing=useRef<AbortController | null>(null);
  const input=useRef<HTMLTextAreaElement>(null);
  const conversation=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(context) {setSource(context.source);if(context.source.kind==='youtube' && context.source.language) setLanguage(context.source.language);}},[openVersion,context]);
  useEffect(()=>{if(!visible) return;const frame=requestAnimationFrame(()=>{input.current?.focus({preventScroll:true});if(openVersion && window.matchMedia('(max-width: 1100px)').matches) conversation.current?.parentElement?.scrollIntoView({block:'start',behavior:'smooth'});});return ()=>cancelAnimationFrame(frame);},[visible,openVersion]);
  useEffect(()=>{if(visible && conversation.current) conversation.current.scrollTop=conversation.current.scrollHeight;},[messages,visible]);
  useEffect(()=>()=>{pending.current?.abort();importing.current?.abort();},[]);
  async function addYouTube(e:FormEvent) {
    e.preventDefault();if(importing.current) return;
    const id=youtubeId(url);if(!id){setImportError('Masukkan tautan HTTPS YouTube yang valid (watch, youtu.be, Shorts, atau live).');return;}
    await loadYouTubeTranscript(id,language);
  }
  async function loadYouTubeTranscript(id:string,requestedLanguage:'en'|'id') {
    if(importing.current) return;
    clear();setAutomaticContext(true);if(source?.id!==id) setPlaybackTime(0);
    const controller=new AbortController(); importing.current=controller;
    const initial:StudySource={kind:'youtube',id,title:`YouTube · ${id}`,transcript:[],language:requestedLanguage};
    setSource(initial);setCaptions('');setImportError('');setLoading(true);
    try {
      if(demo) throw Error('Masuk untuk mengambil transkrip otomatis, atau impor subtitle SRT / VTT di bawah. Video tetap dapat diputar.');
      const response=await accountRequest('/api/youtube-transcript',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:`https://www.youtube.com/watch?v=${id}`,language:requestedLanguage}),signal:controller.signal});
      const data=await response.json();
      if(!response.ok) throw Error(typeof data.error==='string'?data.error:'Transkrip belum tersedia.');
      if(data.id!==id || data.language!==requestedLanguage || !validCues(data.transcript)) throw Error('Transkrip tidak valid. Impor subtitle berwaktu untuk melanjutkan.');
      if(!controller.signal.aborted) setSource({...initial,title:typeof data.title==='string'?data.title:initial.title,transcript:data.transcript,transcriptOrigin:'provider'});
    } catch(cause) {if(!controller.signal.aborted) setImportError(cause instanceof Error?cause.message:'Transkrip gagal dimuat.');}
    finally {importing.current=null;if(!controller.signal.aborted) setLoading(false);}
  }
  function changeLanguage(next:'en'|'id') {
    if(importing.current || busy) return;
    setLanguage(next);try {localStorage.setItem('rethink-caption-language',next);}catch {}
    if(source?.kind==='youtube') void loadYouTubeTranscript(source.id,next);
  }
  function importCaptions() {
    try {if(!source || source.kind!=='youtube') return;const transcript=parseCaptions(captions);if(context?.source.kind==='youtube' && context.source.id===source.id) clear();setAutomaticContext(true);setSource({...source,transcript,language,transcriptOrigin:'student'});setImportError('');setCaptions('');}
    catch(cause) {setImportError(cause instanceof Error?cause.message:'Subtitle tidak valid.');}
  }
  function loadLesson() {
    if(importing.current) return;
    const video=demoVideoCatalog(topic,window.location.origin).videos[0];
    if(video){clear();setPlaybackTime(0);setSource(fromVideo(video));setImportError('');setCaptions('');}
  }
  async function submit(e:FormEvent) {
    e.preventDefault();if(pending.current || !question.trim()) return;
    if(!autoSource && context && contextText(context).length>MAX_CONTEXT_CHARS){setError('Transkrip terlalu panjang untuk satu pesan. Pilih satu bagian sebagai konteks.');return;}
    const text=question.trim();
    const at=player.current?.currentTime() ?? playbackTime;
    const automatic=autoSource?youtubeChatContext(autoSource,at,context?.source.kind==='youtube' && context.source.id===autoSource.id?context.cueIndex:null):null;
    const label=automatic?`${automatic.title} · Posisi ${timestamp(at)}${automatic.cueIndex!==null?' · Fokus bagian dipilih':''}${automatic.transcriptScope==='excerpt'?' · Cuplikan transkrip':''}`:context?`${context.source.title} · ${context.cueIndex===null?'Seluruh transkrip':timestamp(context.source.transcript[context.cueIndex].startSeconds)}`:undefined;
    const history=messages.slice(-10).map(({role,content})=>({role,content}));
    while(history.reduce((n,m)=>n+m.content.length,0)>24000) history.shift();
    setError('');setQuestion('');setBusy(true);
    setMessages(previous=>[...previous,{role:'user',content:text,contextLabel:label}]);
    const controller=new AbortController();pending.current=controller;
    try {
      if(demo) {
        const explanation=context?.source.kind==='catalog'?demoExplanation(context.source.id,context.cueIndex??0):undefined;
        setMessages(previous=>[...previous,{role:'assistant',content:explanation || 'Ini mode demo. Pilih transkrip video ReThink untuk melihat contoh penjelasan terkurasi. Masuk untuk mengirim pertanyaan bebas atau membahas video YouTube dengan AI.',source:'Contoh terkurasi · bukan jawaban AI'}]);
      } else {
        const selected=automatic || (context?{kind:context.source.kind,id:context.source.id,...(context.source.kind==='catalog'?{version:context.source.version}: {title:context.source.title,transcript:context.cueIndex===null?context.source.transcript:[context.source.transcript[context.cueIndex]]}),cueIndex:context.source.kind==='catalog'?context.cueIndex:null}:null);
        const response=await accountRequest('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:text,messages:history,context:selected}),signal:controller.signal});
        const data=await response.json();
        if(!response.ok) throw Error(typeof data.error==='string'?data.error:'Chatbot belum merespons.');
        if(typeof data.answer!=='string' || data.answer.length>6000 || !data.answer.trim() || !['gateway','curated'].includes(data.source)) throw Error('Jawaban chatbot tidak valid.');
        if(!controller.signal.aborted) setMessages(previous=>[...previous,{role:'assistant',content:data.answer,source:data.source==='gateway'?'AI · DeepSeek':'Penjelasan terkurasi · AI belum tersedia'}]);
      }
    } catch(cause){if(!controller.signal.aborted){setError(cause instanceof Error?cause.message:'Chatbot belum merespons.');setQuestion(text);setMessages(previous=>previous.slice(0,-1));}}
    finally {pending.current=null;if(!controller.signal.aborted) setBusy(false);}
  }
  return <>
    <div className="page-heading"><div><span className="eyebrow">TEMAN BERPIKIR</span><h1>Chatbot belajar</h1><p>Tonton, pilih bagian yang membingungkan, lalu bahas bersama.</p></div></div>
    <div className="chat-layout"><section className="chat-media-column" aria-label="Video belajar"><div className="chat-source-picker"><h2><BookOpen size={19}/>Belajar dari video</h2><label htmlFor="chat-lesson">Video ReThink</label><div className="chat-inline"><select id="chat-lesson" value={topic} disabled={loading} onChange={e=>setTopic(e.target.value)}>{referenceTopics.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select><button type="button" className="secondary" disabled={loading} onClick={loadLesson}>Buka</button></div><label htmlFor="youtube-language">Bahasa subtitle &amp; transkrip YouTube</label><select className="caption-language-select" id="youtube-language" value={language} disabled={loading || busy} onChange={e=>changeLanguage(e.target.value as 'en'|'id')}><option value="en">English</option><option value="id">Bahasa Indonesia</option></select><form onSubmit={addYouTube}><label htmlFor="youtube-url"><Film size={16}/>Atau tautan YouTube</label><div className="chat-inline"><input id="youtube-url" type="url" required maxLength={2048} placeholder="https://www.youtube.com/watch?v=…" value={url} onChange={e=>setUrl(e.target.value)} disabled={loading}/><button className="secondary" disabled={loading}>{loading?'Memuat…':'Tambahkan'}</button></div></form><p className="video-note">Video publik yang mengizinkan penyematan dapat diputar. Transkrip mengikuti bahasa yang dipilih jika tersedia. Bahasa lain tidak dipilih otomatis.</p>{importError && <p className="error" role="alert">{importError}</p>}{loading && <p role="status">Mengambil transkrip berwaktu…</p>}</div>
      {source?<article className="chat-source-card"><h2>{source.title}</h2><StudyVideo key={`${source.kind}-${source.id}`} source={source} selectedCue={context?.source.id===source.id?context.cueIndex:null} visible={visible} captionLanguage={source.language || language} onPlaybackTime={onPlaybackTime} playbackRef={player}/>{source.kind==='youtube' && <details className="subtitle-import"><summary>Impor atau ganti subtitle SRT / VTT</summary><p className="video-note">Tempel subtitle berwaktu milikmu. Waktu subtitle digunakan untuk menyinkronkan video.</p><label htmlFor="caption-text">Isi file subtitle</label><textarea id="caption-text" rows={5} maxLength={250000} value={captions} onChange={e=>setCaptions(e.target.value)} placeholder={'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nPenjelasan konsep pertama.'}/><button className="secondary" type="button" onClick={importCaptions} disabled={loading || !captions.trim()}>Gunakan subtitle</button></details>}</article>:<div className="chat-empty-media"><Film size={36}/><h2>Video dan percakapan, berdampingan</h2><p>Pilih video ReThink atau tambahkan tautan YouTube untuk memulai.</p><button type="button" className="secondary" onClick={loadLesson}>Coba video distributif</button></div>}
    </section><section className="chat-conversation" aria-label="Percakapan chatbot"><header><h2><MessageCircle size={20}/>Ruang tanya</h2><button type="button" className="text-button" disabled={busy || !messages.length} onClick={()=>{setMessages([]);setError('');}}>Hapus percakapan</button></header>
      <div className="chat-messages" ref={conversation} role="log" aria-label="Pesan percakapan" aria-live="polite">{!messages.length && <div className="chat-welcome"><span className="chat-spark">✦</span><h3>Apa yang ingin kamu pahami?</h3><p>Transkrip YouTube dan posisi videomu disertakan otomatis. Kamu juga bisa memilih kalimat tertentu untuk memfokuskan pertanyaan.</p>{['Jelaskan bagian ini langkah demi langkah.','Beri contoh yang lebih sederhana.','Bantu aku mencoba satu soal.'].map(q=><button type="button" key={q} disabled={busy} onClick={()=>{setQuestion(q);input.current?.focus();}}>{q}</button>)}</div>}{messages.map((m,i)=><article key={i} className={`chat-message ${m.role}`}><strong>{m.role==='user'?'Kamu':m.source || 'ReThink'}</strong>{m.contextLabel && <small>Konteks: {m.contextLabel}</small>}<p>{m.content}</p></article>)}{busy && <p className="video-note" role="status">Menyusun penjelasan…</p>}</div>
      <form className="chat-composer" onSubmit={submit}>{source?.kind==='youtube' && !!source.transcript.length && <div className="chat-context-chip auto-video-context"><div><label className="auto-context-toggle"><input type="checkbox" checked={automaticContext} onChange={e=>{setAutomaticContext(e.target.checked);if(!e.target.checked && context?.source.kind==='youtube') clear();}}/>Gunakan konteks video otomatis</label>{autoSource && <><strong>Posisi video · {timestamp(playbackTime)}</strong><small>Transkrip dan posisi saat kamu mengirim pesan disertakan otomatis.</small><p>{activeIndex>=0?source.transcript[activeIndex].text:'Tidak ada kalimat transkrip pada posisi ini; waktu video tetap disertakan.'}</p><small>{source.transcript.reduce((n,c)=>n+c.text.length+24,0)>MAX_CONTEXT_CHARS?'Video panjang: AI menerima cuplikan di sekitar posisi video dan bagian yang kamu pilih.':'AI menerima seluruh transkrip dan bagian yang sedang diputar.'}</small></>}</div></div>}{context && (!autoSource || context.cueIndex!==null) && <div className="chat-context-chip"><div><strong>{autoSource?'Fokus bagian yang dipilih':'Konteks untuk pesan berikutnya'}</strong><small>{context.source.title} · {context.cueIndex===null?'Seluruh transkrip':timestamp(context.source.transcript[context.cueIndex].startSeconds)}</small><p>{contextText(context).slice(0,220)}{contextText(context).length>220?'…':''}</p><button type="button" className="text-button" onClick={()=>setSource(context.source)}>Tampilkan video konteks</button></div><button type="button" className="icon-button" aria-label={autoSource?'Hapus fokus bagian':'Hapus konteks'} onClick={clear}><X size={17}/></button></div>}{error && <p className="error" role="alert">{error}</p>}<label htmlFor="chat-question">Pertanyaanmu</label><textarea ref={input} id="chat-question" required rows={3} maxLength={1600} value={question} disabled={busy} onChange={e=>setQuestion(e.target.value)} placeholder="Bagian mana yang belum kamu pahami?"/><div className="chat-composer-footer"><small>{demo?'Mode demo · contoh terkurasi':'Pertanyaan, riwayat terbaru, dan konteks dikirim ke layanan AI.'} Percakapan tersedia selama halaman ini terbuka.</small><button className="primary" type="submit" disabled={busy || !question.trim()}><Send size={16}/>{busy?'Mengirim…':'Kirim'}</button></div></form>
    </section></div>
  </>;
}
