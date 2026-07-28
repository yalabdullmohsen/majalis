# iOS Release Pipeline — Majlisilm Flutter

## Latest code included

- Commit: hide-on-scroll (`SliverAppBar` floating + snap)
- Version: **`1.0.0+3`** (marketing 1.0.0, build **3**)

## Done on CI agent (Linux)

| Step | Status |
|---|---|
| `flutter clean && flutter pub get` | Done (re-run after hide-on-scroll) |
| `Info.plist` mic/speech/`audio` | Present |
| Dart tests | Passed |
| Verify hide-on-scroll sources | Present (`floating: true`, `snap: true`) |

## Blocked on this Linux agent

| Step | Reason |
|---|---|
| `cd ios && pod install` | `pod: command not found` — needs macOS CocoaPods |
| `flutter build ipa --release` | Flutter Linux SDK has **no** `ipa` subcommand (macOS/Xcode only) |

## Run on Mac (includes latest hide-on-scroll)

```bash
cd artifacts/majlisilm-flutter
git pull
flutter clean && flutter pub get
cd ios && pod install && cd ..
flutter build ipa --release
open ios/Runner.xcworkspace
```

> If `flutter build ipa --release` rejects `--release`, use: `flutter build ipa`

## Xcode — Archive & Distribute (3 steps)

1. **Product → Destination → Any iOS Device (arm64)** then **Product → Archive**
2. Organizer → select archive → **Distribute App**
3. **App Store Connect → Upload** → signing → **Upload**
