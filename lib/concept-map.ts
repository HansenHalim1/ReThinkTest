import { concepts } from './content.ts';
import { materials, type GradeLevel } from './curriculum.ts';

// Suggested conceptual relationships, not additional access requirements.
export const prerequisites: Record<string, string[]> = {
  'x-exponents': ['distribution', 'inverse'],
  'x-linear': ['inverse'],
  'x-quadratic': ['distribution', 'x-linear'],
  'x-trigonometry': ['x-linear'],
  'x-statistics': [],
  'x-probability': ['x-statistics'],
  'xi-functions': ['x-linear'],
  'xi-composition': ['xi-functions', 'inverse'],
  'xi-transformations': ['xi-functions', 'x-quadratic'],
  'xi-circles': ['x-trigonometry'],
  'xi-bivariate': ['x-statistics'],
  'xi-regression': ['xi-bivariate', 'x-linear'],
  'xii-sequences': ['x-exponents'],
  'xii-interest': ['x-exponents', 'xii-sequences'],
  'xii-annuities': ['xii-interest', 'x-linear'],
  'xii-counting': ['x-probability'],
  'xii-combinatorics': ['xii-counting'],
  'xii-compound-probability': ['x-probability', 'xii-combinatorics'],
};
export const topicGroups: { id: 'foundation' | GradeLevel; label: string }[] = [
  { id: 'foundation', label: 'Fondasi' }, { id: 10, label: 'Kelas 10' }, { id: 11, label: 'Kelas 11' }, { id: 12, label: 'Kelas 12' },
];
export const referenceTopics = [
  ...concepts.map(c => ({ id: c.id as string, title: c.title, summary: c.subtitle, group: 'foundation' as const })),
  ...materials.map(m => ({ id: m.id, title: m.title, summary: m.summary, group: m.grade })),
];
export const topicTitle = (id: string) => referenceTopics.find(topic => topic.id === id)?.title || id;

export const graphSize = { width: 1400, height: 1180, nodeWidth: 202, nodeHeight: 104 };
export const graphNodes = referenceTopics.map(topic => {
  const groupIndex = topicGroups.findIndex(group => group.id === topic.group);
  const peers = referenceTopics.filter(peer => peer.group === topic.group);
  const index = peers.findIndex(peer => peer.id === topic.id);
  return { ...topic, x: topic.group === 'foundation' ? 462 + index * 262 : 34 + index * 226, y: 120 + groupIndex * 270 };
});
export const graphEdges = Object.entries(prerequisites).flatMap(([target, sources]) => sources.map(source => ({ source, target })));
export function connectedTopics(id: string) {
  return new Set([id, ...graphEdges.filter(edge => edge.source === id || edge.target === id).flatMap(edge => [edge.source, edge.target])]);
}
