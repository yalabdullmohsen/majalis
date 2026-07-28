# Quran Resource Lifecycle & Memory Pressure

Background manager for the Ayah/Tarteel offline layer. **No UI changes.**

## Goals

| Goal | Mechanism |
|------|-----------|
| Keep footprint ≤ 500MB (configurable) | LRU+LFU eviction on `offline_assets_store` |
| Protect favorites | `pinned: true` never auto-evicted |
| Survive low-RAM devices | `deviceMemory` + heap ratio + `memorypressure` |
| Idle maintenance | `requestIdleCallback` compaction + silent schema migrate |
| Zero session jank | Debounced access touches; warm/prefetch suspend flags |

## Schema v2 (silent)

Additive Dexie upgrade from Part-5 v1:

- `offline_assets_store`: `last_accessed_at`, `access_count`, `pinned`
- `quran_knowledge_store`: `last_accessed_at`, `access_count`
- `user_reflections_store`: `last_opened_at`, `schema_version`

Upgrade runs on DB open; `runSilentSchemaMigrations()` backfills on idle without interrupting reading.

## Eviction policy

1. **Pinned** assets skipped always.
2. **Under budget**: delete only assets inactive > `inactiveDays` (default 14).
3. **Over budget / pressure**: sort by `evictionScore(age / (1+freq) + sizeBias)` and delete until ≤ 85% of budget.
4. **Knowledge**: prune cold rows when over soft cap (12k; 60% under critical pressure).

Budget override LS: `mj-quran-storage-budget-bytes-v1`.

## Pressure response

`purgeUnderMemoryPressure` → `handleQuranMemoryPressure`:

1. Suspend prefetch + full page warm (`lifecycle-flags`)
2. Purge registered off-screen canvases + ayah object URLs + audio disposers
3. `enforceStorageBudget({ pressure })`

## Idle job

Every ~45 min + boot idle:

- `compactQuranOfflineStores` — orphan meta, stuck downloads, outbox prune, field integrity
- `runSilentSchemaMigrations`
- Soft `enforceStorageBudget`

## API

```ts
import {
  startQuranResourceLifecycle,
  setAssetPinned,
  setLifecycleBudgetBytes,
  enforceStorageBudget,
  registerEphemeralCanvas,
} from "@/lib/quran-offline";
```

Booted from `startQuranOfflineStorage()` (already wired in platform bootstrap).
