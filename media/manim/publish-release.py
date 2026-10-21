"""Publish local catalog manifests only after all referenced assets have been validated."""
from pathlib import Path
import json
import shutil
import av
ROOT=Path(__file__).resolve().parents[2]
folder=ROOT/'media/manim/generated'
catalog=json.loads((folder/'video-catalog.release.json').read_text())
explanations=json.loads((folder/'video-explanations.release.json').read_text())
assert len(catalog['videos'])==39 and len({v['topicId'] for v in catalog['videos']})==39
for video in catalog['videos']:
 for name in ['videoFile','posterFile','captionsFile']:assert (ROOT/'public/videos'/video[name]).exists()
 assert len(explanations[video['id']])==len(video['transcript'])
 with av.open(str(ROOT/'public/videos'/video['videoFile'])) as media:
  stream=media.streams.video[0]
  assert stream.codec_context.name=='h264' and abs(float(stream.duration*stream.time_base)-video['durationSeconds'])<.05
for source,target in [('video-catalog.release.json','video-catalog.v1.json'),('video-explanations.release.json','video-explanations.v1.json')]:shutil.copyfile(folder/source,ROOT/'lib/data'/target)
print('Published complete, validated local media catalogs.')
