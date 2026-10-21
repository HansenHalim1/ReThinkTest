# Manim for ReThink teaching

Assessment: highly viable for reusable explanatory animations; on-demand personalized rendering needs a separate service and measured latency/cost before adoption.

Manim produces video artifacts including MP4. Its render configuration controls quality and frame rate; rendering higher-quality output takes longer. Equations using Manim's LaTeX interface require a TeX installation. See the official [output guide](https://docs.manim.community/en/stable/tutorials/output_and_config.html) and [installation guide](https://docs.manim.community/en/stable/installation/uv.html).

## Recommended first architecture

This is a ReThink design proposal, not a measured deployment result.

1. Author and review short scenes tied to stable topic/skill IDs. Good starting subjects are distribution using area, quadratic transformations, secants approaching a tangent, and sums of rectangles approaching area under a curve.
2. Render reviewed scenes ahead of release on a Python machine or container. Keep this work outside the current static Next.js site and the synchronous assessment request path.
3. Upload compatible MP4 files, poster images, captions and transcripts to storage. Supabase Storage is a candidate because the project already uses Supabase; buckets, permissions and media delivery remain to be configured.
4. Have the backend return a lesson asset record: skill ID, scene version, language, video URL, poster URL, captions URL, transcript and duration. Web and Swift consume the same record. Verify the actual codec/output on Safari and iOS before release; an MP4 extension alone is not a compatibility test.
5. Let AI select the relevant reviewed clip after evidence suggests a gap. Follow it with an independent question. During assessment, defer explanations so hints do not contaminate later evidence.

Keep interactive web/SVG or native Swift controls for immediate slider-driven exploration. A rendered video supports playback and seeking; changing its mathematics requires another render. A hybrid of short explanation clips and interactive practice suits the existing app.

## If personalized rendering is needed later

Use a background queue and isolated Python workers. The request returns a job ID; clients poll or subscribe and can continue learning while rendering completes. Cache by scene template, bounded parameters, language and renderer version. Prefer approved templates with validated parameters over running arbitrary AI-generated Python. Bound render duration/resources and restrict worker access to application secrets and the network.

Benchmark at least a distribution scene, a moving tangent, and an integral scene on the intended worker. Record cold/warm render time, queue delay, artifact size, cost per unique asset, text legibility on phones, codec playback and mathematical correctness. No render timings, prices, user-learning outcomes or production integration have been measured here.
