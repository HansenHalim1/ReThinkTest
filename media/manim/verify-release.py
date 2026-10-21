"""Decode and validate the entire authored media release; build QA contact sheets."""
import json
from pathlib import Path
import av
from PIL import Image, ImageDraw, ImageFont, ImageStat
ROOT=Path(__file__).resolve().parents[2]
bank=json.loads((ROOT/'lib/data/video-catalog.v1.json').read_text())
output=ROOT/'test-results/media-release';output.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14) if Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf').exists() else ImageFont.load_default()
posters=[];total=0;results=[]
for v in bank['videos']:
 file=ROOT/'public/videos'/v['videoFile'];total+=file.stat().st_size
 with av.open(str(file)) as media:
  stream=media.streams.video[0];duration=float(stream.duration*stream.time_base)
  assert stream.codec_context.name=='h264' and stream.width==960 and stream.height==540
  assert stream.codec_context.format.name=='yuv420p'
  assert float(stream.average_rate)==24
  assert abs(duration-v['durationSeconds'])<.05
  assert not media.streams.audio
  checkpoints=[duration*(i+.5)/4 for i in range(4)];images=[]
  decoded=0
  for frame in media.decode(video=0):
   decoded+=1
   if checkpoints and frame.time>=checkpoints[0]:
    image=frame.to_image();assert max(ImageStat.Stat(image).stddev)>8, f'Blank frame {v["id"]}'
    images.append(image);checkpoints.pop(0)

  assert len(images)==4
  assert decoded==round(duration*24)
  captions=(ROOT/'public/videos'/v['captionsFile']).read_text();assert captions.startswith('WEBVTT\n')
  for cue in v['transcript']:assert cue['text'] in captions
  tile=Image.new('RGB',(320,205),'#fffdf6');tile.paste(images[2].resize((320,180)),(0,25));ImageDraw.Draw(tile).text((5,5),v['topicId'],font=font,fill='#172b66');posters.append(tile)
  results.append({'topicId':v['topicId'],'seconds':duration,'bytes':file.stat().st_size,'decodedSamples':len(images),'decodedFrames':decoded})
for start in range(0,len(posters),12):
 tiles=posters[start:start+12];sheet=Image.new('RGB',(960,205*((len(tiles)+2)//3)),'white')
 for i,tile in enumerate(tiles):sheet.paste(tile,((i%3)*320,(i//3)*205))
 sheet.save(output/f'contact-{start//12+1}.jpg',quality=94)
(output/'verification.json').write_text(json.dumps({'topics':len(results),'totalVideoBytes':total,'results':results},indent=2))
print(json.dumps({'validatedVideos':len(results),'decodedSamples':len(results)*4,'totalVideoMB':round(total/1e6,2),'format':'H.264 yuv420p 960x540','audio':False}),flush=True)
