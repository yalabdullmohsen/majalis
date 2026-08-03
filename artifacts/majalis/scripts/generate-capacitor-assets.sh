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

# Build a 2732×2732 white splash with the logo centered (~40% width).
python3 - "$SRC" "$SPLASH_OUT" <<'PY'
import sys
from pathlib import Path

src_path, out_path = Path(sys.argv[1]), Path(sys.argv[2])
try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", "pillow", "-q"])
    from PIL import Image

SIZE = 2732
canvas = Image.new("RGBA", (SIZE, SIZE), (255, 255, 255, 255))
logo = Image.open(src_path).convert("RGBA")
target_w = int(SIZE * 0.40)
scale = target_w / logo.width
target_h = max(1, int(logo.height * scale))
logo = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
x = (SIZE - target_w) // 2
y = (SIZE - target_h) // 2
canvas.alpha_composite(logo, (x, y))
canvas.convert("RGB").save(out_path, "PNG", optimize=True)
print(f"wrote splash {out_path} ({SIZE}x{SIZE})")
PY

echo "Source assets ready in $ASSETS_DIR"
echo "  logo.png / icon-only.png ← $SRC"
echo "  splash.png ← white 2732 canvas"

echo "Generating platform assets: ${PLATFORM_FLAGS[*]}"
pnpm exec capacitor-assets generate \
  "${PLATFORM_FLAGS[@]}" \
  --iconBackgroundColor "#ffffff" \
  --iconBackgroundColorDark "#143F35" \
  --splashBackgroundColor "#ffffff" \
  --splashBackgroundColorDark "#143F35"

echo "Done. Sync native projects if needed:"
echo "  pnpm exec cap sync ios"
echo "  pnpm exec cap sync android"
