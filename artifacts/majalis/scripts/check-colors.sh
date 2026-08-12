#!/usr/bin/env bash
# يفشل إذا وُجد أي لون بني ممنوع في كود التصميم
set -e

FORBIDDEN=(
  "#92400e" "#92400E" "#B45309" "#b45309" "#a16207"
  "#c8a24a" "#c4a35a" "#C8A24A" "#C4A35A"
  "#FEF3C7" "amber-[789]" "orange-[89]" "brown"
)

found=0
for pattern in "${FORBIDDEN[@]}"; do
  results=$(grep -rn --include="*.tsx" --include="*.ts" --include="*.css" "$pattern" src/ 2>/dev/null | grep -v "node_modules\|\.d\.ts\|data-theme=\"dark\"" || true)
  if [ -n "$results" ]; then
    echo "❌ لون ممنوع '$pattern':"
    echo "$results"
    found=1
  fi
done

if [ "$found" -eq 0 ]; then
  echo "✅ لا توجد ألوان بنية ممنوعة"
fi
exit $found
