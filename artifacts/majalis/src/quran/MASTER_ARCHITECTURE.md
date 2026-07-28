# Quran Master Architecture (Web port of Flutter Master Prompt)

Maps the Majlisilm immersive reader Master Prompt onto the Vite/React codebase
(Capacitor-ready). Not a separate Flutter app — same UX contracts via HTML5 /
Wake Lock / StatusBar.

## Layers

| Prompt layer | Module |
|---|---|
| Immersive sticky + parchment `#F5F5DC` | `lib/quran-immersive.ts`, `useImmersiveSystemUi`, `AppController` |
| `QuranController` ChangeNotifier | `lib/quran-controller.ts`, `useQuranController` |
| `AppController` (wakelock / orientation / immersive) | `lib/app-controller.ts`, `useAppController` |
| PageView + verse tap | `ImmersiveQuranPage` |
| Modal options (audio / tafsir / copy / bookmark) | `ImmersiveVerseOptionsSheet` |
| Audio tracking cursor | `useAudioTrackingCursor` → `.is-reciting` |
| Silent prefs drawer (edge swipe) | `ImmersivePrefsDrawer` |
| Brown@0.2 selection | `VERSE_SELECTED_BG` / `.is-selected` |

## Coupling rules

- UI never imports AudioEngine / TafseerService directly for side effects.
- Wire via `onTogglePlayback`, `onTafsirVerse`, `onCopyVerse`, `onToggleBookmark`.
- Reading prefs SSOT remains `QuranContext` / `useQuranPreferences` when embedded in the app shell; Immersive page may hold local font/dark overrides for focus sessions.

## Out of scope (this PR)

Full Hadith/courses/Adhkar lazy stacks and AI recitation UI — existing routes stay;
reuse this controller pattern when extending those surfaces.
