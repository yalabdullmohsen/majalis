# iOS Release Pipeline — Majlisilm Flutter

## Done in this PR (agent)

| Step | Status |
|---|---|
| Generate `ios/` Runner | Done (`flutter create --platforms=ios`) |
| `Info.plist` mic + speech Arabic strings | Done |
| `UIBackgroundModes` → `audio` | Done |
| Display name المجلس العلمي | Done |
| Classic `ios/Podfile` | Done |
| `pubspec.yaml` version `1.0.0+2` | Done (marketing **1.0.0**, build **2**) |
| `flutter clean && flutter pub get` | Done |

## Blocked on this Linux agent

| Step | Reason |
|---|---|
| `pod install` | CocoaPods (`pod`) not installed; requires macOS |
| `flutter build ipa` | **iOS IPA builds are macOS/Xcode-only** — Flutter Linux SDK has no `ipa` subcommand |

Run the remainder on a **Mac with Xcode + CocoaPods + Apple Developer signing**.

## Exact Mac commands

```bash
cd artifacts/majlisilm-flutter
flutter clean && flutter pub get
cd ios && pod install && cd ..
flutter build ipa --release
open ios/Runner.xcworkspace
```

> If your Flutter version rejects `--release` on `build ipa`, use: `flutter build ipa`

## Xcode handoff — Archive & Distribute (3 GUI steps)

1. In Xcode: **Product → Destination → Any iOS Device (arm64)** then **Product → Archive**.
2. Organizer opens → select the archive → **Distribute App**.
3. Choose **App Store Connect** → **Upload** → complete signing → **Upload**.

## Info.plist keys verified

- `NSMicrophoneUsageDescription`: يحتاج التطبيق للميكروفون للاستماع للتلاوة واختبار التسميع الذكي.
- `NSSpeechRecognitionUsageDescription`: يحتاج التطبيق للتعرف على الصوت لمطابقة التلاوة بالنص القرآني.
- `UIBackgroundModes`: `[ audio ]`
