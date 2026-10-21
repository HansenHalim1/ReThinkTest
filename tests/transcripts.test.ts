import test from 'node:test';
import assert from 'node:assert/strict';
import {youtubeId,parseCaptions,activeCue,validCues} from '../lib/transcripts.ts';
test('YouTube links normalize without accepting deceptive hosts or arbitrary URLs',()=>{
 for(const link of ['https://youtu.be/dQw4w9WgXcQ?t=3','https://www.youtube.com/watch?v=dQw4w9WgXcQ','https://youtube.com/shorts/dQw4w9WgXcQ','https://m.youtube.com/live/dQw4w9WgXcQ','https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ']) assert.equal(youtubeId(link),'dQw4w9WgXcQ');
 for(const link of ['https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ','https://evil.test/?v=dQw4w9WgXcQ','http://youtube.com/watch?v=dQw4w9WgXcQ','https://user@youtube.com/watch?v=dQw4w9WgXcQ','https://youtube.com/watch?v=short']) assert.equal(youtubeId(link),null);
});
test('SRT and WebVTT preserve actual timings; gaps have no active passage',()=>{
 const srt='1\n00:00:01,250 --> 00:00:03,000\n<b>Mulai</b> dari sini.\n\n2\n00:00:04,000 --> 00:00:06,000\nLangkah kedua.\n';
 const cues=parseCaptions(srt);assert.deepEqual(cues,[{startSeconds:1.25,endSeconds:3,text:'Mulai dari sini.'},{startSeconds:4,endSeconds:6,text:'Langkah kedua.'}]);
 assert.equal(activeCue(cues,1.25),0);assert.equal(activeCue(cues,3),-1);assert.equal(activeCue(cues,4),1);assert.equal(activeCue(cues,6),-1);
 assert.equal(parseCaptions('WEBVTT\n\n00:00.000 --> 00:05.500 align:start\nSatu baris\ndua baris\n')[0].text,'Satu baris dua baris');
 assert.throws(()=>parseCaptions('plain transcript without times'));
 assert.throws(()=>parseCaptions('00:05.000 --> 00:01.000\nTerbalik'));
 assert.equal(validCues([{startSeconds:Infinity,endSeconds:5,text:'s'}]),false);
});
