#!/usr/bin/env bash
# حلقة تشغيل مستمر لملء محتوى منصة المجلس العلمي وتدقيقه عبر claude -p.
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
# دورة واحدة فقط (اختبار، بلا حلقة):
#   bash content-runner.sh --once
#   bash content-runner.sh --once --audit

set -uo pipefail

WORKDIR="/Users/alabdullmohsen/majalis-content-fill"
SCRIPT_DIR="$WORKDIR/scripts"
LOG_FILE="$SCRIPT_DIR/content-runner.log"
STOP_FILE="$SCRIPT_DIR/content-runner.stop"
CONTENT_PROMPT_FILE="$SCRIPT_DIR/content-runner-content-prompt.txt"
AUDIT_PROMPT_FILE="$SCRIPT_DIR/content-runner-audit-prompt.txt"
CYCLE_COUNT_FILE="$SCRIPT_DIR/content-runner.cycle-count"
DAILY_COUNT_FILE="$SCRIPT_DIR/content-runner.daily-count"
INTERVAL_SECONDS=3600   # 60 دقيقة — بطلب صريح من المالك (2026-07-22) لترشيد رصيد Claude Code الأسبوعي
AUDIT_EVERY_N=5
MAX_CYCLES_PER_DAY=10   # سقف يومي صريح — بطلب المالك (2026-07-22). عدّله هنا فقط إن أردت تغييره.

log_line() {
  # سطر واحد فقط لكل دورة: الوقت | النوع | الملخص المستخرج من مخرجات claude
  echo "$1" >> "$LOG_FILE"
}

# يرجع 0 (مسموح) إن لم يُستنفد سقف اليوم بعد، وإلا 1. يُحدّث العدّاد تلقائيًا مع تصفير عند تغيّر التاريخ.
daily_cap_check_and_increment() {
  local today
  today=$(date -u +"%Y-%m-%d")
  local stored_date="" stored_count=0
  if [[ -f "$DAILY_COUNT_FILE" ]]; then
    read -r stored_date stored_count < "$DAILY_COUNT_FILE" 2>/dev/null || true
  fi
  if [[ "$stored_date" != "$today" ]]; then
    stored_date="$today"
    stored_count=0
  fi
  if (( stored_count >= MAX_CYCLES_PER_DAY )); then
    return 1
  fi
  stored_count=$((stored_count + 1))
  echo "$stored_date $stored_count" > "$DAILY_COUNT_FILE"
  return 0
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

  cd "$WORKDIR" || { log_line "$ts | $mode | فشل: تعذّر الدخول إلى $WORKDIR"; return 1; }

  local output
  output=$(claude --print \
    --dangerously-skip-permissions \
    --allowed-tools "Bash,Read,Edit,Write,Grep,WebSearch,WebFetch" \
    -- "$(cat "$prompt_file")" \
    2>&1)
  local exit_code=$?

  local result_line
  result_line=$(echo "$output" | grep '^RESULT:' | tail -1)
  if [[ -z "$result_line" ]]; then
    if [[ $exit_code -ne 0 ]]; then
      result_line="RESULT: فشل | (لا مخرجات RESULT) | exit_code=$exit_code"
    else
      result_line="RESULT: غير معروف | (لم يطبع claude سطر RESULT) | راجع مخرجات كاملة إن لزم"
    fi
  fi

  log_line "$ts | دورة #$n ($mode) | $result_line"
}

main_loop() {
  echo "بدأ content-runner.sh — الدورات كل ${INTERVAL_SECONDS}s (~$((86400/INTERVAL_SECONDS)) دورة نظريًا/يوم)، سقف فعلي ${MAX_CYCLES_PER_DAY} دورة/يوم، تدقيق كل ${AUDIT_EVERY_N} دورات. إيقاف نظيف: touch $STOP_FILE"
  while true; do
    if [[ -f "$STOP_FILE" ]]; then
      log_line "$(date -u +"%Y-%m-%dT%H:%M:%SZ") | إيقاف | وُجد ملف stop — إنهاء نظيف"
      rm -f "$STOP_FILE"
      break
    fi
    if daily_cap_check_and_increment; then
      run_one_cycle || true
    else
      log_line "$(date -u +"%Y-%m-%dT%H:%M:%SZ") | تخطٍّ | بلغ السقف اليومي ($MAX_CYCLES_PER_DAY دورة) — انتظار حتى اليوم التالي"
    fi
    sleep "$INTERVAL_SECONDS"
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
