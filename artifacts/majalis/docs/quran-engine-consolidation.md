# Quran Engine Consolidation (Parts 1–4 → production spine)

Integration pass that connects Ayah/Tarteel-grade reader modules without changing UI layout or styling.

## Directory layout (new / primary)

```
artifacts/majalis/src/
  hooks/useQuranEngine.ts          # Context + facade hooks
  components/quran/QuranEngineProvider.tsx
  lib/quran-engine-store.ts        # External store (selective subscribe)
  lib/quran-engine-warm.ts         # IDB + Cache Storage warm (1–604)
  lib/quran-engine-teardown.ts     # Session disposable registry
public/sw.js                       # /data/quran/*, /fonts/qpc-v2/*, MAJALIS_QURAN_PRECACHE
```

## Facade hooks (single source of truth)

| Hook | Role |
|------|------|
| `useQuranEngine` | Active page / verse / qari / player / theme / warm progress |
| `useTarteelVoice` | Recitation highlight state (shared store) |
| `useAudioRepetition` | Loop + teach-phase coordination |
| `useMutashabihat` | Offline IDB similar-ayah access |
| `useThematicQuran` | In-bundle topical index (`quran-topics-index`) |

State lives in `quran-engine-store` (not React Context value) so off-screen consumers can select primitives via `useQuranEngineSelector` and avoid re-renders.

`QuranEngineProvider` only exposes a stable API and starts background warm + teardown on unmount. Wired from `MushafPageView` without className/layout changes.

## Offline warm pipeline

1. Indexes → mutashabihat IDB, chapters, page-juz, local search
2. Near pages (±4) JSON + QPC fonts via SW `MAJALIS_QURAN_PRECACHE`
3. Remaining pages 1–604 in idle chunks (`requestIdleCallback` + `yieldToMain`)
4. SW cache-first for `/data/quran/**`, `/data/quran-v2/**`, `/fonts/qpc-v2/**`

Versioning follows existing `SW_BUILD_ID` from `sw-version.js`.

## Memory / INP / CLS invariants

- `teardownQuranEngineSession()` clears registered disposables on reader exit
- `useAyahPlayer.stop` registered as disposable from MushafPageView
- `useWordAudioSync` cancels `requestAnimationFrame` on unmount
- `useAudioFollowScroll` removes wheel/touch/pointer listeners on unmount
- Warm work yields (`yieldToMain` / idle) so interactions stay on the main-thread budget
- Existing CLS shields (`holdPreviousWhileLoading`, sticky ayah) unchanged

## Prior feature modules (unchanged visually)

Parts 1–4 components remain the reading surface: dual layout, mutashabihat sheet, navigator, khatmah sync, tafsir compare, page curl, wird, teach-repeat, backup, a11y prefs.
