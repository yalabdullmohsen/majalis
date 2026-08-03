#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== Flutter pub get =="
flutter pub get

echo "== Flutter analyze =="
flutter analyze

echo "== Flutter tests =="
flutter test

echo "== Backend tests =="
cd server/tasmee3_asr
python3 -m pip install -q -r requirements-test.txt
python3 -m pytest tests -q
