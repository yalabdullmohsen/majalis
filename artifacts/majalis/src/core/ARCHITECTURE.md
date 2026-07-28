# Quran Engine — architecture scaffold

Initialized under `artifacts/majalis/src/` (app root in this monorepo).

```
src/
  core/
    index.ts
    quran/
      index.ts
      DatabaseManager.ts      # stub
      QuranEngineContext.ts   # stub
    audio/
      index.ts
      AudioEngine.ts          # stub
    tafseer/
      index.ts
      TafseerService.ts       # stub
  components/
    QuranViewer.tsx           # stub
    QuranActionBar.tsx        # stub
    HomeDashboard.tsx         # stub
  hooks/
    useQuranEngineCore.ts     # stub for new core (legacy useQuranEngine.ts kept)
  tests/
    core-engine.sample.test.ts
```

Smoke: `npx tsx src/tests/core-engine.sample.test.ts`
