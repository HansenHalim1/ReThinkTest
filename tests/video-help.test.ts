import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoExplanation, readVideoHelp } from '../lib/video-help.ts';
import { materials } from '../lib/curriculum.ts';
import { demoVideoCatalog } from '../lib/demo-videos.ts';

test('every public pilot passage has a clearly separate demo explanation', () => {
  for (const topic of ['distribution', 'inverse', ...materials.map(m => m.id)]) {
    const video = demoVideoCatalog(topic, 'https://learn.example.com').videos[0];
    for (let i = 0; i < video.transcript.length; i++) assert.ok(demoExplanation(video.id, i)!.length >= 20);
  }
  assert.equal(demoExplanation('unknown', 0), undefined);
});

test('help responses must match the selected video, version and passage', () => {
  const valid = { videoId: 'distribution-v1', videoVersion: 1, cueIndex: 0, explanation: demoExplanation('distribution-v1', 0), source: 'curated' };
  assert.ok(readVideoHelp(valid, 'distribution-v1', 1, 0));
  assert.ok(readVideoHelp({ ...valid, source: 'gateway', model: 'deepseek/deepseek-v4.1-flash-1017' }, 'distribution-v1', 1, 0));
  for (const bad of [null, {}, { ...valid, cueIndex: 1 }, { ...valid, videoVersion: 2 }, { ...valid, videoId: 'tangent-v1' }, { ...valid, source: 'pretend-ai' }, { ...valid, explanation: 'short' }, { ...valid, reason: 5 }]) assert.equal(readVideoHelp(bad, 'distribution-v1', 1, 0), null);
});
