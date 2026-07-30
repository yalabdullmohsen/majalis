# iOS NATIVE VALIDATION

## Host constraint (Linux cloud agents)

`xcodebuild` / Simulator / Instruments: **NOT AVAILABLE** on Linux. Real native evidence runs on:

1. GitHub Actions `macos-latest` via `.github/workflows/ios-native-macos.yml` (required when iOS paths change)
2. Local Mac with Xcode for Archive / device matrix

This agent must **not** claim Simulator/Archive/TestFlight success without macOS logs.

## Hard rules

- Do **not** change Bundle ID, Signing, or App Store Connect settings
- Do **not** upload TestFlight automatically
- Do **not** use `try?` to hide AVAudioSession critical failures

## What CI proves (macOS job)

When paths under `artifacts/majalis/ios/**` (or Capacitor config / native TS bridges) change:

1. `pnpm install --frozen-lockfile` + web `build` + `cap sync ios`
2. Debug simulator `clean build`
3. Release `CODE_SIGNING_ALLOWED=NO` `clean build`
4. `xcodebuild test` only if an XCTest target exists

Ubuntu job `ios-capacitor-gates` remains static JS/string gates only.

## Manual device matrix (physical iPhone — REQUIRES_EXPLICIT_APPROVAL / human)

Cold/warm launch, background resume, login + TOKEN_REFRESHED, Quran play/pause, background audio, lock screen, Control Center, AirPods/Bluetooth disconnect, incoming call, Siri, tilawah→tasmi', mic grant/deny, network loss/restore, 90-minute soak, memory/battery/thermal, VoiceOver, Dynamic Type, RTL, Dark Mode, Reduce Motion, deep links, notifications, prayer times, upgrade with stale user data.

## Local Mac commands

```bash
cd artifacts/majalis
pnpm install --frozen-lockfile
pnpm run build
pnpm exec cap sync ios
cd ios/App
xcodebuild -version
xcodebuild -list -project App.xcodeproj
xcrun simctl list devices available
# UDID=<pick available iPhone>
xcodebuild -project App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -destination "platform=iOS Simulator,id=$UDID" clean build
xcodebuild -project App.xcodeproj -scheme App \
  -configuration Release -destination 'generic/platform=iOS' \
  CODE_SIGNING_ALLOWED=NO clean build
```

Archive: use current Signing settings unchanged; do not force-sign from CI secrets in this program unless explicitly approved.

## Native hardening in this PR

- `AppDelegate`: media-services reset + lifecycle notifications (no launch-time session activate)
- `MajlisPlaybackAudioPlugin`: resume after interruption with logged errors
- Speech / Recitation capture: replace silent `try?` deactivate with logged + listener/`reject`
