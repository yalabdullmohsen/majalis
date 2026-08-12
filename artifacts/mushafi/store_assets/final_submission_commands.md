# Final Submission Commands

## Full check

```bash
./scripts/release_check.sh
```

## Android App Bundle

```bash
flutter build appbundle --release
```

Output:
`build/app/outputs/bundle/release/app-release.aab`

## Android APK for manual testing

```bash
flutter build apk --release
```

Output:
`build/app/outputs/flutter-apk/app-release.apk`

## iOS Release Build

```bash
flutter build ios --release
```

Then use Xcode Organizer to archive and upload to App Store Connect if required.

## ASR Server

```bash
cd server/tasmee3_asr
docker compose up --build
```

## Quran Check

```bash
dart run scripts/check_quran_asset.dart
```
