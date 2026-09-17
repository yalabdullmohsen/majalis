# Signing Inventory — سُنّة 1.0.0 (no secrets)

| Item | Status in repo | Notes |
|---|---|---|
| iOS project | Present `artifacts/majalis/ios/App/App.xcodeproj` | |
| Entitlements | `App.entitlements` (+ debug/release) | Inspect locally; do not commit secrets |
| PrivacyInfo | `PrivacyInfo.xcprivacy` | Present |
| Android keystore path (config ref) | `majalisilm-release.keystore` via env placeholders | Passwords via CI secrets only |
| APNs / FCM secrets | Not in git | OWNER CI secrets |
| Fastlane / TestFlight workflows | Present under `.github/workflows` | Tag/manual — not auto on web merge |

**Status:** signing **not verified** in this session (no Archive/AAB produced).
