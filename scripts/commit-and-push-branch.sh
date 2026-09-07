#!/usr/bin/env bash
# Commit وpush إلى فرع النافذة، ثم فتح/تحديث PR Ready إلى main مع auto-merge squash.
# مخصَّص حصرًا لفرعي automation/content وautomation/tasks.
#
# الاستخدام:
#   bash scripts/commit-and-push-branch.sh "رسالة الـcommit بالعربية"

set -euo pipefail

COMMIT_MSG="${1:-}"
if [[ -z "$COMMIT_MSG" ]]; then
  echo "خطأ: مطلوب رسالة commit كوسيط أول." >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
BRANCH="$(git branch --show-current)"

if [[ "$BRANCH" != "automation/content" && "$BRANCH" != "automation/tasks" ]]; then
  echo "خطأ: هذا السكربت مخصص لفرعي automation/content وautomation/tasks فقط (الفرع الحالي: $BRANCH)." >&2
  exit 1
fi

cd "$REPO_ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "$COMMIT_MSG"
  echo "==> تم إنشاء commit جديد على $BRANCH"
else
  echo "==> لا تغييرات معلّقة في شجرة العمل."
fi

echo "==> pnpm run typecheck:libs"
pnpm run typecheck:libs

echo "==> pnpm --filter @workspace/majalis run build"
pnpm --filter @workspace/majalis run build

git push origin "HEAD:$BRANCH"

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "yalabdullmohsen/majalis")"
TITLE="$COMMIT_MSG"
BODY="## الملخص
دمج تلقائي من \`$BRANCH\` بعد نجاح البوابات المحلية.

لا طابور مراجعة — PR Ready + auto-merge squash إلى \`main\`، ثم نشر الإنتاج عبر Vercel/Auto Deploy."

EXISTING="$(gh pr list -R "$REPO" --base main --head "$BRANCH" --state open --json number -q '.[0].number' 2>/dev/null || true)"
if [[ -n "${EXISTING}" ]]; then
  echo "==> تحديث PR موجود #$EXISTING"
  gh pr edit "$EXISTING" -R "$REPO" --title "$TITLE" --body "$BODY" >/dev/null || true
  PR_NUM="$EXISTING"
else
  echo "==> فتح PR جديد إلى main"
  PR_URL="$(gh pr create -R "$REPO" --base main --head "$BRANCH" --title "$TITLE" --body "$BODY")"
  PR_NUM="$(echo "$PR_URL" | grep -oE '[0-9]+$')"
  echo "==> $PR_URL"
fi

gh pr ready "$PR_NUM" -R "$REPO" 2>/dev/null || true
gh pr merge "$PR_NUM" -R "$REPO" --squash --auto 2>/dev/null || true

echo "✅ تم commit وpush إلى $BRANCH"
echo "   PR #$PR_NUM → main (Ready + auto-merge). النشر يتبع نجاح Verify build."
