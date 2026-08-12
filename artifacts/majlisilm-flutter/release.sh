#!/usr/bin/env bash
# release.sh — إصدار iOS كامل للمجلس العلمي (Flutter → Archive → App Store Connect)
#
# الاستخدام (على macOS فقط):
#   chmod +x release.sh
#   ./release.sh
#
# متغيرات اختيارية للرفع (واحدة من الطريقتين):
#   1) مفتاح API في App Store Connect (مفضّل):
#        export ASC_KEY_ID=XXXXXXXXXX
#        export ASC_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
#        export ASC_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
#   2) Apple ID + كلمة مرور خاصة بالتطبيق:
#        export APPLE_ID=you@example.com
#        export APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
#
# تخطّي خطوات اختيارية:
#   SKIP_GIT_PULL=1 SKIP_OPEN_XCODE=1 SKIP_UPLOAD=1 ./release.sh
#   DRY_RUN=1 ./release.sh   # حتى بعد فتح Xcode، بلا Archive/رفع

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

RED=$'\033[31m'
GRN=$'\033[32m'
YLW=$'\033[33m'
BLU=$'\033[34m'
RST=$'\033[0m'

step=0
fail() {
  local reason="${1:-خطأ غير معروف}"
  echo "" >&2
  echo "${RED}✖ توقفت العملية عند الخطوة ${step}${RST}" >&2
  echo "${RED}السبب: ${reason}${RST}" >&2
  exit 1
}

run_step() {
  step=$((step + 1))
  local title="$1"
  shift
  echo ""
  echo "${BLU}── [${step}] ${title}${RST}"
  if ! "$@"; then
    fail "فشل تنفيذ: $*"
  fi
  echo "${GRN}✓ اكتملت: ${title}${RST}"
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "الأمر غير موجود: $1 — ثبّته ثم أعد المحاولة."
}

echo "${BLU}════════════════════════════════════════${RST}"
echo "${BLU}  Majlisilm iOS Release — release.sh${RST}"
echo "${BLU}════════════════════════════════════════${RST}"
echo "المجلد: $ROOT"

# ── تحقق البيئة ──────────────────────────────────────────────
[[ "$(uname -s)" == "Darwin" ]] || fail "هذا السكربت يعمل على macOS فقط (Xcode / CocoaPods)."
need_cmd git
need_cmd flutter
need_cmd pod
need_cmd xcodebuild
need_cmd xcrun
need_cmd open
need_cmd python3

[[ -f "$ROOT/pubspec.yaml" ]] || fail "لم يُعثر على pubspec.yaml — شغّل السكربت من artifacts/majlisilm-flutter."
[[ -d "$ROOT/ios/Runner.xcworkspace" ]] || fail "لم يُعثر على ios/Runner.xcworkspace."

NEW_VERSION=""
NEW_BUILD=""
IPA_PATH=""
ARCHIVE_PATH=""

# ── 1) git pull ──────────────────────────────────────────────
do_git_pull() {
  if [[ "${SKIP_GIT_PULL:-0}" == "1" ]]; then
    echo "${YLW}تخطي git pull (SKIP_GIT_PULL=1)${RST}"
    return 0
  fi
  local branch toplevel
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  [[ -n "$branch" ]] || fail "لست داخل مستودع git."
  echo "الفرع الحالي: $branch"
  toplevel="$(git rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"
  (
    cd "$toplevel"
    git pull --ff-only
  ) || fail "git pull فشل (تعارض أو شبكة). حلّ التعارض يدوياً ثم أعد ./release.sh"
}
run_step "git pull" do_git_pull

# ── 2) flutter clean ─────────────────────────────────────────
run_step "flutter clean" flutter clean

# ── 3) flutter pub get ───────────────────────────────────────
run_step "flutter pub get" flutter pub get

# ── 4) pod install ───────────────────────────────────────────
do_pod_install() {
  (
    cd "$ROOT/ios"
    pod install
  ) || fail "pod install فشل. تأكد من CocoaPods ووجود Flutter/Generated.xcconfig بعد pub get."
}
run_step "pod install" do_pod_install

# ── 5) فتح Runner.xcworkspace ────────────────────────────────
do_open_workspace() {
  if [[ "${SKIP_OPEN_XCODE:-0}" == "1" ]]; then
    echo "${YLW}تخطي فتح Xcode (SKIP_OPEN_XCODE=1)${RST}"
    return 0
  fi
  open "$ROOT/ios/Runner.xcworkspace" || fail "تعذّر فتح Runner.xcworkspace"
  echo "فُتح: ios/Runner.xcworkspace"
}
run_step "فتح Runner.xcworkspace" do_open_workspace

# ── 6) زيادة Build Number تلقائياً ───────────────────────────
do_bump_build() {
  local out
  out="$(python3 - <<'PY'
from pathlib import Path
import re
p = Path("pubspec.yaml")
text = p.read_text(encoding="utf-8")
m = re.search(r"^version:\s*([0-9]+)\.([0-9]+)\.([0-9]+)\+(\d+)\s*$", text, re.M)
if not m:
    raise SystemExit("تعذّر قراءة version من pubspec.yaml (المتوقع مثل 1.0.0+4)")
major, minor, patch, build = m.groups()
build_i = int(build) + 1
new = f"{major}.{minor}.{patch}+{build_i}"
text2, n = re.subn(
    r"^version:\s*[0-9]+\.[0-9]+\.[0-9]+\+\d+\s*$",
    f"version: {new}",
    text,
    count=1,
    flags=re.M,
)
if n != 1:
    raise SystemExit("فشل استبدال سطر version في pubspec.yaml")
p.write_text(text2, encoding="utf-8")
print(f"{major}.{minor}.{patch}")
print(build_i)
print(new)
PY
)" || fail "زيادة Build Number فشلت."
  NEW_VERSION="$(printf '%s\n' "$out" | sed -n '1p')"
  NEW_BUILD="$(printf '%s\n' "$out" | sed -n '2p')"
  local full
  full="$(printf '%s\n' "$out" | sed -n '3p')"
  echo "الإصدار الجديد: $full  (Marketing=$NEW_VERSION  Build=$NEW_BUILD)"
}
run_step "زيادة Build Number تلقائياً" do_bump_build

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  echo ""
  echo "${YLW}DRY_RUN=1 — توقّف قبل Archive/الرفع. Build Number أصبح +${NEW_BUILD}.${RST}"
  exit 0
