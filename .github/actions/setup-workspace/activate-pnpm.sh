#!/usr/bin/env bash
# تفعيل pnpm بشكل متين: Corepack مع إعادة محاولة، ثم npm fallback.
# لا يعتمد على كاش محلي مسبقًا — مناسب لـ GitHub Actions runners.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

PM="$(node -p "require('./package.json').packageManager")"
if [[ "$PM" != pnpm@* ]]; then
  echo "[setup-workspace] Invalid packageManager='$PM' — expected pnpm@x.y.z"
  exit 1
fi
PNPM_VER="${PM#pnpm@}"
echo "[setup-workspace] activating pnpm@$PNPM_VER (node=$(node -v))"

activate_via_corepack() {
  # على بعض البيئات enable يفشل على symlink لـ /usr/local/bin بينما prepare ينجح.
  if ! corepack enable; then
    echo "[setup-workspace] corepack enable failed — continuing with prepare"
  fi
  # صيغة صريحة أفضل من --activate بلا إصدار عند فشل الشبكة الجزئي
  corepack prepare "pnpm@$PNPM_VER" --activate
}

ok=0
for attempt in 1 2 3; do
  echo "[setup-workspace] corepack attempt ${attempt}/3"
  if activate_via_corepack; then
    ok=1
    break
  fi
  echo "[setup-workspace] corepack attempt ${attempt} failed"
  sleep $((attempt * 2))
done

if [[ "$ok" -ne 1 ]]; then
  echo "[setup-workspace] corepack failed after retries — falling back to npm install -g pnpm@$PNPM_VER"
  npm install -g "pnpm@$PNPM_VER"
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[setup-workspace] pnpm missing from PATH after activation"
  echo "[setup-workspace] PATH=$PATH"
  exit 1
fi

ACTIVE="$(pnpm --version)"
echo "[setup-workspace] pnpm active: $ACTIVE"
if [[ "$ACTIVE" != "$PNPM_VER" ]]; then
  echo "[setup-workspace] WARNING: expected pnpm@$PNPM_VER but got $ACTIVE"
fi
