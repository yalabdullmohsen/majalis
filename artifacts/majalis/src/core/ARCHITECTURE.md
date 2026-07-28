# Quran Engine — architecture scaffold

App root in this monorepo: `artifacts/majalis/src/`  
(Vercel builds from `artifacts/majalis/` — do not put these under repo-root `/src`.)

```
src/
  core/
    index.ts
    quran/
      index.ts
      DatabaseManager.ts
      QuranEngineContext.ts
    audio/
      index.ts
      AudioEngine.ts
    tafseer/
      index.ts
      TafseerService.ts
  components/
    QuranViewer.tsx
    QuranActionBar.tsx
    HomeDashboard.tsx
  hooks/
    useQuranEngine.ts
    useQuranEngineCore.ts   # alias → useQuranEngine
  tests/
    core-engine.sample.test.ts
```

Smoke: `npx tsx src/tests/core-engine.sample.test.ts`
