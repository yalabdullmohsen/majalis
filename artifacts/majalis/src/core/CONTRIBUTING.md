# Contributing to the Quran Engine

This document explains **why** the module is structured the way it is. Prefer extending existing seams over introducing parallel stacks.

## Goals

1. **Offline-first reading** — progress, bookmarks, and tafsir snippets survive refresh and flaky networks.
2. **Single source of truth for verse position** — one engine state drives dashboard, viewer, and audio.
3. **Fail soft** — media/API/IDB failures show Arabic fallbacks; they must not unmount the page.
4. **Stay inside Majalis** — reuse theme, ErrorBoundary, quran-api helpers, and design tokens (`--majalis-*`).

## Why Dexie.js (`DatabaseManager`)

- IndexedDB is the right persistence layer for large-ish offline caches (tafsir) and structured rows (bookmarks).
- Dexie gives typed tables, compound indexes (`verseKey`, `[ayahId+source]`), and a migration story (`version(n).stores`) without hand-rolling IDB boilerplate.
- All public methods **catch and return null/false/[]** so React components never need try/catch just to survive a private-mode browser.

Do **not** add a second local DB for this feature. Extend `QuranAppDatabase` with an additive schema version.

## Why Context API (`QuranEngineProvider`)

- The surface area is small (active verse, tajweed/action-bar flags, reciter, hydrate flag).
- Context keeps the Provider colocated with `/quran-engine` and avoids pulling global app stores into a self-contained module.
- `useQuranEngine` can fall back to a singleton context for non-Provider callers/tests — keep that contract stable.

Prefer Context updates + `DatabaseManager.saveProgress` over inventing a new Redux/Zustand slice unless cross-app coordination becomes unavoidable.

## Why a singleton `AudioEngine`

- Browsers effectively allow one coherent HTML5 Audio timeline for “the” recitation UX; a singleton prevents competing players when navigating dashboard ↔ viewer.
- Snapshot / ayah-change listeners decouple UI from `HTMLAudioElement` details.
- Errors set `playerState: "error"` instead of throwing — the ActionBar owns user messaging.

## Why `TafseerService` layering

```
memory Map  →  IndexedDB cache  →  AlQuran Cloud fetch  →  write-through cache
```

- Memory avoids repeat IDB hits within a session.
- IDB makes previously opened ayahs work offline.
- Network is last resort; `null` means “show friendly empty state.”

## UI conventions

- Styles live in `styles/quran-engine-ui.css` with `qe-*` prefixes — don’t fork a second design system.
- Dark/light uses platform `useThemePreference` / `html[data-theme]` — no local theme store.
- ActionBar sits above `--bottom-nav-total` on mobile so it never covers the app chrome.
- Loading states use shimmer skeletons (surah list + tafsir), not spinners-only.

## Testing expectations

Before pushing Quran Engine changes:

```bash
pnpm --filter @workspace/majalis run test:quran-db
pnpm --filter @workspace/majalis run test:quran-audio
pnpm --filter @workspace/majalis run test:quran-scaffold
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
```

Add unit coverage next to the module under `src/tests/` when changing engine behaviour.

## Git / paths

Always commit from the **monorepo root** so files land under `artifacts/majalis/...` (Vercel builds that tree). Never `git add` from inside `artifacts/majalis` alone in a way that relocates `src/` to the repo root.
