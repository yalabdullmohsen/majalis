#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${HOME}/development/flutter/bin:${PATH}"

flutter analyze
flutter test

cd server/tasmee3_asr
python -m pytest tests -q
