# Majlisilm Flutter — Modular Monorepo (Phase 1)

## Architecture

```
artifacts/majlisilm-flutter/
├── pubspec.yaml
└── lib/
    ├── main.dart                 # User app entry (Phase 1)
    ├── features/
    │   └── ai_recitation/        # Tarteel-style AI recitation + alignment
    ├── shared/                   # Shared models + theme (both modules)
    ├── user_app/                 # PHASE 1 — complete
    │   ├── controllers/          # UserQuranAppController, UserEducationalProgressController
    │   ├── services/             # Audio, LocalStorage
    │   ├── data/                 # Quran repository sample
    │   ├── widgets/              # Sheets, tafsir, AI launcher
    │   └── views/                # Reader, educational paths, shell
    └── admin_panel/              # PHASE 2 — wait for "Continue Phase 2"
```

### Namespacing

| Concern | User module | Admin module (Phase 2) |
|---|---|---|
| Quran / reading state | `UserQuranAppController` | — |
| AI recitation | `features/ai_recitation` (`AiRecitationController`) | — |
| Progress / Adhkar | `UserEducationalProgressController` | — |
| Audio | `UserAudioPlayerService` | `AdminAudioPreviewService` (P2) |
| Storage | `UserLocalStorageService` | `AdminLocalStorageService` (P2) |
| Review queue | — | `AdminReviewController` (P2) |

### Phase 1 stack

- **Provider** — ChangeNotifier controllers
- **just_audio** — URL MP3 playback (everyayah)
- **record** — 16 kHz / 16-bit mono PCM mic streaming for ASR
- **web_socket_channel** — optional cloud ASR streaming
- **shared_preferences** — font, theme, last verse, progress
- **speech_to_text** — on-device `ar_SA` fallback recognition
- **SystemUiMode.immersiveSticky** — distraction-free reader
- Theme: cream `#F5F5DC` / dark `#1A1A1A`

### Run (with Flutter SDK)

```bash
cd artifacts/majlisilm-flutter
flutter pub get
flutter run
```

### iOS release (macOS + Xcode)

```bash
cd artifacts/majlisilm-flutter
./release.sh
```

التفاصيل وبيانات App Store Connect في `IOS_RELEASE.md`.

### Phase gate

**Stop after Phase 1.** Do not implement `admin_panel` until the signal: `Continue Phase 2`.
