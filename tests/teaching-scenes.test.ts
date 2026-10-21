import { test } from 'node:test';
import assert from 'node:assert/strict';
import { materials } from '../lib/curriculum.ts';
import { buildTeachingScene, sceneToSvg, teachingStories } from '../lib/teaching-scenes.ts';

test('every lesson and foundation reference has four bounded mathematical scenes and a meaningful control',()=>{
 const expected=new Set(['distribution','inverse',...materials.map(m=>m.id)]);
 assert.equal(teachingStories.length,expected.size);
 for(const story of teachingStories){
  assert.ok(expected.has(story.topicId));assert.equal(story.stages.length,4);
  assert.ok(story.control.max>story.control.min&&story.control.step>0);
  for(const value of [story.control.min,story.control.max,...story.stages.map(s=>s.value)]){
   const scene=buildTeachingScene(story.topicId,value);
   assert.ok(scene.result.length>10&&!/NaN|Infinity/.test(scene.result));
   assert.ok(scene.shapes.some(s=>s.kind!=='text'),'Must show a mathematical diagram');
   for(const shape of scene.shapes){
    for(const v of [shape.x,shape.y,shape.w,shape.h,shape.r,shape.size,...(shape.points||[]).flat()].filter(v=>v!==undefined))assert.ok(Number.isFinite(v));
    for(const [x,y]of shape.points||[])assert.ok(x>=0&&x<=640&&y>=0&&y<=240,`${story.topicId} point outside scene`);
   }
   const svg=sceneToSvg(scene);assert.ok(svg.startsWith('<svg'));assert.ok(!svg.includes('<script'));assert.ok(svg.includes('<title>'));
  }
 }
});
test('key model results distinguish undefined values, limits, area, singular matrices and probability assumptions',()=>{
 assert.match(buildTeachingScene('xi-functions',2).result,/tidak terdefinisi/);
 assert.match(buildTeachingScene('advanced-limits',4).result,/2,0001.*f\(1\) tidak terdefinisi/);
 assert.match(buildTeachingScene('advanced-matrices',0).result,/singular, tanpa invers/);
 assert.match(buildTeachingScene('advanced-integrals',4).result,/8 satuan luas/);
 assert.match(buildTeachingScene('advanced-binomial',.4).result,/E\(X\) = 1,6/);
 assert.match(buildTeachingScene('xii-conditional-probability',3).result,/2\/9/);
 assert.match(buildTeachingScene('xii-compound-probability',5).result,/4\/6/);
 assert.match(buildTeachingScene('advanced-polynomials',2).result,/adalah faktor/);
 assert.match(buildTeachingScene('advanced-polynomials',0).result,/bukan faktor/);
 assert.match(buildTeachingScene('advanced-vectors',4).result,/= 5$/);
 assert.match(buildTeachingScene('advanced-normal',2).result,/z = -1/);
 const invalid=buildTeachingScene('advanced-integrals',Number.NaN);assert.equal(invalid.result,buildTeachingScene('advanced-integrals',0).result);
 assert.throws(()=>buildTeachingScene('not-a-topic'));
});
