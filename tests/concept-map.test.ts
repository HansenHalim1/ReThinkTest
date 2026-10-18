import { test } from 'node:test';
import assert from 'node:assert/strict';
import { materials } from '../lib/curriculum.ts';
import { prerequisites, referenceTopics } from '../lib/concept-map.ts';

test('every SMA material is discoverable and suggested prerequisites form an acyclic graph', () => {
  const ids = new Set(referenceTopics.map(topic => topic.id));
  assert.equal(ids.size, materials.length + 2);
  assert.deepEqual(new Set(Object.keys(prerequisites)), new Set(materials.map(m => m.id)));
  function visit(id: string, path = new Set<string>()) {
    assert.ok(ids.has(id), `Unknown topic ${id}`);
    assert.equal(path.has(id), false, `Circular prerequisite at ${id}`);
    for (const dependency of prerequisites[id] || []) visit(dependency, new Set([...path, id]));
  }
  for (const topic of referenceTopics) visit(topic.id);
});

test('graph layout contains all topics, keeps nodes inside its canvas and connects only known nodes', async () => {
  const { graphEdges, graphNodes, graphSize, connectedTopics } = await import('../lib/concept-map.ts');
  assert.equal(graphNodes.length, referenceTopics.length);
  for (const node of graphNodes) {
    assert.ok(node.x >= 0 && node.y >= 0);
    assert.ok(node.x + graphSize.nodeWidth <= graphSize.width);
    assert.ok(node.y + graphSize.nodeHeight <= graphSize.height);
    for (const other of graphNodes.filter(other => other.id !== node.id)) {
      assert.ok(node.x + graphSize.nodeWidth <= other.x || other.x + graphSize.nodeWidth <= node.x || node.y + graphSize.nodeHeight <= other.y || other.y + graphSize.nodeHeight <= node.y, `Overlapping nodes: ${node.id}, ${other.id}`);
    }
  }
  assert.equal(graphEdges.length, Object.values(prerequisites).flat().length);
  for (const edge of graphEdges) assert.ok(graphNodes.some(n => n.id === edge.source) && graphNodes.some(n => n.id === edge.target));
  const neighbors = connectedTopics('x-linear');
  assert.ok(neighbors.has('inverse') && neighbors.has('x-quadratic') && neighbors.has('xi-functions'));
  assert.equal(neighbors.has('x-statistics'), false);
});


test('graph flows vertically from foundations through grades 10, 11 and 12', async () => {
  const { graphNodes } = await import('../lib/concept-map.ts');
  const groups = ['foundation', 10, 11, 12];
  for (let index = 1; index < groups.length; index++) {
    const above = graphNodes.filter(node => node.group === groups[index - 1]);
    const below = graphNodes.filter(node => node.group === groups[index]);
    assert.ok(Math.max(...above.map(node => node.y)) < Math.min(...below.map(node => node.y)));
  }
});
