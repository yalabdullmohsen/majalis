# Quran Engine (محرك القرآن)

Offline-first Quran reading surface inside **مجالس العلم** (`artifacts/majalis`).

Route: `/quran-engine` (dashboard) · `/quran-engine/viewer` (mushaf list + action bar)

## Stack (this module)

| Layer | Choice |
|---|---|
| State | `QuranEngineProvider` + Context API |
| Local DB | Dexie.js (`DatabaseManager`) |
| Audio | `AudioEngine` (HTML5 Audio singleton) |
| Tafsir | `TafseerService` (memory → IndexedDB → AlQuran Cloud) |
| Theme | Platform `ThemePreferenceProvider` (dark/light toggle on dashboard) |

See [CONTRIBUTING.md](./CONTRIBUTING.md) for architectural rationale.

## Prerequisites

From the monorepo root (`/workspace` or your clone root):

- Node.js **24**
- **pnpm** (workspace package manager)
- Optional: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (platform auth/data — Quran Engine local DB works without them)

## Run (development)

```bash
cd /path/to/majalis-correct   # monorepo root
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run dev
```

Open: [http://localhost:24216/quran-engine](http://localhost:24216/quran-engine)

`PORT` and `BASE_PATH` are **required** — the Vite app throws on startup if either is missing.

## Test

Targeted Quran Engine suites (from package or via filter):

```bash
# IndexedDB / Dexie layer
pnpm --filter @workspace/majalis run test:quran-db

# Scaffold / context smoke
pnpm --filter @workspace/majalis run test:quran-scaffold

# AudioEngine unit tests
pnpm --filter @workspace/majalis run test:quran-audio
```

Or from `artifacts/majalis`:

```bash
pnpm run test:quran-db
pnpm run test:quran-scaffold
pnpm run test:quran-audio
```

## Build (production)

Quality gate for this package (does **not** run root `tsc` typecheck that hits known UI-kit noise):

```bash
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
```

Production static serve (Express + `/api/assistant`):

```bash
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run start
```

## Key paths

```
artifacts/majalis/src/
  quran/               RN-shaped façade (assets/components/screens/hooks/context/services/constants)
  core/quran/          DatabaseManager, QuranEngineContext
  core/audio/          AudioEngine
  core/tafseer/        TafseerService
  components/          HomeDashboard, QuranViewer, QuranActionBar
  pages/quran/QuranEnginePage.tsx
  styles/quran-engine-ui.css
  hooks/useQuranEngine.ts
  tests/               database-manager, audio-engine, scaffold
```

See [`src/quran/README.md`](../quran/README.md) for the React Native folder mapping.
## PWA (additive)

- Manifest: `public/quran-engine-manifest.json`
- Service worker: `public/quran-engine-sw.js`
- Workbox config: `workbox-quran-engine.config.cjs`

These are **additive** — they do not replace the platform `sw.js` / main manifest.

## Error handling

- `QuranEnginePage` is wrapped in the platform `ErrorBoundary`.
- DB / audio / tafsir async paths catch failures and surface Arabic UI fallbacks (no white-screen crashes for missing audio or tafsir).
