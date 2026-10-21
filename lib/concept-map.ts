import { concepts } from './content.ts';
import { materials, type GradeLevel } from './curriculum.ts';

// Suggested conceptual relationships, not additional access requirements.
export const prerequisites: Record<string, string[]> = Object.fromEntries(materials.map(m => [m.id, m.prerequisites]));
export const topicGroups: { id: 'foundation' | 'advanced' | GradeLevel; label: string }[] = [
  { id: 'foundation', label: 'Fondasi' }, { id: 10, label: 'Kelas 10 · umum' },
  { id: 11, label: 'Kelas 11 · umum' }, { id: 12, label: 'Kelas 12 · umum' },
  { id: 'advanced', label: 'Tingkat lanjut · pilihan' },
];
export const referenceTopics = [
  ...concepts.map(c => ({ id: c.id as string, title: c.title, summary: c.subtitle, group: 'foundation' as const })),
  ...materials.map(m => ({ id: m.id, title: m.title, summary: m.summary, group: m.track === 'advanced' ? 'advanced' as const : m.grade })),
];
export const topicTitle = (id: string) => referenceTopics.find(topic => topic.id === id)?.title || id;

let laneTop = 26;
export const graphLanes = topicGroups.map(group => {
  const count = referenceTopics.filter(t => t.group === group.id).length;
  const height = 80 + Math.ceil(count / 6) * 128;
  const lane = { ...group, top: laneTop, height };
  laneTop += height + 30;
  return lane;
});
export const graphSize = { width: 1400, height: laneTop, nodeWidth: 202, nodeHeight: 104 };
export const graphNodes = referenceTopics.map(topic => {
  const lane = graphLanes.find(group => group.id === topic.group)!;
  const peers = referenceTopics.filter(peer => peer.group === topic.group);
  const index = peers.findIndex(peer => peer.id === topic.id);
  return { ...topic, x: topic.group === 'foundation' ? 462 + index * 262 : 34 + index % 6 * 226, y: lane.top + 80 + Math.floor(index / 6) * 128 };
});
export const graphEdges = Object.entries(prerequisites).flatMap(([target, sources]) => sources.map(source => ({ source, target })));
export function connectedTopics(id: string) {
  return new Set([id, ...graphEdges.filter(edge => edge.source === id || edge.target === id).flatMap(edge => [edge.source, edge.target])]);
}
