#!/usr/bin/env bash
# حلقة تشغيل مستمر لملء محتوى منصة المجلس العلمي وتدقيقه عبر claude -p.
# مُعدَّلة 2026-07-22: من جدولة كل ساعة إلى حلقة متواصلة (دفعة فور انتهاء
# سابقتها، فاصل دقيقة واحدة فقط)، مع معالجة خاصة لنفاد الرصيد ونفاد المحتوى.
#
# تشغيل يدوي (طرفية مفتوحة):
#   bash /Users/alabdullmohsen/majalis-content-fill/scripts/content-runner.sh
#
# إيقاف نظيف (يوقف بعد نهاية الدورة الحالية، لا يقطعها):
#   touch /Users/alabdullmohsen/majalis-content-fill/scripts/content-runner.stop
#
# إيقاف فوري: Ctrl+C إن كان يعمل في الطرفية، أو عبر launchd:
#   launchctl unload ~/Library/LaunchAgents/com.majalis.content-runner.plist
#
# دورة واحدة فقط (اختبار، بلا حلقة، بلا إعادة محاولة تلقائية عند نفاد الرصيد):
#   bash content-runner.sh --once
#   bash content-runner.sh --once --audit

set -uo pipefail

WORKDIR="/Users/alabdullmohsen/majalis-content-fill"
SCRIPT_DIR="$WORKDIR/scripts"
LOG_FILE="$SCRIPT_DIR/content-runner.log"
STOP_FILE="$SCRIPT_DIR/content-runner.stop"
LOCK_FILE="$SCRIPT_DIR/content-runner.lock"
CONTENT_PROMPT_FILE="$SCRIPT_DIR/content-runner-content-prompt.txt"
AUDIT_PROMPT_FILE="$SCRIPT_DIR/content-runner-audit-prompt.txt"
CYCLE_COUNT_FILE="$SCRIPT_DIR/content-runner.cycle-count"
AUDIT_EVERY_N=5

# قفل عملية واحدة فقط: نسخة ثانية من هذا السكربت (طرفية يدوية أخرى، أو
# نافذة/جلسة أخرى) تعمل بالتوازي على نفس WORKDIR تُسبِّب تصادم git حقيقي
# (commit/push متزامنين على نفس الشجرة). اكتُشف هذا فعليًا أثناء اختبار
# 2026-07-22 (نسخة يدوية + نسخة من نافذة أخرى عملتا معًا فأفسدتا استخراج
# نتيجة عدة دورات). يُطبَّق على كل أوضاع التشغيل (--once أيضًا).
acquire_lock_or_exit() {
  mkdir -p "$SCRIPT_DIR"
  if [[ -f "$LOCK_FILE" ]]; then
    local existing_pid
    existing_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
    if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" 2>/dev/null; then
      echo "نسخة أخرى تعمل بالفعل (PID $existing_pid) — إنهاء بلا تنفيذ." >&2
      exit 1
    fi
    echo "قفل سابق متروك (PID $existing_pid غير حيّ) — تجاوزه." >&2
  fi
  echo $$ > "$LOCK_FILE"
  trap 'rm -f "$LOCK_FILE"' EXIT
}
acquire_lock_or_exit

BETWEEN_BATCHES_SECONDS=60        # فاصل عادي بين الدفعات (بند 2)
QUOTA_RETRY_SECONDS=1800          # 30 دقيقة عند نفاد الرصيد/حد الاستخدام (بند 3)
NO_CONTENT_WAIT_SECONDS=3600      # ساعة عند عدم توفر محتوى معتمد جاهز (بند 4)

# رموز حالة داخلية يرجعها run_one_cycle لتحديد سلوك main_loop
STATUS_NORMAL=0
STATUS_NO_CONTENT=2

log_line() {
  echo "$1" >> "$LOG_FILE"
}

# فحص نصي واسع لعلامات نفاد الرصيد/حد الاستخدام في مخرجات claude (بند 3).
# النمط غير مؤكَّد 100% (لا اختبار حي لحالة نفاد رصيد فعلية توفّر وقت الكتابة)؛
# عدّل القائمة إن ظهرت صياغة فعلية مختلفة في اللوق لاحقًا.
looks_like_quota_exhausted() {
  local text="$1"
  echo "$text" | grep -qiE "usage limit|rate limit|rate_limit|quota exceeded|usage_limit_reached|limit reached|too many requests|429 |resets at|try again later|weekly limit|5-hour limit"
}

