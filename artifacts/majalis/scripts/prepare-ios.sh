#!/usr/bin/env bash
# جهّز مشروع Capacitor iOS للرفع إلى TestFlight من جذر الحزمة artifacts/majalis
# يوحّد: البناء → sync → التحقق من الملفات الأساسية حتى لا تظهر مراجع حمراء في Xcode.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${PORT:-}" ]]; then export PORT=24216; fi
if [[ -z "${BASE_PATH:-}" ]]; then export BASE_PATH=/; fi

echo "==> جذر المشروع: $ROOT"
echo "==> webDir في capacitor.config.ts:"
grep -E 'webDir' "$ROOT/capacitor.config.ts" || true

# حارس freshness: لا ترفع TestFlight من مجلد/فرع متأخر عن origin/main.
# للتجاوز الواعي فقط: ALLOW_IOS_NON_MAIN_BUILD=1
REPO_ROOT="$(cd "$ROOT/../.." && pwd)"
if [[ -d "$REPO_ROOT/.git" || -f "$REPO_ROOT/.git" ]] && [[ "${ALLOW_IOS_NON_MAIN_BUILD:-}" != "1" ]]; then
  echo "==> التحقق أن HEAD يطابق آخر origin/main…"
  git -C "$REPO_ROOT" fetch --quiet origin main
  HEAD_SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
  MAIN_SHA="$(git -C "$REPO_ROOT" rev-parse refs/remotes/origin/main)"
  if [[ "$HEAD_SHA" != "$MAIN_SHA" ]]; then
    echo "هذا المجلد ليس على آخر origin/main، ورفعه سيُنتج تطبيقًا قديمًا" >&2
    echo "HEAD=${HEAD_SHA}" >&2
    echo "origin/main=${MAIN_SHA}" >&2
    echo "git checkout main && git pull --ff-only origin main" >&2
    exit 1
  fi
  echo "✓ HEAD=$(git -C "$REPO_ROOT" rev-parse --short HEAD) يطابق origin/main"
fi

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

# استدعِ ثنائي @capacitor/cli المحلي مباشرة (node_modules/.bin/cap).
# تشغيل الاسم المجرد "cap" عبر عدّاء حزم npm من جذر الـ monorepo يحلّ الحزمة
# الخاطئة cap@0.2.1 (بلا bin) → "could not determine executable to run".
CAP_BIN="$ROOT/node_modules/.bin/cap"
if [[ ! -x "$CAP_BIN" ]]; then
  echo "خطأ: لم يوجد $CAP_BIN — تأكد من تثبيت @capacitor/cli داخل artifacts/majalis" >&2
  exit 1
fi
echo "==> $CAP_BIN sync ios…"
"$CAP_BIN" sync ios

# cap sync يمسح محتويات public/ — أعد .gitkeep حتى يبقى المجلد متتبَّعًا في git
# ولا تختفي مرجعية المجلد من المشروع عند العمل على فروع نظيفة.
mkdir -p "$ROOT/ios/App/App/public"
: > "$ROOT/ios/App/App/public/.gitkeep"

echo "==> التحقق من توحيد ملفات iOS…"
test -f "$ROOT/ios/App/App/capacitor.config.json"
test -f "$ROOT/ios/App/App/config.xml"
test -d "$ROOT/ios/App/App/public"
test -f "$ROOT/ios/App/App/public/index.html"
test -f "$ROOT/ios/App/App/public/.gitkeep"
test -f "$ROOT/ios/App/App.xcodeproj/project.pbxproj"

# تأكيد تطابق appId و webDir و server.url بين المصدر والنسخة المنسوخة لـ iOS
node --input-type=module <<'NODE'
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const root = process.cwd();
const ts = readFileSync(resolve(root, "capacitor.config.ts"), "utf8");
const json = JSON.parse(readFileSync(resolve(root, "ios/App/App/capacitor.config.json"), "utf8"));
const appId = (ts.match(/appId:\s*"([^"]+)"/) || [])[1];
const webDir = (ts.match(/webDir:\s*"([^"]+)"/) || [])[1];
const serverUrl = (ts.match(/url:\s*"(https:\/\/[^"]+)"/) || [])[1];
if (!appId || !webDir) {
  console.error("تعذّر قراءة appId/webDir من capacitor.config.ts");
  process.exit(1);
}
if (json.appId !== appId) {
  console.error(`appId غير متطابق: ts=${appId} ios=${json.appId}`);
  process.exit(1);
}
if (webDir !== "dist") {
  console.error(`webDir يجب أن يكون dist، الموجود: ${webDir}`);
  process.exit(1);
}
if (serverUrl !== "https://www.majlisilm.com") {
  console.error(`server.url يجب أن يكون https://www.majlisilm.com، الموجود: ${serverUrl}`);
  process.exit(1);
}
if (json?.server?.url !== "https://www.majlisilm.com") {
  console.error(`ios capacitor.config.json server.url غير حي: ${json?.server?.url}`);
  process.exit(1);
}
if (json?.server?.cleartext !== true) {
  console.error("ios capacitor.config.json cleartext يجب أن يكون true");
  process.exit(1);
}
console.log(`✓ appId=${json.appId} · webDir=${webDir} · server.url=${json.server.url} · ios sync متّسق`);
NODE

echo "==> جاهز: افتح ios/App/App.xcodeproj ثم Product → Archive"
echo "    open \"$ROOT/ios/App/App.xcodeproj\""
