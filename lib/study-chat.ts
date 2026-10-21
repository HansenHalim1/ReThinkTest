import type { ConceptVideo, TranscriptCue } from './videos.ts';
export type StudySource = { kind: 'catalog' | 'youtube'; id: string; version?: number; title: string; transcript: TranscriptCue[]; video?: ConceptVideo; language?: 'en' | 'id'; transcriptOrigin?: 'provider' | 'student' };
export type ChatContext = { source: StudySource; cueIndex: number | null };
export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export const MAX_CONTEXT_CHARS = 24000;
export function fromVideo(video: ConceptVideo): StudySource { return { kind: 'catalog', id: video.id, version: video.version, title: video.title, transcript: video.transcript, video }; }
export { youtubeId, activeCue, timestamp, validCues, parseCaptions } from './transcripts.ts';
import { timestamp } from './transcripts.ts';
export function contextText(context: ChatContext): string {
  return (context.cueIndex === null ? context.source.transcript : context.source.transcript.slice(context.cueIndex, context.cueIndex+1)).map(c => `[${timestamp(c.startSeconds)}] ${c.text}`).join('\n');
}

export type YouTubeChatContext = { kind:'youtube'; id:string; title:string; transcript:TranscriptCue[]; cueIndex:number|null; playbackSeconds:number; transcriptScope:'full'|'excerpt' };
// Keep the active passage and explicit focus for long videos; fill the budget with nearby cues.
export function youtubeChatContext(source:StudySource, playbackSeconds:number, focusIndex:number|null=null):YouTubeChatContext {
  const time=Number.isFinite(playbackSeconds)?Math.min(86400,Math.max(0,playbackSeconds)):0;
  const cues=source.transcript;
  const focus=focusIndex!==null && Number.isSafeInteger(focusIndex) && cues[focusIndex]?focusIndex:null;
  const full=cues.reduce((n,c)=>n+c.text.length+24,0)<=MAX_CONTEXT_CHARS;
  let indices=cues.map((_,i)=>i);
  if(!full){
    let anchor=cues.findIndex(c=>time<c.endSeconds);if(anchor<0) anchor=Math.max(0,cues.length-1);
    const kept=new Set<number>();let size=0;
    function add(i:number){if(i<0 || i>=cues.length || kept.has(i))return;const cost=cues[i].text.length+24;if(size+cost<=MAX_CONTEXT_CHARS){kept.add(i);size+=cost;}}
    add(anchor);if(focus!==null)add(focus);
    for(let distance=1;distance<cues.length;distance++){add(anchor-distance);add(anchor+distance);if(focus!==null){add(focus-distance);add(focus+distance);}}
    indices=[...kept].sort((a,b)=>a-b);
  }
  return {kind:'youtube',id:source.id,title:source.title,transcript:indices.map(i=>cues[i]),cueIndex:focus===null?null:indices.indexOf(focus),playbackSeconds:time,transcriptScope:full?'full':'excerpt'};
}
