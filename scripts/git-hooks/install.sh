#!/usr/bin/env bash
# تثبيت hooks من scripts/git-hooks إلى .git/hooks (لا يغيّر core.hooksPath).
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
SRC="$ROOT/scripts/git-hooks"
DST="$(git rev-parse --git-path hooks)"
mkdir -p "$DST"
for h in pre-commit pre-push; do
  install -m 0755 "$SRC/$h" "$DST/$h"
  echo "installed $DST/$h"
done
echo "hooks:install OK"
