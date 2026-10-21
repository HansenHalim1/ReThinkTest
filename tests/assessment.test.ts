import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readAssessmentView } from '../lib/assessment.ts';
const question = { id: 'q1', topicId: 't1', topicTitle: 'Bilangan', difficulty: 1, prompt: 'Hitung.', options: ['a','b','c','d'].map(id => ({ id, text: id })) };
const base = { schemaVersion: 1, bankVersion: 'v1', revision: 0, status: 'not-started', answered: 0, total: 24, topicCount: 8, checklistSaved: false, question, topics: [] };
test('assessment response guard validates progress, question options and completed topic evidence', () => {
  assert.ok(readAssessmentView(base));
  for (const v of [null, {}, { ...base, total: -1 }, { ...base, answered: 25 }, { ...base, status: 'complete' }, { ...base, question: null }, { ...base, question: { ...question, options: [{ id: 'a', text: 'a' }] } }, { ...base, question: { ...question, difficulty: 9 } }]) assert.equal(readAssessmentView(v), null);
  const topics = Array.from({ length: 8 }, (_, i) => ({ id: `t${i}`, title: `Topic ${i}`, correct: 2, total: 3, checked: true, suggestedKnown: true }));
  const complete = { ...base, status: 'complete', answered: 24, revision: 24, question: null, topics };
  assert.ok(readAssessmentView(complete));
  assert.equal(readAssessmentView({ ...complete, topics: [null, ...topics.slice(1)] }), null);
  assert.equal(readAssessmentView({ ...complete, topics: topics.map(t => ({ ...t, correct: 4 })) }), null);
  assert.equal(readAssessmentView({ ...complete, topics: Array(8).fill(topics[0]) }), null);
});
