#!/usr/bin/env bash
# دمج آمن من فرع نافذة عمل تفاعلية إلى main، بقفل يمنع تزامن الدمج بين
# نافذتين. مخصَّص حصرًا لفرعي automation/content وautomation/tasks (كل
# فرع في worktree مستقل خارج مجلد المشروع).
#
# الاستخدام (من داخل worktree الفرع، بعد التأكد يدويًا أن typecheck
# والاختبارات الموجّهة للتعديل ناجحة):
#   bash scripts/safe-merge-to-main.sh "رسالة الـcommit بالعربية"
#
# ما يفعله بالترتيب:
#   1. commit واحد لكل التغييرات المعلّقة (إن وُجدت).
#   2. بوابة جودة أخيرة: pnpm run build (يشمل typecheck).
#   3. push لفرع النافذة نفسه (سجل دائم بغضّ النظر عن نجاح الدمج لاحقًا).
#   4. فرع automation/content فقط: يتحقق من حد أدنى للدفعة (بند تقليل
#      استهلاك نشر Vercel)؛ دون الحد يُحفظ العمل على الفرع فقط بلا دمج.
#   5. قفل دمج مشترك بين النافذتين (عبر مجلد git المشترك، فيعمل عبر كل
#      worktrees لأنها تتشارك نفس .git).
#   6. مزامنة مع أحدث main، وبناء تحقّقي إضافي إن تغيّر main.
#   7. push واحد fast-forward إلى main (بلا force أبدًا). أي فشل أو
#      تعارض في أي خطوة يلغي كل شيء بلا لمس main.
#
# الحد الأدنى لدفعة automation/content يمكن تجاوزه استثنائيًا بتمرير
# FORCE_MERGE=1 قبل الأمر.

set -euo pipefail

COMMIT_MSG="${1:-}"
if [[ -z "$COMMIT_MSG" ]]; then
  echo "خطأ: مطلوب رسالة commit كوسيط أول." >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
GIT_COMMON_DIR="$(git rev-parse --path-format=absolute --git-common-dir)"
LOCK_DIR="$GIT_COMMON_DIR/automation-merge.lock.d"
BRANCH="$(git branch --show-current)"
MIN_BATCH_FILES_CONTENT=15

if [[ "$BRANCH" != "automation/content" && "$BRANCH" != "automation/tasks" ]]; then
  echo "خطأ: هذا السكربت مخصص لفرعي automation/content وautomation/tasks فقط (الفرع الحالي: $BRANCH)." >&2
  exit 1
fi

cd "$REPO_ROOT"

# 1) commit واحد لكل التغييرات المعلّقة
if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "$COMMIT_MSG"
  echo "==> تم إنشاء commit جديد على $BRANCH"
else
  echo "==> لا تغييرات معلّقة في شجرة العمل — سيُتابَع بآخر commit موجود على $BRANCH إن لم يكن مدفوعًا لـmain بعد."
fi

# 2) بوابة الجودة: typecheck + build
echo "==> pnpm run build"
pnpm run build

# 3) رفع فرع النافذة نفسه أولًا
git push origin "HEAD:$BRANCH"
echo "==> تم دفع $BRANCH إلى origin"

# 4) حد أدنى للدفعة على فرع المحتوى فقط، لتقليل تكرار نشر Vercel
if [[ "$BRANCH" == "automation/content" && "${FORCE_MERGE:-0}" != "1" ]]; then
  CHANGED_FILES=$(git diff --name-only origin/main...HEAD | wc -l | tr -d ' ')
  if (( CHANGED_FILES < MIN_BATCH_FILES_CONTENT )); then
    echo "==> دفعة المحتوى الحالية ($CHANGED_FILES ملف) أصغر من الحد الأدنى ($MIN_BATCH_FILES_CONTENT)."
    echo "==> تم الحفظ على فرع automation/content فقط، بلا دمج لـmain الآن. تابع التعبئة حتى تكتمل الدفعة."
    echo "==> لدمج فوري استثنائي: FORCE_MERGE=1 bash scripts/safe-merge-to-main.sh \"...\""
    exit 0
  fi
  echo "==> دفعة المحتوى ($CHANGED_FILES ملف) بلغت الحد الأدنى — متابعة الدمج."
fi

# 5) قفل الدمج المشترك بين النافذتين (قفل PID عبر mkdir الذرّي)
acquire_merge_lock() {
  local waited=0
  local max_wait=1800
  while true; do
    if mkdir "$LOCK_DIR" 2>/dev/null; then
      echo $$ > "$LOCK_DIR/pid"
      echo "$BRANCH" > "$LOCK_DIR/branch"
      trap 'rm -rf "$LOCK_DIR"' EXIT
      return 0
    fi
    local holder_pid holder_branch
    holder_pid=$(cat "$LOCK_DIR/pid" 2>/dev/null || echo "")
    holder_branch=$(cat "$LOCK_DIR/branch" 2>/dev/null || echo "?")
    if [[ -n "$holder_pid" ]] && ! kill -0 "$holder_pid" 2>/dev/null; then
      echo "==> قفل متروك من عملية ميتة (PID $holder_pid، فرع $holder_branch) — إزالته."
      rm -rf "$LOCK_DIR"
      continue
    fi
    if (( waited >= max_wait )); then
      echo "خطأ: تعذّر الحصول على قفل الدمج خلال ${max_wait}s (محجوز من فرع $holder_branch، PID $holder_pid). لم يُدمَج main — الفرع مدفوع فقط، أعد المحاولة لاحقًا." >&2
      exit 1
    fi
    echo "==> قفل الدمج محجوز حاليًا من فرع $holder_branch (PID $holder_pid) — انتظار 5 ثوانٍ..."
    sleep 5
    waited=$((waited + 5))
  done
}

echo "==> طلب قفل الدمج المشترك..."
acquire_merge_lock
echo "==> تم الحصول على قفل الدمج."

# 6) مزامنة مع أحدث main
git fetch origin main
if ! git merge-base --is-ancestor origin/main HEAD; then
  echo "==> main تقدّم منذ آخر مزامنة — دمج origin/main محليًا على $BRANCH"
  if ! git merge --no-edit origin/main; then
    git merge --abort || true
    echo "خطأ: تعارض دمج مع main — أُلغي كل شيء. لا push لـmain. راجع التعارض يدويًا على $BRANCH." >&2
    exit 1
  fi
  echo "==> إعادة بناء تحقّقي بعد دمج main"
  pnpm run build
  git push origin "HEAD:$BRANCH"
fi

# 7) push واحد fast-forward إلى main (بلا force أبدًا)
if git push origin "HEAD:main"; then
  echo "✅ تم الدمج والدفع إلى main بأمان من فرع $BRANCH. Vercel سينشر تلقائيًا (قد يتأخر الظهور حتى ساعة)."
else
  echo "خطأ: فشل push لـmain (على الأرجح main تغيّر للتو من مصدر آخر). لم يُلمَس main. الفرع $BRANCH مدفوع ومحفوظ — أعد تشغيل السكربت." >&2
  exit 1
fi
