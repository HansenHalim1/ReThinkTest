"""Copy rendered pilots and extract a poster; requires PyAV (a Manim dependency)."""
import shutil
import sys
from pathlib import Path
import av

root = Path(__file__).resolve().parents[2]
output = root / 'public/videos'
output.mkdir(parents=True, exist_ok=True)
for scene, stem in [('Distribution', 'distribution-v1'), ('Quadratic', 'quadratic-v1'), ('Tangent', 'tangent-v1')]:
    matches = list(Path(sys.argv[1]).rglob(scene + '.mp4'))
    if len(matches) != 1:
        raise SystemExit(f'Expected exactly one {scene}.mp4, found {matches}')
    destination = output / (stem + '.mp4')
    shutil.copyfile(matches[0], destination)
    with av.open(str(destination)) as video:
        stream = video.streams.video[0]
        duration = float(stream.duration * stream.time_base)
        frame = None
        for candidate in video.decode(video=0):
            frame = candidate
            if float(candidate.time) >= 4:
                break
        if frame is None:
            raise SystemExit(f'No frames: {destination}')
        frame.to_image().save(output / (stem + '.jpg'), quality=90)
        print(f'{stem}: {stream.width}x{stream.height}, {duration:.2f}s, {destination.stat().st_size} bytes')
