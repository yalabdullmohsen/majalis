#!/usr/bin/env bash
# Preflight for setup-workspace — clear failure before any install.
# Does not require Node (installed in the next step).
set -euo pipefail

echo "[setup-workspace] cwd=$(pwd)"
echo "[setup-workspace] runner_os=${RUNNER_OS:-local}"

missing=0
require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "[setup-workspace] Missing required file: $path"
    missing=1
  else
    echo "[setup-workspace] ok file: $path"
  fi
}

require_file "package.json"
require_file "pnpm-lock.yaml"

if [[ ! -d ".github/actions/setup-workspace" ]]; then
  echo "[setup-workspace] Missing required directory: .github/actions/setup-workspace"
  missing=1
fi

if [[ "$missing" -ne 0 ]]; then
  echo "[setup-workspace] Preflight failed — aborting before Node/pnpm setup."
  exit 1
fi

if ! grep -F '"packageManager": "pnpm@' package.json >/dev/null 2>&1; then
  echo "[setup-workspace] Missing required field: package.json packageManager (expected pnpm@x.y.z)"
  exit 1
fi

echo "[setup-workspace] preflight ok"
