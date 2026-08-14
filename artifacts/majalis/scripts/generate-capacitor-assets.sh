#!/usr/bin/env bash
# Generate iOS (and optionally Android/PWA) icons + splash from a base asset.
#
# Usage (from artifacts/majalis):
#   pnpm run assets:generate
#   pnpm run assets:generate:ios
#   ./scripts/generate-capacitor-assets.sh ./resources/icon.png
#   ./scripts/generate-capacitor-assets.sh --ios-only ./path/to/logo-1024.png
#
# Requirements:
#   - Base image ideally ≥ 1024×1024 PNG (default: resources/icon.png)
#   - @capacitor/assets installed (devDependency)
#   - If sharp fails to load, rebuild once:
#       cd node_modules/.pnpm/sharp@*/node_modules/sharp && npm run install

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PLATFORM_FLAGS=(--ios --android)
BASE_SRC=""

case "${1:-}" in
  --ios-only)
    PLATFORM_FLAGS=(--ios)
    BASE_SRC="${2:-}"
    ;;
  --android-only)
    PLATFORM_FLAGS=(--android)
    BASE_SRC="${2:-}"
    ;;
  --all)
    PLATFORM_FLAGS=(--ios --android --pwa)
    BASE_SRC="${2:-}"
    ;;
  "")
    BASE_SRC=""
    ;;
  *)
    BASE_SRC="$1"
    ;;
esac

DEFAULT_BASE="$ROOT/resources/icon.png"
ASSETS_DIR="$ROOT/assets"
LOGO_OUT="$ASSETS_DIR/logo.png"
SPLASH_OUT="$ASSETS_DIR/splash.png"
ICON_ONLY_OUT="$ASSETS_DIR/icon-only.png"

mkdir -p "$ASSETS_DIR"

SRC="${BASE_SRC:-$DEFAULT_BASE}"
if [[ ! -f "$SRC" ]]; then
  echo "error: base asset not found: $SRC" >&2
  echo "Provide a 1024×1024+ PNG, e.g.:" >&2
  echo "  $0 ./resources/icon.png" >&2
  exit 1
fi

cp "$SRC" "$LOGO_OUT"
cp "$SRC" "$ICON_ONLY_OUT"

# دخولية لون صامت فقط — ممنوع إعادة الصورة القديمة / الخلفية البيضاء
python3 - "$SPLASH_OUT" <<'PY'
from pathlib import Path
out_path = Path(__import__("sys").argv[1])
try:
    from PIL import Image
except ImportError:
    import subprocess, sys
    # macOS/Linux CI: --user يفشل مع externally-managed-environment — جرّب بدون ثم --break-system-packages
    cmds = [
        [sys.executable, "-m", "pip", "install", "pillow", "-q"],
        [sys.executable, "-m", "pip", "install", "--user", "pillow", "-q"],
        [sys.executable, "-m", "pip", "install", "--break-system-packages", "pillow", "-q"],
    ]
    last = None
    for cmd in cmds:
        try:
            subprocess.check_call(cmd)
            break
        except Exception as e:
            last = e
    else:
        raise SystemExit(f"Pillow required but install failed: {last}") from last
    from PIL import Image
SIZE = 2732
# #002b21
canvas = Image.new("RGB", (SIZE, SIZE), (0, 43, 33))
canvas.save(out_path, "PNG", optimize=True)
print(f"wrote solid splash {out_path} (#002b21 {SIZE}x{SIZE})")
PY

echo "Source assets ready in $ASSETS_DIR"
echo "  logo.png / icon-only.png ← $SRC"
echo "  splash.png ← solid #002b21 (no legacy artwork)"

echo "Generating platform assets: ${PLATFORM_FLAGS[*]}"
pnpm exec capacitor-assets generate \
  "${PLATFORM_FLAGS[@]}" \
  --iconBackgroundColor "#002b21" \
  --iconBackgroundColorDark "#002b21" \
  --splashBackgroundColor "#002b21" \
  --splashBackgroundColorDark "#002b21"

# أعد فرض drawable لوني بعد أي مخرجات capacitor-assets قد تعيد PNG
SPLASH_XML="$ROOT/android/app/src/main/res/drawable/splash.xml"
ICON_XML="$ROOT/android/app/src/main/res/drawable/splash_icon.xml"
if [[ -d "$ROOT/android/app/src/main/res" ]]; then
  find "$ROOT/android/app/src/main/res" -name 'splash.png' -delete || true
  rm -f "$ROOT/android/app/src/main/res/drawable/splash_icon.png" || true
  cat > "$SPLASH_XML" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="@color/splash_background" />
</shape>
EOF
  cat > "$ICON_XML" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
    <path android:fillColor="#002b21" android:pathData="M0,0h108v108h-108z" />
</vector>
EOF
  echo "Restored color-only Android splash drawables"
fi

echo "Done. Sync native projects if needed:"
echo "  pnpm exec cap sync ios"
echo "  pnpm exec cap sync android"
