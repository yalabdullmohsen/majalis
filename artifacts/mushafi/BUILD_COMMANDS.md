# Build Commands

## Development

```bash
flutter run
```

## Development with ASR server

```bash
flutter run \
  --dart-define=TASMEE3_ASR_ENDPOINT=http://YOUR_SERVER_IP:8000/transcribe \
  --dart-define=TASMEE3_ASR_WS_ENDPOINT=ws://YOUR_SERVER_IP:8000/ws/live
```

## Analyze and test

```bash
flutter analyze
flutter test
```

## Quran asset check

```bash
dart run scripts/check_quran_asset.dart
```

## Android release

```bash
flutter build appbundle --release
```

## Android apk

```bash
flutter build apk --release
```

## iOS release

```bash
flutter build ios --release
```

## ASR server Docker

```bash
cd server/tasmee3_asr
docker compose up --build
```

## Full release check

```bash
./scripts/release_check.sh
```

## Quick check

```bash
./scripts/quick_check.sh
```
