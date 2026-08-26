#!/usr/bin/env bash
# إعداد / التحقق من توثيق الأداء وبواباته — لا يمسح قياسات موجودة.
# الاستخدام من جذر المستودع:
#   bash scripts/setup-perf.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p docs artifacts/majalis/docs

BASELINE="docs/PERFORMANCE_BASELINE.md"
GUIDE="docs/PERFORMANCE_GUIDELINES.md"

create_baseline_stub() {
  cat <<'EOF' > "$BASELINE"
# خط أساس الأداء — Performance Baseline

| المقياس (Metric) | قبل التحسين | بعد التحسين | النسبة |
|---|---|---|---|
| حجم الحزمة (Entry JS gzip) | — KiB | — KiB | — |
| LCP | — s | — s | — |
| INP | — ms | — ms | — |
| Performance (Lighthouse) | — / 100 | — / 100 | — |

املأ الأرقام عبر:
`PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build && node artifacts/majalis/scripts/test-bundle-budget.mjs`
EOF
}

create_guide_stub() {
  cat <<'EOF' > "$GUIDE"
# إرشادات الأداء — Zero-Regression

1. مكتبات الإقلاع ≤ 10 KiB gzip دون موافقة معمارية.
2. استيراد موجّه (لا `import *` من lucide/lodash).
3. صور تحت الطي: `loading="lazy"`؛ LCP فقط eager/priority.
4. لا ترفع State بلا داعٍ؛ فضّل memo للقوائم.
5. بوابة CI: `test:bundle-budget` + `lhci-home` في `.github/workflows/ci.yml` — لا minScore 0.90 على المعاينة.
EOF
}

if [[ -f "$BASELINE" ]] && grep -q "110\.2\|Entry JS gzip\|خط أساس" "$BASELINE" 2>/dev/null; then
  echo "✓ $BASELINE موجود بقياسات — لن يُستبدل"
else
  if [[ -f "$BASELINE" ]]; then
    echo "⚠ $BASELINE موجود بلا قياسات معروفة — اتركه يدويًا"
  else
    create_baseline_stub
    echo "+ أُنشئ $BASELINE (قالب فارغ — املأ بعد القياس)"
  fi
fi

if [[ -f "$GUIDE" ]] && grep -q "10 KiB\|Zero-Regression\|إرشادات الأداء" "$GUIDE" 2>/dev/null; then
  echo "✓ $GUIDE موجود — لن يُستبدل"
else
  if [[ -f "$GUIDE" ]]; then
    echo "⚠ $GUIDE موجود — اتركه يدويًا"
  else
    create_guide_stub
    echo "+ أُنشئ $GUIDE"
  fi
fi

# مزامنة اختيارية لنسخة artifact إن وُجدت المقاييس في docs/
if [[ -f "$BASELINE" ]]; then
  cp -f "$BASELINE" artifacts/majalis/docs/PERFORMANCE_BASELINE.md
fi
if [[ -f "$GUIDE" ]]; then
  cp -f "$GUIDE" artifacts/majalis/docs/PERFORMANCE_GUIDELINES.md
fi

echo ""
echo "=== بوابات الأداء الموجودة (لا تُنشأ workflow بـ minScore 90) ==="
echo "  • حزمة:     pnpm --filter @workspace/majalis run test:bundle-budget"
echo "  • LHCI:     داخل .github/workflows/ci.yml → job lhci-home (منفذ 24216)"
echo "  • عتبات:    artifacts/majalis/scripts/lhci-thresholds.cjs + lighthouserc.cjs"
echo "  • محلي:     pnpm run verify:ci"
echo ""
echo "✅ setup-perf.sh اكتمل"
