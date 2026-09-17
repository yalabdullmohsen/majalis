#!/usr/bin/env bash
# Gate: CFBundleName must be ASCII so App Store IPA filename is valid (ITMS-90168).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$ROOT/ios/App/App/Info.plist"
NAME="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleName' "$PLIST")"
DISPLAY="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleDisplayName' "$PLIST")"
if [[ "$NAME" =~ [^[:ascii:]] ]]; then
  echo "FAIL: CFBundleName contains non-ASCII ($NAME) — IPA would be corrupt for ITMS"
  exit 1
fi
if [[ -z "$DISPLAY" ]]; then
  echo "FAIL: CFBundleDisplayName missing"
  exit 1
fi
echo "OK: CFBundleName=$NAME (ASCII) CFBundleDisplayName=$DISPLAY"
