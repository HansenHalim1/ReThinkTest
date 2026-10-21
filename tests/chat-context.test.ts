import test from 'node:test';
import assert from 'node:assert/strict';
import {youtubeChatContext,MAX_CONTEXT_CHARS,type StudySource} from '../lib/study-chat.ts';
const source:StudySource={kind:'youtube',id:'dQw4w9WgXcQ',title:'Video',transcript:[{startSeconds:0,endSeconds:4,text:'Intro'},{startSeconds:5,endSeconds:10,text:'Current example'}]};
test('automatic context includes full transcript, exact playback snapshot and optional focus',()=>{
 const context=youtubeChatContext(source,6.25);assert.deepEqual(context.transcript,source.transcript);assert.equal(context.playbackSeconds,6.25);assert.equal(context.cueIndex,null);assert.equal(context.transcriptScope,'full');
 assert.equal(youtubeChatContext(source,6.25,0).cueIndex,0);assert.equal(youtubeChatContext(source,6.25,99).cueIndex,null);assert.equal(youtubeChatContext(source,NaN).playbackSeconds,0);
});
test('long transcripts retain current and distant selected passages within request budget',()=>{
 const transcript=Array.from({length:100},(_,i)=>({startSeconds:i*10,endSeconds:i*10+8,text:`Passage ${i}: `+'x'.repeat(1800)}));
 const context=youtubeChatContext({...source,transcript},815.5,2);assert.equal(context.transcriptScope,'excerpt');assert.ok(context.transcript.reduce((n,c)=>n+c.text.length+24,0)<=MAX_CONTEXT_CHARS);assert.ok(context.transcript.some(c=>c.startSeconds===810));assert.equal(context.transcript[context.cueIndex!].startSeconds,20);assert.ok(context.transcript.every((c,i)=>!i || c.startSeconds>=context.transcript[i-1].startSeconds));
});
