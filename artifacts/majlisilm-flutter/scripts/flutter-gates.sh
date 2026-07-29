#!/usr/bin/env bash
# Flutter quality gate for artifacts/majlisilm-flutter
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
flutter pub get
flutter analyze --no-fatal-infos
flutter test
echo "flutter-gates: ok"
