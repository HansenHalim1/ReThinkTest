"""Render missing films, validate H.264 assets, and build publishable catalogs."""
import concurrent.futures
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import av

ROOT=Path(__file__).resolve().parents[2]
GENERATED=ROOT/'media/manim/generated'
FRAMES=json.loads((GENERATED/'teaching-frames.json').read_text())['frames']
PUBLIC=ROOT/'public/videos'
OLD=json.loads((ROOT/'lib/data/video-catalog.v1.json').read_text())
EXISTING={v['topicId'] for v in OLD['videos']}
# Preserve the original pilot media IDs and transcripts; all missing topics get new assets.
PILOTS={'distribution','x-quadratic','advanced-derivatives'}
EXPLANATIONS=json.loads((ROOT/'lib/data/video-explanations.v1.json').read_text())

def render(story):
 topic=story['topicId'];stem=f'{topic}-film-v1';destination=PUBLIC/f'{stem}.mp4'
 if destination.exists():
  with av.open(str(destination)) as media:
   stream=media.streams.video[0]
   if abs(float(stream.duration*stream.time_base)-36)>.05:raise ValueError(f'Invalid existing clip {topic}')
  return topic
 temp=Path('/tmp/rethink-topic-renders')/topic
 temp.mkdir(parents=True,exist_ok=True)
 env=os.environ.copy();env['RETHINK_FILM_TOPIC']=topic
 log=GENERATED/f'{topic}.render.log'
 cmd=[sys.executable,'-m','manim','render','--renderer','cairo','-r','960,540','--fps','24','--format','mp4','--disable_caching','--media_dir',str(temp),str(ROOT/'media/manim/lesson_films.py'),'LessonFilm']
 with log.open('w') as output:
  subprocess.run(cmd,cwd=ROOT,env=env,stdout=output,stderr=subprocess.STDOUT,check=True)
 matches=list(temp.rglob('LessonFilm.mp4'))
 if len(matches)!=1:raise ValueError(f'Expected one rendered video for {topic}')
 shutil.copyfile(matches[0],destination)
 return topic

def package(story):
 topic=story['topicId'];stem=f'{topic}-film-v1';destination=PUBLIC/f'{stem}.mp4'
 with av.open(str(destination)) as media:
  stream=media.streams.video[0];duration=float(stream.duration*stream.time_base)
  if abs(duration-36)>.05 or stream.width!=960 or stream.height!=540 or stream.codec_context.name!='h264':raise ValueError(f'Invalid encoded video {topic}')
  frame=None
  for candidate in media.decode(video=0):
   frame=candidate
   if candidate.time>=21:break
  frame.to_image().save(PUBLIC/f'{stem}.jpg',quality=92)
 cues=[{'startSeconds':i*9,'endSeconds':(i+1)*9,'text':s['caption']} for i,s in enumerate(story['scenes'])]
 def stamp(t):
  ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
 vtt='WEBVTT\n\n'+'\n\n'.join(f'{i+1}\n{stamp(c["startSeconds"])} --> {stamp(c["endSeconds"]-(.001 if i<3 else 0))}\n{c["text"]}' for i,c in enumerate(cues))+'\n'
 (PUBLIC/f'{stem}.id.vtt').write_text(vtt)
 EXPLANATIONS[stem]=[f'{s["caption"]} {s["result"]}. {story["takeaway"]}' for s in story['scenes']]
 return dict(id=stem,version=1,topicId=topic,skillIds=[f'{topic}.visual-example'],title=story['title'],summary=story['question'],durationSeconds=36,transcript=cues,language='id-ID',renderer='manim-community',hasAudio=False,width=960,height=540,mimeType='video/mp4',videoFile=f'{stem}.mp4',posterFile=f'{stem}.jpg',captionsFile=f'{stem}.id.vtt')

if __name__=='__main__':
 selected=[s for s in FRAMES if s['topicId'] not in PILOTS and (len(sys.argv)==1 or s['topicId'] in sys.argv[1:])]
 workers=int(os.environ.get('RETHINK_RENDER_WORKERS','2'))
 with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
  futures={pool.submit(render,s):s for s in selected}
  for i,future in enumerate(concurrent.futures.as_completed(futures),1):
   print(f'{i}/{len(selected)} rendered: {future.result()}',flush=True)
 if len(sys.argv)>1:
  for s in selected:package(s)
  print('Preview assets packaged; release catalog is unchanged.',flush=True)
 else:
  videos=[v for v in OLD['videos'] if v['topicId'] in PILOTS]+[package(s) for s in FRAMES if s['topicId'] not in PILOTS]
  catalog={'schemaVersion':1,'catalogVersion':'2026.10.21-v2','videos':videos}
  (GENERATED/'video-catalog.release.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
  (GENERATED/'video-explanations.release.json').write_text(json.dumps(EXPLANATIONS,ensure_ascii=False,indent=2)+'\n')
  print(f'Packaged {len(videos)} videos. Publish catalogs after verification.',flush=True)
