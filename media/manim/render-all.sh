#!/usr/bin/env bash
set -euo pipefail
# Activate the pinned Manim environment first; run from the frontend repo root.
node --experimental-strip-types media/manim/export-scenes.mjs
python media/manim/render-lessons.py
python media/manim/publish-release.py
python media/manim/verify-release.py
