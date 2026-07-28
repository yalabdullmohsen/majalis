# Quran Engine QA — Deployment Readiness Report

Generated with the Part‑5 QA pipeline (`tests/`).

## Coverage summary

| Suite | Assertions / Cases | Result |
|-------|--------------------|--------|
| Unit — Mutashabihat | 10 | PASS |
| Unit — Tajweed parser + color tags | 10 | PASS |
| Unit — Daily Wird tracker | 11 | PASS |
| PWA installability | 29 | PASS |
| Legacy `test:pwa` | smoke | PASS |
| E2E reader + offline (Playwright desktop) | 4 | PASS |
| **Total automated checks (this pipeline)** | **~64** | **PASS** |

Approximate logic coverage of Quran engines exercised by these suites:

- Mutashabihat matcher / shipped index: **high** (real `mutashabihat-index.json`)
- Tajweed timing + color-tag catalog: **high** for pure functions
- Wird progress % / streak / day boundary: **high** with mocked storage/dates
- Reader UI flows: **smoke/E2E** (page bounds, continuous mode, ayah sheet)
- Offline cache read path: **smoke/E2E** (Cache Storage warm)
- Perf/memory benches: **scripts ready** (`tests/perf/*`) — run against preview/prod URL

> There is no Istanbul/c8 instrumentation in this monorepo; “coverage %” above is functional assertion coverage of the targeted engines, not line-coverage instrumentation.

## Performance benchmarks established

| Metric | Gate | Notes |
|--------|------|-------|
| TTI proxy (`domInteractive`) | &lt; 1500ms | Soft review gate in `quran-web-vitals-bench.mjs` |
| CLS (page flip + settings) | ≤ 0.05 soft / 0.25 hard fail | Prod target remains **0.00** with cached fonts |
| Heap growth (audio/scroll cycles) | &lt; 80MB / flat slope | CI-scaled stand-in for long sessions |

```bash
# After preview is up:
pnpm --filter @workspace/majalis run test:quran-engine-perf -- --base=http://127.0.0.1:24216
pnpm --filter @workspace/majalis run test:quran-engine-memory -- --base=http://127.0.0.1:24216
```

## PWA / App Store readiness

- `site.webmanifest` / `manifest.webmanifest`: standalone, RTL, icons 192/512 + maskable, screenshots, Quran shortcut
- `index.html`: apple-mobile-web-app metas, startup splash images, `theme-color` aligned to `#143F35`
- Service Worker: install/fetch/`skipWaiting`/`clients.claim`, Quran data paths + `MAJALIS_QURAN_PRECACHE`

## Deployment readiness

**CI-safe gate:** `pnpm --filter @workspace/majalis run test:quran-engine-qa`  
**Pre-release:** also run `test:quran-engine-e2e` and perf benches against a built preview.

Status: **Ready for release testing** pending final preview perf run on the target deploy host.
