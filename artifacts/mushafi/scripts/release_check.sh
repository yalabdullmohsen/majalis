#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${HOME}/development/flutter/bin:${PATH}"

echo "== Quran asset check =="
dart run scripts/check_quran_asset.dart

echo "== Flutter pub get =="
flutter pub get

echo "== Flutter analyze =="
flutter analyze

echo "== Flutter tests =="
flutter test

echo "== Backend tests =="
(
  cd server/tasmee3_asr
  python -m pytest tests -q
)

echo "== Release check completed successfully =="
