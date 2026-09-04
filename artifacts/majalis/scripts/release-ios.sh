#!/usr/bin/env bash
# release:ios — أمر واحد لرفع رقم البناء + sync + تجهيز TestFlight.
# لا يغيّر Bundle ID ولا التوقيع. يُبقي server.url على https://www.ssunnah.com.
#
# الاستعمال (من artifacts/majalis أو عبر pnpm --filter):
#   pnpm run release:ios
#   ALLOW_IOS_NON_MAIN_BUILD=1 pnpm run release:ios   # عند التجربة من فرع غير main
#
# الرفع الفعلي إلى TestFlight يتم عبر workflow:
#   gh workflow run ios-testflight-deploy.yml
# أو وسم: git tag v1.0.N && git push origin v1.0.N
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/../.." && pwd)"
PBX="$ROOT/ios/App/App.xcodeproj/project.pbxproj"
CAP_TS="$ROOT/capacitor.config.ts"
CAP_IOS="$ROOT/ios/App/App/capacitor.config.json"
CANONICAL_URL="https://www.ssunnah.com"

cd "$ROOT"

echo "==> التحقق من ربط الموقع الحي (server.url)…"
for f in "$CAP_TS" "$CAP_IOS"; do
  if ! grep -q "$CANONICAL_URL" "$f"; then
    echo "خطأ: $f لا يحتوي server.url = $CANONICAL_URL" >&2
    exit 1
  fi
done
if grep -E 'Bundle Identifier|PRODUCT_BUNDLE_IDENTIFIER' "$PBX" | grep -vq 'com.yousef.majlisilm'; then
  echo "تحذير: تحقق يدويًا من PRODUCT_BUNDLE_IDENTIFIER (يجب أن يبقى com.yousef.majlisilm)" >&2
fi

echo "==> رفع CURRENT_PROJECT_VERSION (CFBundleVersion)…"
python3 - <<'PY'
from pathlib import Path
import re
pbx = Path("ios/App/App.xcodeproj/project.pbxproj")
text = pbx.read_text(encoding="utf-8")
versions = [int(m) for m in re.findall(r"CURRENT_PROJECT_VERSION = ([0-9]+);", text)]
if not versions:
    raise SystemExit("لم يُعثر على CURRENT_PROJECT_VERSION")
nxt = max(versions) + 1
text2, n = re.subn(
    r"CURRENT_PROJECT_VERSION = [0-9]+;",
    f"CURRENT_PROJECT_VERSION = {nxt};",
    text,
)
if n < 1:
    raise SystemExit("فشل تحديث CURRENT_PROJECT_VERSION")
pbx.write_text(text2, encoding="utf-8")
print(f"✓ CURRENT_PROJECT_VERSION → {nxt} ({n} مواضع)")
PY

echo "==> prepare:ios (build + cap sync ios)…"
export ALLOW_IOS_NON_MAIN_BUILD="${ALLOW_IOS_NON_MAIN_BUILD:-0}"
bash "$ROOT/scripts/prepare-ios.sh"

echo "==> إعادة التحقق أن server.url لم يُمس بعد sync…"
grep -q "$CANONICAL_URL" "$CAP_IOS"

echo ""
echo "✓ جاهز للرفع. الخطوة التالية (لا تُنفَّذ تلقائيًا هنا لتجنب نشر غير مقصود):"
echo "  cd $REPO_ROOT && gh workflow run ios-testflight-deploy.yml"
echo "  أو: افتح Xcode → Product → Archive"
echo "  أو: git tag vX.Y.Z && git push origin vX.Y.Z"
