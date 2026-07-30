# Performance Final Report — 2026-07-30

Branch: `perf/production-optimization`  
Baseline commit: `8e6495cff`  
Docs: `docs/performance/PERFORMANCE_BASELINE.md`

## Before → After (measured)

| Metric | Before | After |
|---|---:|---:|
| Entry `index-*.js` gzip | **299.4 KiB** | **143.9 KiB** (−52%) |
| Entry raw | 1403.9 KiB | 524.4 KiB (−63%) |
| Main CSS gzip | 90.0 KiB | 88.9 KiB |
| Icons chunk gzip | 146.1 KiB | **21.4 KiB** (−85%) |
| Entry embeds SEED_FAWAID / ADHKAR / quiz | yes (via shell) | **no** |

Budgets: Initial JS gzip ≤ **160 KiB** ✅ · Icons gzip ≤ **30 KiB** ✅ · CSS gzip ≤ 100 ✅

(Hardened in `release/ios-final-polish` — previously soft 350 / no icons hard gate.)

## Key changes

1. Slim ticker pools (`daily-ticker-dhikr.ts`, `daily-ticker-nawawi.ts`) — removed full seed imports from shell.
2. Lazy `HeaderTicker` + lazy `NotFound`; removed `SectionQuiz` from 404.
3. Split `FAWAID_CURATED_CATEGORIES` from 1.4MB seed file.
4. DiscoverIslam icon allowlist (no `import * as lucide`).
5. Lessons/fawaid/library/miracles/QA column allowlists; lessons `.limit(500)`.
6. React Query: `staleTime` 180s; `mutations.retry = false`.
7. `api/_deps.mjs` no longer eagerly imports Anthropic/pg.
8. Bundle budget + critical-path `select('*')` gates.
9. SQL migration prepared (NOT applied): `supabase/migrations/20260730_perf_indexes_lessons_prayer_expand.sql`.

## Not executed / remaining

| Item | Status |
|---|---|
| Lighthouse Mobile | **Not run** (no Chrome Lighthouse CLI session in this agent) |
| Home network waterfall count | **Not measured** with browser |
| Field CWV / CrUX | **Not queried** |
| xcodebuild Debug/Release | **Unavailable** (Linux host, no Xcode) |
| Apply SQL indexes on Production | **Not applied** (by policy) |
| Content route megachunks (Durus*, PropheticMedicine, fawaid-curated) | Still large on first visit to those routes (lazy) |

## Tests run (all green)

- `pnpm install --frozen-lockfile`
- `pnpm exec tsc -b --clean` + `pnpm exec tsc -b`
- `pnpm -r --if-present run typecheck`
- ESLint `--max-warnings=0`
- Full `pnpm --filter @workspace/majalis run test`
- Production `build` + `test:bundle-budget`
- `verify:no-runtime-ddl`, `verify:single-response`, `verify-no-unsafe-auto-merge`
- `db:migration:verify`, `test:postgres-integration`
- `npx cap sync ios` + `test:ios-gates`

## Risks

- Fawaid list select no longer `*`: if UI relied on undocumented columns, cards may miss fields (source_name mapped).
- Slim ticker no longer pulls curated SEED_FAWAID slice (was empty after quality filter anyway); hardcoded df-1..6 remain.
- Removing Anthropic/pg from `_deps` relies on NFT following handler/dynamic imports — monitor first AI/transcribe deploy.
