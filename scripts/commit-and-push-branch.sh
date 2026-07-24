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
#   2. بوابة جودة أخيرة: typecheck:libs + build مُقيَّد بـ@workspace/majalis
#      (يشمل typecheck). لا نستخدم pnpm run build الجذري لأنه يُشغّل
#      build لكل حزم monorepo، بما فيها حزم تسويقية هامشية غير مرتبطة
#      (majalis-pitch, majalis-promo) تتطلب متغيّرات بيئة (PORT,
#      BASE_PATH) غير مُعرَّفة هنا أصلًا وغير ذات صلة بعمل هاتين
#      النافذتين — مؤكَّد فعليًا 2026-07-24 أنه كان يُفشل البوابة بلا
#      علاقة بأي تعديل حقيقي. نفس النطاق المستخدَم فعليًا في
#      .github/workflows/auto-merge-to-main.yml وpre-commit hook المحلي.
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

echo "==> pnpm run typecheck:libs"
pnpm run typecheck:libs

echo "==> pnpm --filter @workspace/majalis run build"
pnpm --filter @workspace/majalis run build

git push origin "HEAD:$BRANCH"

echo "✅ تم commit وpush إلى $BRANCH فقط."
echo "   لا دمج ولا push إلى main من هذه النافذة. الإصدار إلى main يتم"
echo "   حصريًا بتشغيل يدوي لـ .github/workflows/release-majlisilm.yml من GitHub."
