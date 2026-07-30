# Performance Baseline — 2026-07-30

Measured on commit `8e6495cff` (`main`) before optimizations on branch `perf/production-optimization`.

Environment: Linux CI agent (Node 24), `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build`.

## Build

| Metric | Value |
|---|---|
| Vite build wall (from log) | ~11.23s (vite) / ~16s end-to-end with prerender |
| Peak RSS during build | **not measured** (`/usr/bin/time` unavailable on this host) |

## Initial / largest assets (post-build `dist/assets`)

| Asset | raw KiB | gzip KiB | brotli KiB |
|---|---:|---:|---:|
| `index-*.js` (main entry) | 1403.9 | 299.4 | 228.8 |
| `index-*.css` | 492.5 | 90.0 | 69.2 |
| `icons-*.js` (lucide manualChunk) | 557.3 | 146.1 | 116.1 |
| `vendor-*.js` | 186.7 | 59.5 | 51.5 |
| `supabase-*.js` | 204.6 | 53.2 | 44.9 |
| `fawaid-curated-seed-*.js` | 1345.4 | 128.6 | 53.3 |
| `DurusMutanawwiaPage-*.js` | 1101.9 | 83.3 | 47.3 |

**Budget targets (first pass):** Initial JS gzip ≤ 350 KiB · single chunk gzip ≤ 150 KiB (except justified content) · main CSS gzip ≤ 100 KiB.

Baseline: Initial JS gzip **299.4 KiB** (under 350) but raw 1.4MB; icons gzip **146 KiB**; CSS gzip **90 KiB** (OK).

## Root causes identified (static analysis)

1. Shell pulls `daily-content` → full `fawaid-seed` (~501 KiB src) + `adhkar-seed` (~200 KiB) + `arbaeen-nawawi` via NavBar/HeaderTicker.
2. Eager `NotFound` + `SectionQuiz` → `islamicQuizData` (~166 KiB) in shell.
3. `DiscoverIslamPage` `import * as LucideIcons` inflates icons chunk.
4. `demo-content` static import of `FAWAID_CURATED_CATEGORIES` from 1.4MB seed file.
5. `fetchApprovedLessonsFromDb` used `select('*')` without limit.
6. `api/_deps.mjs` eagerly imported `@anthropic-ai/sdk` + `pg` on every serverless invoke.

## Home request count / Lighthouse / CWV

| Check | Result |
|---|---|
| Home network request count | **Not measured in this environment** (no headless browser with auth/network harness run yet) |
| Lighthouse Mobile (home/mushaf/prayer/lessons) | **Not executed** — Chrome/Lighthouse CLI not verified in this agent session at baseline time |
| Core Web Vitals field data | **Not available** from CrUX in this run |

## Seeds & select('*')

| Item | Count/Size |
|---|---|
| `src/lib/fawaid-seed.ts` | 501.3 KiB |
| `src/lib/adhkar-seed.ts` | 199.7 KiB |
| `src/lib/fawaid-curated-seed.ts` | 1388.5 KiB |
| `src/lib/arbaeen-nawawi-seed.ts` | 63.4 KiB |
| `src/data/islamicQuizData.ts` | 165.8 KiB |
| Client `select('*')` occurrences (src) | dozens across admin/fiqh/dawah (critical path: lessons list) |

## Vercel functions

| Item | Note |
|---|---|
| Entry | `api/index.js` → lazy `api-dispatch.mjs` |
| Route table size | ~460 lines in `api-dispatch.mjs` |
| Heavy cold-start risk | `_deps.mjs` previously pulled Anthropic+pg globally |

## iOS/Capacitor

Baseline web `dist/` is what `cap sync` copies. No Archive/TestFlight in this phase.
