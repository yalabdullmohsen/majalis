# Quran Engine QA Pipeline

Dedicated quality gates for the Ayah/Tarteel Quran Engine. **No production UI/layout changes** beyond PWA installability metadata.

## Layout

```
src/tests/             Vitest units + Playwright critical/offline (see TESTING.md)
tests/
  e2e/                 Playwright reader + offline journeys (legacy pipeline)
  unit/                Mutashabihat / Tajweed / Wird / offline schema
  perf/                Web Vitals + memory slope benches
  pwa/                 Installability audit
helpers.ts             Shared Playwright utilities
```

## Commands

```bash
pnpm --filter @workspace/majalis run test:quran-vitest   # NEW — DatabaseManager + Context
pnpm --filter @workspace/majalis run test:quran-e2e      # NEW — critical journey + offline
pnpm --filter @workspace/majalis run test:quran-engine-unit
pnpm --filter @workspace/majalis run test:quran-offline-schema
pnpm --filter @workspace/majalis run test:quran-resource-lifecycle
pnpm --filter @workspace/majalis run test:quran-engine-pwa
pnpm --filter @workspace/majalis run test:quran-engine-e2e     # needs Chromium
pnpm --filter @workspace/majalis run test:quran-engine-perf    # needs preview URL
pnpm --filter @workspace/majalis run test:quran-engine-qa      # unit + offline schema + PWA (CI-safe)
```

Full author guide: [`../TESTING.md`](../TESTING.md)
## Gates

| Area | Gate |
|------|------|
| Mutashabihat | Exact verse arrays from shipped index |
| Tajweed | Timing rules + color-tag catalog hex |
| Wird | pct / streak with mocked dates |
| Offline schema | Dexie store indexes + knowledge flatten transforms |
| Resource lifecycle | LRU/LFU score, 500MB budget defaults, suspend flags |
| E2E | Page bounds, continuous mode, ayah sheet |
| Offline | Cached JSON/fonts after warm |
| Perf | TTI proxy &lt; 1.5s (review), CLS ≤ 0.05 soft / 0.25 hard, flat heap |
| PWA | standalone, icons, SW, iOS splash metas |
