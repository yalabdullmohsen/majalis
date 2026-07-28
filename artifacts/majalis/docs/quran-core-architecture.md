# Quran Core Architecture (`src/core/quran`)

Functional backend for the Ayah/Tarteel engine — **no UI**.

## Modules

| File | Role |
|------|------|
| `QuranEngineContext.ts` | Unified page / active verse / audio state; boots DB + resources |
| `DatabaseManager.ts` | Async Dexie façade (Khatmah, Reflections, OfflineAssets, knowledge) |
| `ResourceManager.ts` | LRU budget + memory-pressure observer |
| `IndexingService.ts` | Web Workers for mutashabihat flatten + tajweed timings |
| `workers/*.worker.ts` | Off-main-thread compute |
| `bootstrap.ts` | Idle `startQuranCore()` from platform bootstrap |

## How they communicate

```
                    ┌─────────────────────────┐
   UI hooks (later) │  QuranEngineContext     │
   subscribe/get    │  (page, verse, audio)   │
                    └───────────┬─────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
   DatabaseManager      ResourceManager      IndexingService
   (Dexie async)        (pressure/LRU)       (Workers)
            │                   │                   │
            │                   │ suspend flags     │
            │                   └──────────►────────┘
            ▼
   majalis-quran-engine-db
```

1. **Context → DB**: `setActiveVerse` patches the external store, then fire-and-forget `db.getKnowledge` (LRU touch).
2. **Context → Resources**: `boot()` starts `ResourceManager`, which owns pressure listeners.
3. **Resources → Indexing / prefetch**: On moderate/critical pressure, lifecycle flags suspend workers & audio prefetch.
4. **DB → Indexing**: `warmKnowledgeFromMutashabihat` asks the worker to flatten large JSON, then `bulkPut`s rows asynchronously.

All IDB and worker calls are Promise-based; heavy work uses Workers or `requestIdleCallback` fallbacks.
