#!/usr/bin/env python3
"""Legacy generator retired — silent-splash / LaunchMark removed (single HTML splash).

Official cold-start path:
  Native LaunchScreen (ivory #F7F3EB only) → #mj-launch-splash («رفيقك في العلم والعمل») → App

Do not regenerate dark-green silent-splash PNGs or LaunchMark.imageset.
"""
from __future__ import annotations

import sys

print(
    "generate-silent-splash-assets: retired — use index.html #mj-launch-splash only",
    file=sys.stderr,
)
sys.exit(0)
