#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${HOME}/development/flutter/bin:${PATH}"

echo "== Quran asset check =="
dart run scripts/check_quran_asset.dart

echo "==> flutter pub get"
flutter pub get

echo "==> flutter analyze"
flutter analyze

echo "==> flutter test"
flutter test

if [[ -d server/tasmee3_asr/tests ]]; then
  echo "==> pytest (tasmee3_asr)"
  (
    cd server/tasmee3_asr
    python -m pytest tests -q
  )
fi

echo "release_check: OK"
