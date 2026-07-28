# Quran Master Architecture (Web port of Flutter Master Prompt)

Maps the Majlisilm immersive reader Master Prompt onto the Vite/React codebase
(Capacitor-ready). Not a separate Flutter app — same UX contracts via HTML5 /
Wake Lock / StatusBar / Web Speech.

## Layers

| Prompt layer | Module |
|---|---|
| Immersive sticky + parchment `#F5F5DC` | `lib/quran-immersive.ts`, `useImmersiveSystemUi`, `AppController` |
| `QuranController` ChangeNotifier | `lib/quran-controller.ts`, `useQuranController` |
| `QuranAppController` (font/theme/audio track) | `lib/quran-app-controller.ts`, `useQuranAppController`, `ImmersiveQuranApp` |
| `EducationalProgressController` | `lib/educational-progress-controller.ts` |
| `QuranRepository` + tafsir sample | `lib/quran-repository.ts`, `TafsirModalViewer` |
| `SmartSearchEngine` | `lib/smart-search-engine.ts`, `SmartSearchPanel` |
| `MajlisIlmApp` / `MainNavigationScreen` | `components/majlis/MainNavigationScreen.tsx`, `@/majlis` |
| `just_audio` AudioService | `lib/majlis-audio-service.ts` (`HTMLAudioElement` + everyayah) |
| `shared_preferences` LocalStorageService | `lib/majlis-local-storage-service.ts` |
| `speech_to_text` AIRecitationWidget | `components/majlis/AIRecitationWidget.tsx` + `useRecitationTest` |
| `AppController` (wakelock / orientation / immersive) | `lib/app-controller.ts`, `useAppController` |
| PageView + verse tap | `ImmersiveQuranPage` |
| Modal options (audio / tafsir / copy / bookmark) | `ImmersiveVerseOptionsSheet` |
| Audio tracking cursor | `useAudioTrackingCursor` → `.is-reciting` |
| Silent prefs drawer (edge swipe) | `ImmersivePrefsDrawer` |
| Brown@0.15 selection | `VERSE_SELECTED_SOFT_BG` / `.is-selected` |

## Coupling rules

- UI never imports AudioEngine / TafseerService directly for side effects.
- Wire via `onTogglePlayback` / `onToggleAudio`, `onTafsirVerse`, `onCopyVerse`, `onToggleBookmark`.
- `MajlisIlmApp` binds `getMajlisAudioService()` to the verse sheet play/pause and persists prefs via `LocalStorageService`.
- Reading prefs SSOT for immersive sessions: `QuranAppController` (+ hydrate/persist). App-wide prefs may still use `QuranContext` when embedded in existing routes.

## Persistence keys

- Font / dark / last verse → `majlisilm-quran-*`
- Course progress / daily adhkar → `majlisilm-course-progress-v1`, `majlisilm-daily-adhkar-v1`
- Heavier offline caches remain Dexie/`DatabaseManager` (sqflite analogue) — not replaced by prefs.

## Note on Flutter SDK

This monorepo ships the production web/Capacitor port. A native `pubspec.yaml` /
`main.dart` Flutter tree is out of tree; contracts above mirror the Master Prompt APIs.