run_claude_with_quota_retry() {
  # يستدعي claude -p، وعند اكتشاف نفاد رصيد يعيد المحاولة كل 30 دقيقة إلى
  # ما لا نهاية (نفس استدعاء الدورة، فيقرأ CONTINUATION_PLAN.md من جديد
  # فيكمل تلقائيًا من حيث توقف — لا حاجة لحفظ حالة وسيطة).
  local prompt_file="$1"
  local mode="$2"
  local output
  while true; do
    if [[ -f "$STOP_FILE" ]]; then
      echo "__STOP__"
      return 0
    fi
    output=$(claude --print \
      --dangerously-skip-permissions \
      --allowed-tools "Bash,Read,Edit,Write,Grep,WebSearch,WebFetch" \
      -- "$(cat "$prompt_file")" \
      2>&1)
    if looks_like_quota_exhausted "$output"; then
      log_line "$(date -u +"%Y-%m-%dT%H:%M:%SZ") | انتظار رصيد | ($mode) اكتُشف نفاد رصيد/حد استخدام — إعادة محاولة خلال ${QUOTA_RETRY_SECONDS}s"
      sleep "$QUOTA_RETRY_SECONDS"
      continue
    fi
    echo "$output"
    return 0
  done
}

run_one_cycle() {
  local force_audit="${1:-}"
  mkdir -p "$SCRIPT_DIR"
  touch "$CYCLE_COUNT_FILE"
  local n
  n=$(cat "$CYCLE_COUNT_FILE" 2>/dev/null || echo 0)
  n=$((n + 1))
  echo "$n" > "$CYCLE_COUNT_FILE"

  local mode="content"
  local prompt_file="$CONTENT_PROMPT_FILE"
  if [[ "$force_audit" == "--audit" ]] || (( n % AUDIT_EVERY_N == 0 )); then
    mode="audit"
    prompt_file="$AUDIT_PROMPT_FILE"
  fi

  local ts
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  cd "$WORKDIR" || { log_line "$ts | $mode | فشل: تعذّر الدخول إلى $WORKDIR"; return $STATUS_NORMAL; }

  local output
  output=$(run_claude_with_quota_retry "$prompt_file" "$mode")

  if [[ "$output" == "__STOP__" ]]; then
    return $STATUS_NORMAL
  fi

  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local result_line
  result_line=$(echo "$output" | grep '^RESULT:' | tail -1)
  if [[ -z "$result_line" ]]; then
    mkdir -p "$SCRIPT_DIR/debug"
    local debug_file="$SCRIPT_DIR/debug/cycle-${n}-$(date -u +%Y%m%dT%H%M%SZ).txt"
    echo "$output" > "$debug_file"
    result_line="RESULT: غير معروف | (لم يطبع claude سطر RESULT) | راجع $debug_file"
  fi

  log_line "$ts | دورة #$n ($mode) | $result_line"

  # بند 4: عدم توفر محتوى معتمد جاهز للنقل — الوكيل الداخلي يُصرّح بذلك عبر
  # "RESULT: لا محتوى متاح" (راجع بروتوكولي الدورة). هذا ليس فشلاً.
  if echo "$result_line" | grep -q "^RESULT: لا محتوى متاح"; then
    return $STATUS_NO_CONTENT
  fi

  return $STATUS_NORMAL
}

main_loop() {
  echo "بدأ content-runner.sh (وضع الحلقة المتواصلة) — فاصل ${BETWEEN_BATCHES_SECONDS}s بين الدفعات، تدقيق كل ${AUDIT_EVERY_N} دورات، تراجع 30 دقيقة عند نفاد الرصيد، انتظار ساعة عند نفاد المحتوى. إيقاف نظيف: touch $STOP_FILE"
  while true; do
    if [[ -f "$STOP_FILE" ]]; then
      log_line "$(date -u +"%Y-%m-%dT%H:%M:%SZ") | إيقاف | وُجد ملف stop — إنهاء نظيف"
      rm -f "$STOP_FILE"
      break
    fi

    local status=0
    run_one_cycle || status=$?

    if [[ "$status" == "$STATUS_NO_CONTENT" ]]; then
      sleep "$NO_CONTENT_WAIT_SECONDS"
    else
      sleep "$BETWEEN_BATCHES_SECONDS"
    fi
  done
}

case "${1:-}" in
  --once)
    run_one_cycle "${2:-}"
    ;;
  --once-audit)
    run_one_cycle "--audit"
    ;;
  *)
    main_loop
    ;;
esac
