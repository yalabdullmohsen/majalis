#!/usr/bin/env bash
# جهّز مشروع Capacitor iOS للرفع إلى TestFlight من جذر الحزمة artifacts/majalis
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${PORT:-}" ]]; then export PORT=24216; fi
if [[ -z "${BASE_PATH:-}" ]]; then export BASE_PATH=/; fi

echo "==> جذر المشروع: $ROOT"
echo "==> webDir في capacitor.config.ts:"
grep -E 'webDir' "$ROOT/capacitor.config.ts" || true

echo "==> pnpm install (من جذر الـ monorepo إن لزم)…"
if [[ -f "$ROOT/../../pnpm-workspace.yaml" ]]; then
  (cd "$ROOT/../.." && pnpm install --frozen-lockfile)
else
  pnpm install --frozen-lockfile
fi

echo "==> بناء الموقع → dist…"
pnpm run build

if [[ ! -d "$ROOT/dist" ]] || [[ ! -f "$ROOT/dist/index.html" ]]; then
  echo "خطأ: مجلد dist غير موجود بعد البناء" >&2
  exit 1
fi

echo "==> npx cap sync ios…"
npx cap sync ios

test -f "$ROOT/ios/App/App/capacitor.config.json"
test -f "$ROOT/ios/App/App/config.xml"
test -d "$ROOT/ios/App/App/public"
test -f "$ROOT/ios/App/App/public/index.html"

echo "==> جاهز: افتح ios/App/App.xcodeproj ثم Product → Archive"
echo "    open \"$ROOT/ios/App/App.xcodeproj\""