fi

# ── 7) إنشاء Archive ─────────────────────────────────────────
do_archive() {
  flutter build ipa --release \
    --build-name="$NEW_VERSION" \
    --build-number="$NEW_BUILD" \
    || fail "flutter build ipa فشل. راجع التوقيع (Signing & Team) في Xcode ثم أعد المحاولة."

  ARCHIVE_PATH="$ROOT/build/ios/archive/Runner.xcarchive"
  [[ -d "$ARCHIVE_PATH" ]] || fail "لم يُنشأ الأرشيف المتوقع: $ARCHIVE_PATH"

  local found
  found="$(find "$ROOT/build/ios/ipa" -maxdepth 1 -type f -name '*.ipa' 2>/dev/null | head -n 1 || true)"
  [[ -n "$found" ]] || fail "اكتمل الأرشيف لكن لم يُعثر على ملف .ipa تحت build/ios/ipa."
  IPA_PATH="$found"
  echo "الأرشيف: $ARCHIVE_PATH"
  echo "IPA:      $IPA_PATH"
}
run_step "إنشاء Archive وتصدير IPA" do_archive

# ── 8) الرفع إلى App Store Connect ───────────────────────────
do_upload() {
  if [[ "${SKIP_UPLOAD:-0}" == "1" ]]; then
    echo "${YLW}تخطي الرفع (SKIP_UPLOAD=1). IPA جاهز: $IPA_PATH${RST}"
    return 0
  fi

  [[ -f "$IPA_PATH" ]] || fail "مسار IPA غير صالح: $IPA_PATH"

  # أ) مفتاح API (مفضّل) عبر xcrun altool
  if [[ -n "${ASC_KEY_ID:-}" && -n "${ASC_ISSUER_ID:-}" && -n "${ASC_KEY_PATH:-}" ]]; then
    [[ -f "$ASC_KEY_PATH" ]] || fail "ASC_KEY_PATH غير موجود: $ASC_KEY_PATH"
    echo "الرفع عبر xcrun altool (API Key)…"
    local key_dir="$HOME/.appstoreconnect/private_keys"
    mkdir -p "$key_dir"
    local key_basename
    key_basename="$(basename "$ASC_KEY_PATH")"
    if [[ ! -f "$key_dir/$key_basename" ]]; then
      cp "$ASC_KEY_PATH" "$key_dir/$key_basename" || fail "تعذّر نسخ مفتاح API إلى $key_dir"
    fi
    xcrun altool --upload-app \
      --type ios \
      --file "$IPA_PATH" \
      --apiKey "$ASC_KEY_ID" \
      --apiIssuer "$ASC_ISSUER_ID" \
      || fail "فشل الرفع بـ altool (API Key). تحقق من ASC_KEY_ID / ASC_ISSUER_ID / صلاحيات المفتاح."
    return 0
  fi

  # ب) Apple ID + App-Specific Password عبر xcrun altool
  if [[ -n "${APPLE_ID:-}" && -n "${APP_SPECIFIC_PASSWORD:-}" ]]; then
    echo "الرفع عبر xcrun altool (Apple ID)…"
    xcrun altool --upload-app \
      --type ios \
      --file "$IPA_PATH" \
      --username "$APPLE_ID" \
      --password "$APP_SPECIFIC_PASSWORD" \
      || fail "فشل الرفع بـ altool (Apple ID). استخدم كلمة مرور خاصة بالتطبيق من appleid.apple.com."
    return 0
  fi

  # ج) Transporter.app — فتحه مع IPA للرفع اليدوي السريع إن لم تُضبط الاعتمادات
  if [[ -d "/Applications/Transporter.app" ]]; then
    echo "${YLW}لم تُضبط بيانات الاعتماد (ASC_* أو APPLE_ID).${RST}"
    echo "${YLW}فتح Transporter مع ملف IPA…${RST}"
    open -a Transporter "$IPA_PATH" 2>/dev/null || open -a Transporter || true
    fail "الرفع التلقائي غير مكتمل: عيّن ASC_KEY_ID+ASC_ISSUER_ID+ASC_KEY_PATH أو APPLE_ID+APP_SPECIFIC_PASSWORD ثم أعد ./release.sh — أو أكمل الرفع من Transporter. IPA: $IPA_PATH"
  fi

  fail "لا توجد وسيلة رفع متاحة. ثبّت بيانات ASC_* أو APPLE_ID، أو ثبّت تطبيق Transporter من Mac App Store. IPA جاهز: $IPA_PATH"
}
run_step "رفع النسخة إلى App Store Connect" do_upload

echo ""
echo "${GRN}════════════════════════════════════════${RST}"
echo "${GRN}  تم بنجاح — $NEW_VERSION ($NEW_BUILD)${RST}"
echo "${GRN}════════════════════════════════════════${RST}"
echo "IPA:      ${IPA_PATH:-—}"
echo "Archive:  ${ARCHIVE_PATH:-—}"
echo ""
echo "ملاحظة: سطر version في pubspec.yaml أصبح ${NEW_VERSION}+${NEW_BUILD} — اعمل commit عند الجاهزية."
