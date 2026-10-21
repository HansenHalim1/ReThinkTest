import fs from 'node:fs';
import path from 'node:path';
import {teachingStories,buildTeachingScene,sceneToSvg} from '../../lib/teaching-scenes.ts';
const root=process.cwd(), output=path.join(root,'media/manim/generated');fs.mkdirSync(output,{recursive:true});
const visuals=path.join(root,'public/videos/visuals');fs.mkdirSync(visuals,{recursive:true});
const frames=teachingStories.map(s=>({...s,scenes:s.stages.map((stage,i)=>{
 const scene=buildTeachingScene(s.topicId,stage.value);
 const name=`${s.topicId}-visual-v1-step-${i+1}.svg`;
 fs.writeFileSync(path.join(visuals,name),sceneToSvg(scene));
 return{...stage,...scene,svgFile:`visuals/${name}`};
})}));
fs.writeFileSync(path.join(output,'teaching-frames.json'),JSON.stringify({version:'2026.10.21-v1',frames},null,2));
console.log(JSON.stringify({topics:frames.length,svgStages:frames.length*4,output:'media/manim/generated/teaching-frames.json'}));
const visualCatalog={schemaVersion:1,catalogVersion:'2026.10.21-v1',visualizations:frames.map(s=>({id:`${s.topicId}-visual-v1`,version:1,topicId:s.topicId,title:s.title,question:s.question,takeaway:s.takeaway,interaction:'stage-selector',width:640,height:240,parameter:s.control,stages:s.scenes.map((scene,index)=>({index,value:scene.value,caption:scene.caption,result:scene.result,svgFile:scene.svgFile}))}))};
fs.writeFileSync(path.join(root,'lib/data/visualization-catalog.v1.json'),JSON.stringify(visualCatalog,null,2));
