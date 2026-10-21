import { test } from 'node:test';
import assert from 'node:assert/strict';
import { materials } from '../lib/curriculum.ts';
import { readVideoCatalog } from '../lib/videos.ts';
import { demoVideoCatalog } from '../lib/demo-videos.ts';

test('demo pilots use the same payload contract as the shared backend', () => {
  for (const id of ['distribution', 'inverse', ...materials.map(m => m.id)]) {
    const data = demoVideoCatalog(id, 'http://localhost:3000');
    assert.equal(data.videos.length, 1);
    assert.ok(readVideoCatalog(data, id));
    assert.match(data.videos[0].videoUrl, /^http:\/\/localhost:3000\/videos\//);
    assert.equal(data.videos[0].hasAudio, false);
    assert.equal('videoFile' in data.videos[0], false);
    if (id !== 'inverse') assert.equal(readVideoCatalog(data, 'inverse'), null);
  }
  assert.deepEqual(demoVideoCatalog('unknown', 'http://localhost:3000').videos, []);
});

test('video response guard rejects unsafe URLs, malformed responses and invalid timelines', () => {
  const original = demoVideoCatalog('distribution', 'https://learn.example.com');
  for (const input of [null, {}, [], { ...original, schemaVersion: 2 }]) assert.equal(readVideoCatalog(input, 'distribution'), null);
  for (const property of ['videoUrl', 'posterUrl', 'captionsUrl']) {
    const data = structuredClone(original);
    Object.assign(data.videos[0], { [property]: 'javascript:alert(1)' });
    assert.equal(readVideoCatalog(data, 'distribution'), null);
  }
  const malformed = structuredClone(original);
  malformed.videos[0].transcript[1].startSeconds = -1;
  assert.equal(readVideoCatalog(malformed, 'distribution'), null);
  const outOfRange = structuredClone(original);
  outOfRange.videos[0].transcript[0].endSeconds = 1000;
  assert.equal(readVideoCatalog(outOfRange, 'distribution'), null);
  const duplicate = structuredClone(original);
  duplicate.videos.push(duplicate.videos[0]);
  assert.equal(readVideoCatalog(duplicate, 'distribution'), null);
});
