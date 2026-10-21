# Manim concept video sources

The complete release has 39 videos: the three original pilots below plus 36 new 36-second teaching films. Every current SMA lesson and foundation reference is covered. The new pipeline renders topic-specific diagrams from `lib/teaching-scenes.ts`, with four nine-second scenes, caption sidecars, posters, and passage explanations.

For the full release, activate the pinned Manim environment and run `bash media/manim/render-all.sh` from the repository root using Node 24 and Python. This exports SVG/native stages, renders films, validates assets, publishes local manifests, and checks decoded frames. It does not upload media or deploy either app. See [the complete media guide](../../docs/complete-concept-media.md).

No narration or TeX installation is required. New diagrams use the cream/blue app palette; the original purple pilots retain their released filenames, versions, and transcripts. Bump versioned filenames before editing released assets because media is immutable-cached.

## Original pilot pipeline

The three scenes are original ReThink content, rendered with Manim Community 0.19.0 using Cairo. They use `Text` rather than `Tex`/`MathTex`, so no TeX installation is required. The pilots have Indonesian text and no audio/narration.

Use a Python environment with the pinned [requirements](requirements.txt) and the platform dependencies described in [Manim's installation guide](https://docs.manim.community/en/stable/installation.html). One option is an isolated conda-forge environment:

```sh
micromamba create -p /tmp/rethink-manim-env -c conda-forge python=3.12 manim=0.19.0
micromamba activate /tmp/rethink-manim-env
bash media/manim/render.sh
```

Run from the frontend repository root. The script renders 960×540 at 24fps and packages MP4 files plus JPEG poster frames into `public/videos/`. Intermediate render files go to `/tmp/rethink-manim-media`.

The canonical public metadata and transcript cues are in `lib/data/video-catalog.v1.json`; WebVTT files are in `public/videos/`. Keep cues and `durationSeconds` consistent with scene timing. `package.py` prints actual durations and frame dimensions so they can be verified. This release has durations 26, 27 and 29 seconds.

For release, synchronize the metadata to backend `lib/data/video-catalog.v1.json`, and the nine media files to backend `public/videos/`. Backend tests verify asset presence and transcript/caption coverage. Change filenames and scene versions for edited released videos because media URLs are immutable-cached. Keep the two copies byte-identical. The backend can later point to a public media directory through `VIDEO_ASSET_BASE_URL`.

No Manim dependency is added to the frontend or backend JavaScript runtime; neither renders Python during HTTP requests.
