# Majlisilm Flutter — Modular Monorepo (Phase 1)

## Architecture

```
artifacts/majlisilm-flutter/
├── pubspec.yaml
└── lib/
    ├── main.dart                 # User app entry (Phase 1)
    ├── shared/                   # Shared models + theme (both modules)
    ├── user_app/                 # PHASE 1 — complete
    │   ├── controllers/          # UserQuranAppController, UserEducationalProgressController
    │   ├── services/             # Audio, LocalStorage
    │   ├── data/                 # Quran repository sample
    │   ├── widgets/              # AI recitation, sheets, tafsir
    │   └── views/                # Reader, educational paths, shell
    └── admin_panel/              # PHASE 2 — wait for "Continue Phase 2"
```

### Namespacing

| Concern | User module | Admin module (Phase 2) |
|---|---|---|
| Quran / reading state | `UserQuranAppController` | — |
| Progress / Adhkar | `UserEducationalProgressController` | — |
| Audio | `UserAudioPlayerService` | `AdminAudioPreviewService` (P2) |
| Storage | `UserLocalStorageService` | `AdminLocalStorageService` (P2) |
| Review queue | — | `AdminReviewController` (P2) |

### Phase 1 stack

- **Provider** — ChangeNotifier controllers
- **just_audio** — URL MP3 playback (everyayah)
- **shared_preferences** — font, theme, last verse, progress
- **speech_to_text** — `ar_SA` recitation matching
- **SystemUiMode.immersiveSticky** — distraction-free reader
- Theme: cream `#F5F5DC` / dark `#1A1A1A`

### Run (with Flutter SDK)

```bash
cd artifacts/majlisilm-flutter
flutter pub get
flutter run
```

### Phase gate

**Stop after Phase 1.** Do not implement `admin_panel` until the signal: `Continue Phase 2`.
