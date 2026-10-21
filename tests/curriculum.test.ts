import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradeLevels, materials, pretestsComplete, publicMaterial } from '../lib/curriculum.ts';

test('SMA access requires both pretests to finish, regardless of their assessment result', () => {
  assert.equal(pretestsComplete({}), false);
  assert.equal(pretestsComplete({ distribution: { stage: 'complete' } }), false);
  assert.equal(pretestsComplete({ distribution: { stage: 'complete' }, inverse: { stage: 'transfer' } }), false);
  assert.equal(pretestsComplete({ distribution: { stage: 'complete' }, inverse: { stage: 'complete' } }), true);
  assert.equal(pretestsComplete({ distribution: { stage: 'visual' }, inverse: { stage: 'complete' } }), false);
});

test('all grades have usable lessons and public curriculum omits quiz answers', () => {
  assert.equal(new Set(materials.map(m => m.id)).size, materials.length);
  for (const grade of gradeLevels) assert.ok(materials.filter(m => m.grade === grade).length >= 6);
  for (const lesson of materials) {
    assert.ok(lesson.explanation.length >= 2 && lesson.formulas.length > 0 && lesson.example.steps.length >= 3);
    assert.equal(lesson.quiz.options.filter(option => option.id === lesson.quiz.correctOption).length, 1);
    assert.equal(new Set(lesson.quiz.options.map(option => option.text)).size, 4);
    const visible = publicMaterial(lesson);
    assert.equal('correctOption' in visible.quiz, false);
    assert.equal('explanation' in visible.quiz, false);
  }
});


test('general and advanced pathways stay distinct with source mapping and deeper examples', () => {
  assert.equal(materials.length, 37);
  assert.equal(materials.filter(m => m.track === 'general').length, 25);
  assert.equal(materials.filter(m => m.track === 'advanced').length, 12);
  for (const m of materials) {
    assert.equal(m.gradePlacement, 'suggested');
    assert.ok(m.additionalExamples.length >= 1 && m.commonMistakes.length >= 1);
    if (m.track === 'advanced') assert.equal(m.phase, 'F');
  }
  assert.equal(new Set(materials.flatMap(m => m.bankTopicIds)).size, 34);
});
