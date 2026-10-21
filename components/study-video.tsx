'use client';
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { MessageCircle, Plus } from 'lucide-react';
import { activeCue, timestamp, type StudySource } from '@/lib/study-chat';
import { useStudyChat } from './chat-context';
export type StudyVideoHandle = { currentTime: () => number };
type YTPlayer = { getCurrentTime: () => number; seekTo: (time: number, allow: boolean) => void; pauseVideo: () => void; destroy: () => void };
type YTAPI = { Player: new (element: HTMLElement, config: object) => YTPlayer };
declare global { interface Window { YT?: YTAPI; onYouTubeIframeAPIReady?: () => void } }
let youtubeLoading: Promise<YTAPI> | undefined;
function loadYouTube(): Promise<YTAPI> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeLoading) return youtubeLoading;
  youtubeLoading = new Promise((resolve,reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    const timeout = setTimeout(()=>{youtubeLoading=undefined;reject(Error('YouTube tidak merespons. Coba muat ulang.'));},15000);
    window.onYouTubeIframeAPIReady = () => {clearTimeout(timeout); previous?.(); if(window.YT) resolve(window.YT);};
    const script = document.createElement('script'); script.src='https://www.youtube.com/iframe_api';
    script.onerror=()=>{clearTimeout(timeout); youtubeLoading=undefined; reject(Error('Player YouTube gagal dimuat.'));};
    document.head.appendChild(script);
  });
  return youtubeLoading;
}
export default function StudyVideo({source, selectedCue = null, onAsk, visible = true, captionLanguage = 'en', onPlaybackTime, playbackRef}: { source: StudySource; selectedCue?: number | null; onAsk?: (index:number)=>void; visible?: boolean; captionLanguage?: 'en' | 'id'; onPlaybackTime?: (time:number)=>void; playbackRef?: Ref<StudyVideoHandle> }) {
  const {attach} = useStudyChat();
  const video = useRef<HTMLVideoElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const resumeAt = useRef(selectedCue===null?0:source.transcript[selectedCue]?.startSeconds || 0);
  const [time,setTime] = useState(0);
  useImperativeHandle(playbackRef,()=>({currentTime(){const at=source.kind==='youtube'?(typeof yt.current?.getCurrentTime==='function'?yt.current.getCurrentTime():undefined):video.current?.currentTime;return typeof at==='number' && Number.isFinite(at)?Math.max(0,Math.min(86400,at)):resumeAt.current;}}),[source.kind]);
  useEffect(()=>{onPlaybackTime?.(time);},[time,onPlaybackTime]);
  const [selection,setSelection] = useState<number | null>(selectedCue);
  const [error,setError] = useState('');
  const [retry,setRetry] = useState(0);
  const [follow,setFollow] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const active = activeCue(source.transcript,time);
  useEffect(()=> {
    if (source.kind !== 'youtube' || !container.current) return;
    let cancelled=false, timer: ReturnType<typeof setInterval> | undefined;
    const host = document.createElement('div');container.current.appendChild(host);
    void loadYouTube().then(api=> {
      if(cancelled) return;
      yt.current = new api.Player(host,{ host:'https://www.youtube-nocookie.com',videoId:source.id,width:'100%',height:'100%',playerVars:{origin:window.location.origin,playsinline:1,rel:0,hl:captionLanguage,cc_lang_pref:captionLanguage,cc_load_policy:1},events:{onReady:()=>{ if(cancelled) return; if(resumeAt.current) yt.current?.seekTo(resumeAt.current,true); timer=setInterval(()=>{if(yt.current) {const at=yt.current.getCurrentTime();resumeAt.current=at;setTime(at);}},250);},onError:()=>setError('Video tidak dapat diputar. Pemilik mungkin membatasi penyematan atau akses video.')}});
    }).catch(e=>{if(!cancelled) setError(e.message);});
    return ()=>{cancelled=true;clearInterval(timer);yt.current?.destroy();yt.current=null;host.remove();};
  // Source changes remount this component through its key.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[source.kind,source.id,retry,captionLanguage]);
  useEffect(()=> {if(!visible) {video.current?.pause();yt.current?.pauseVideo();}},[visible]);
  useEffect(()=>{if(selectedCue !== null && source.transcript[selectedCue]) {setSelection(selectedCue);const at=source.transcript[selectedCue].startSeconds;if(video.current) video.current.currentTime=at;yt.current?.seekTo(at,true);resumeAt.current=at;setTime(at);}else setSelection(null);},[selectedCue,source.transcript]);
  useEffect(()=>{if(follow && active>=0) list.current?.querySelector(`[data-cue="${active}"]`)?.scrollIntoView({block:'nearest',behavior:'smooth'});},[active,follow]);
  function seek(index:number) { const at=source.transcript[index].startSeconds;setSelection(index);resumeAt.current=at;setTime(at);if(video.current) video.current.currentTime=at;yt.current?.seekTo(at,true); }
  return <section className="study-video" aria-label={`Video dan transkrip ${source.title}`}>
    {source.kind === 'catalog' && source.video ? <video ref={video} className="concept-video-player" controls playsInline preload="metadata" crossOrigin="anonymous" poster={source.video.posterUrl} aria-label={source.title} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onSeeked={e=>setTime(e.currentTarget.currentTime)} onError={()=>setError('Video gagal dimuat. Coba muat ulang atau baca transkrip.')}><source src={source.video.videoUrl} type="video/mp4"/><track kind="captions" src={source.video.captionsUrl} srcLang={source.video.language} label="Bahasa Indonesia" default /></video> : <div className="youtube-player" ref={container}/>}
    {error && <p className="error" role="alert">{error} <button type="button" className="text-button" onClick={()=>{setError('');if(source.kind==='youtube') setRetry(n=>n+1);else video.current?.load();}}>Coba lagi</button></p>}
    <div className="study-transcript-heading"><h3>Transkrip video</h3><label><input type="checkbox" checked={follow} onChange={e=>setFollow(e.target.checked)}/> Ikuti pemutaran</label></div>
    <p className="video-note">{source.kind==='youtube' && onPlaybackTime?'Konteks otomatis tersedia di chatbot. Klik kalimat untuk menuju bagian video atau pilih fokus khusus.':'Klik kalimat untuk menuju bagian video, lalu tambahkan sebagai konteks chatbot.'}</p>
    <p className="video-note">Bahasa subtitle: {source.kind==='catalog'?'Bahasa Indonesia':captionLanguage==='id'?'Bahasa Indonesia':'English'}.{source.kind==='youtube' && ' Ubah pilihan bahasa di atas. YouTube dapat menampilkan trek lain jika bahasa ini tidak tersedia; periksa menu CC / Settings pada player.'}</p>
    {source.transcriptOrigin === 'student' && <p className="video-note">Subtitle yang kamu impor. Kesesuaiannya dengan video belum diverifikasi.</p>}
    <div className="study-transcript" ref={list} role="region" aria-label="Transkrip tersinkron" tabIndex={0}>{source.transcript.map((cue,index)=><button type="button" key={`${cue.startSeconds}-${index}`} data-cue={index} className={`study-cue ${active===index?'playing':''} ${selection===index?'selected':''}`} aria-current={active===index?'true':undefined} aria-pressed={selection===index} onClick={()=>seek(index)}><time>{timestamp(cue.startSeconds)}</time><span>{cue.text}</span>{active===index && <small>Sedang diputar</small>}</button>)}{!source.transcript.length && <p>Tambahkan subtitle untuk melihat transkrip dan memilih konteks.</p>}</div>
    {selection!==null && source.transcript[selection] && <div className="transcript-selection"><strong>Bagian dipilih · {timestamp(source.transcript[selection].startSeconds)}</strong><p>{source.transcript[selection].text}</p><div className="chat-actions"><button className="primary" type="button" onClick={()=>{video.current?.pause();yt.current?.pauseVideo();attach({source,cueIndex:selection});}}><Plus size={16}/>Tambahkan bagian ke chatbot</button>{onAsk && <button type="button" className="secondary" onClick={()=>{video.current?.pause();onAsk(selection);}}><MessageCircle size={16}/>Penjelasan cepat</button>}</div></div>}
    {!!source.transcript.length && <button type="button" className="text-button" onClick={()=>{video.current?.pause();yt.current?.pauseVideo();attach({source,cueIndex:null});}}><Plus size={16}/>Gunakan seluruh transkrip sebagai konteks</button>}
  </section>;
}
