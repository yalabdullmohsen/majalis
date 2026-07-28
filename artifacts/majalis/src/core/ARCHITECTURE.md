# Quran Engine — core implementation

App root: `artifacts/majalis/src/`

## Modules

| Area | Path | Status |
|------|------|--------|
| Database | `core/quran/DatabaseManager.ts` | Dexie singleton |
| State | `core/quran/QuranEngineContext.ts` | Provider + store |
| Audio | `core/audio/AudioEngine.ts` | Play/pause/seek, repeat, teach |
| Tafseer | `core/tafseer/TafseerService.ts` | IDB → API |
| UI | `components/Quran{Viewer,ActionBar}.tsx`, `HomeDashboard.tsx` | Wired |
| Hook | `hooks/useQuranEngine.ts` | Provider or singleton |
| Route | `/quran-engine` | `views/QuranEnginePage.tsx` |
| RN layout façade | `quran/{assets,components,screens,hooks,context,services,constants}` | Re-exports only |

## PWA

- `public/quran-engine-manifest.json`
- `public/quran-engine-sw.js` (Workbox CDN)
- `workbox-quran-engine.config.cjs` (generateSW)

## Tests

```bash
pnpm --filter @workspace/majalis run test:quran-scaffold
pnpm --filter @workspace/majalis run test:quran-db
pnpm --filter @workspace/majalis run test:quran-audio
```
