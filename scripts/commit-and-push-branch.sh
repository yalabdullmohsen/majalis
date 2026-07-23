#!/usr/bin/env bash
# Commit وpush إلى فرع النافذة نفسه فقط — بلا أي دمج أو push إلى main.
# مخصَّص حصرًا لفرعي automation/content وautomation/tasks (كل فرع في
# worktree مستقل خارج مجلد المشروع).
#
# الدمج والنشر إلى main أصبحا حصريًا عبر تشغيل يدوي لـ
# .github/workflows/release-majlisilm.yml (workflow_dispatch من GitHub).
# لا تُنشئ هذه النافذتان أي commit أو push على main تحت أي ظرف.
#
# الاستخدام (من داخل worktree الفرع، بعد التأكد يدويًا أن typecheck
# والاختبارات الموجّهة للتعديل ناجحة):
#   bash scripts/commit-and-push-branch.sh "رسالة الـcommit بالعربية"
#
# ما يفعله بالترتيب:
#   1. commit واحد لكل التغييرات المعلّقة (إن وُجدت).
#   2. بوابة جودة أخيرة: pnpm run build (يشمل typecheck).
#   3. push لفرع النافذة نفسه فقط.

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

echo "==> pnpm run build"
pnpm run build

git push origin "HEAD:$BRANCH"

echo "✅ تم commit وpush إلى $BRANCH فقط."
echo "   لا دمج ولا push إلى main من هذه النافذة. الإصدار إلى main يتم"
echo "   حصريًا بتشغيل يدوي لـ .github/workflows/release-majlisilm.yml من GitHub."
