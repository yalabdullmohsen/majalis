# سُنّة — P0 Architecture Map

## Layers (target)

```
Presentation (views / components / hooks)
  → Application (use cases)
    → Domain (entities / ports)
      ← Infrastructure (Supabase, storage, HTTP, audio engines)
```

## Entry points

| Entry | Location |
|---|---|
| Web SPA | `artifacts/majalis/src/main.tsx` / `App.tsx` |
| Vite build | `artifacts/majalis` package `build` |
| Capacitor iOS/Android | `artifacts/majalis/ios`, android under same artifact |
| API server | `artifacts/api-server` |
| CI verify | `scripts/verify-ci.mjs` |

## Critical subsystems (inventory — not consolidated in P0)

### Audio (parallel surfaces — consolidation = P2)

| Implementation | Path | Classification |
|---|---|---|
| App audio coordinator | `src/lib/audio/app-audio-coordinator.ts` | **production_required** (single-active policy target) |
| Exclusive audio bus | `src/lib/exclusive-audio-bus.ts` | **production_required** |
| Core AudioEngine | `src/core/audio/AudioEngine.ts` | **production_required** (tilawa) |
| Quran mini player | `src/lib/quran-mini-player.ts` + UI docks | **production_required** |
| Adhan services | `src/lib/adhan-audio-service.ts`, adhan playback | **production_required** |
| Lesson / majlis audio | majlis audio service + lesson players | **production_required** |
| Web Speech read-aloud | `src/lib/speech-read-aloud.ts` | **legacy_in_use** (stories); must stop via bus |
| Audio reader (P0 feature branch) | `src/lib/audio-reader/*` | may land via separate PR — **do not fork third player** |

### Content resolution / search

| Implementation | Path | Notes |
|---|---|---|
| Knowledge content resolver | `src/lib/knowledge-platform/content-resolver.ts` | Candidate SoT |
| Universal search | `src/lib/knowledge-platform/universal-search.ts` | |
| Sync deep-link map | `src/lib/sync-engine/deep-link-map.ts` | Deep links |

### Data

| Surface | Path |
|---|---|
| Hosted Supabase | browser direct |
| `lib/db` | Drizzle package (limited) |
| `artifacts/supabase` | SQL apply |
| majalis content JSON | `public/data/**` — treat religious corpora as **protected_content** |

## Cross-cutting risks detected in P0 survey

1. **Multiple audio entry points** — coordinator + bus + engines; speech historically outside bus (mitigated when audio-reader / stop hooks land).
2. **531 package scripts** on majalis — high script surface; cleanup needs inventory before deletion.
3. **Frozen packages still in workspace** — mobile/flutter/pitch filtered from root build but still enlarge repo cognitive load.
4. **Barrel / platform packages** — risk of cycles (`lib/*` ↔ artifacts); enforce direction app→lib only.

## Dependency rule (enforce in later CI gates)

- UI must not open Supabase ad-hoc for domain merges (strangler via ports).
- No new parallel AudioCoordinator / NotificationScheduler / ContentResolver.
- Protected content paths never reformatted by codemods.

Machine-readable sketch: `architecture-inventory.json`.
