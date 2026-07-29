# iOS NATIVE VALIDATION

## Host constraint (this agent)

`xcodebuild` / Simulator / Instruments: **NOT AVAILABLE** (Linux).

## What exists on main today

- `.github/workflows/ios-capacitor-gates.yml` → `ubuntu-latest` static string/file gates only.
- `scripts/test-ios-capacitor-gates.mjs` + `ios-stability-audit.test.ts` (JS).
- **No** XCTest execution, **no** Archive evidence from CI.

## Required macOS evidence (future Required Check)

```bash
cd artifacts/majalis
pnpm install --frozen-lockfile
pnpm run build
pnpm exec cap sync ios
cd ios/App
xcodebuild -list -project App.xcodeproj
# pick AVAILABLE_SIMULATOR_UDID from: xcrun simctl list devices available
xcodebuild -project App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -destination 'platform=iOS Simulator,id=<UDID>' clean build
xcodebuild -project App.xcodeproj -scheme App \
  -destination 'platform=iOS Simulator,id=<UDID>' test \
  -resultBundlePath build/TestResults.xcresult
```

## Device matrix (manual — REQUIRES physical iPhone)

Playback, background, interruptions, Bluetooth, 90-minute session — document logs/timings; do not claim pass without device.

## Signing / Archive

Do not change Bundle ID / Team. If Archive fails for signing, record exact error; do not invent success.
