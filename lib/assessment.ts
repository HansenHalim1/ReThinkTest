export type AssessmentView = {
  schemaVersion: number; bankVersion: string; revision: number;
  status: 'not-started' | 'in-progress' | 'complete'; answered: number; total: number; topicCount: number; checklistSaved: boolean;
  question: null | { id: string; topicId: string; topicTitle: string; difficulty: number; prompt: string; options: { id: string; text: string }[] };
  topics: { id: string; title: string; correct: number; total: number; suggestedKnown: boolean; checked: boolean }[];
  demoSession?: unknown;
};
export function readAssessmentView(value: unknown): AssessmentView | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as AssessmentView;
  if (v.schemaVersion !== 1 || typeof v.bankVersion !== 'string' || !Number.isSafeInteger(v.revision) || v.revision < 0 || !Number.isSafeInteger(v.total) || v.total < 1 || v.total > 100 || !Number.isSafeInteger(v.answered) || v.answered < 0 || v.answered > v.total || !Number.isSafeInteger(v.topicCount) || v.topicCount < 1 || typeof v.checklistSaved !== 'boolean' || !['not-started', 'in-progress', 'complete'].includes(v.status) || !Array.isArray(v.topics)) return null;
  if (v.status === 'complete') {
    if (v.answered !== v.total || v.question !== null || v.topics.length !== v.topicCount || new Set(v.topics.map(t => t?.id)).size !== v.topicCount || v.topics.some(t => !t || typeof t.id !== 'string' || typeof t.title !== 'string' || typeof t.checked !== 'boolean' || typeof t.suggestedKnown !== 'boolean' || !Number.isSafeInteger(t.correct) || !Number.isSafeInteger(t.total) || t.total < 1 || t.correct < 0 || t.correct > t.total)) return null;
  } else {
    const q = v.question;
    if (v.answered === v.total || (v.status === 'not-started') !== (v.answered === 0) || v.topics.length || !q || typeof q.id !== 'string' || typeof q.topicId !== 'string' || typeof q.topicTitle !== 'string' || typeof q.prompt !== 'string' || ![1, 2, 3].includes(q.difficulty) || !Array.isArray(q.options) || q.options.length !== 4 || q.options.some(o => !o || typeof o.id !== 'string' || typeof o.text !== 'string') || new Set(q.options.map(o => o.id)).size !== 4) return null;
  }
  return v;
}
