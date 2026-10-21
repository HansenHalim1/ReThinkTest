#!/usr/bin/env bash
set -euo pipefail
# Run from the frontend repository root, with the pinned Manim environment active.
python -m manim render --renderer cairo -r 960,540 --fps 24 --format mp4 --media_dir /tmp/rethink-manim-media media/manim/scenes.py Distribution Quadratic Tangent
python3 media/manim/package.py /tmp/rethink-manim-media
