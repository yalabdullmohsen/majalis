# Production Reliability Baseline

**Recorded:** 2026-07-29T13:38Z UTC  
**Base commit:** `1622d9e5c2dd6a284bee64ff0a3fb270cd6f51a2`  
**Branch (work):** `fix/production-reliability-performance`  
**Node:** v24.17.0  
**pnpm:** 10.34.4  

## Workspace layout

Monorepo (`pnpm-workspace.yaml`). Primary web package: `@workspace/majalis` at `artifacts/majalis`.

## Command baseline

| Command | Exit | Duration | Notes |
|---|---:|---:|---|
| `CI=true pnpm install --frozen-lockfile` | 1* | ~1s | Aborted modules purge without `CI` first; with `CI=true` deps already present |
| `pnpm run typecheck:libs` | 0 | ~0s | |
| `pnpm --filter @workspace/majalis run typecheck` | 0 | 3s | |
| `pnpm --filter @workspace/majalis run lint` | 0 | 15s | max-warnings 50 |
| `pnpm --filter @workspace/majalis run test` | 0 | 9s | package test chain |
| `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build` | 0 | 16s (vite ~11.3s) | |

\*Install failure was environment/TTY; lockfile not changed. Subsequent gates used existing `node_modules`.

## Bundle sizes (post-build `dist/assets`, measured)

### Top JS (raw / gzip-9)

| File | Raw | Gzip |
|---|---:|---:|
| quiz-seed-*.js | 4,626,208 | 485,597 |
| qa-seed-*.js | 3,083,503 | 176,477 |
| islamic-stories-seed-*.js | 1,473,074 | 268,847 |
| index-*.js (app entry) | 1,434,428 | 305,556 |
| HadithPage-*.js | 1,420,250 | 188,259 |
| fawaid-curated-seed-*.js | 1,377,663 | 131,892 |
| DurusMutanawwiaPage-*.js | 1,128,352 | 85,359 |
| icons-*.js | 570,695 | 150,023 |

### Critical CSS

| File | Raw | Gzip |
|---|---:|---:|
| index-*.css (main) | **504,162** | 91,977 |

Budget script currently allows ≤ 505,000 raw — **at the ceiling**.

### Build output

- `dist/` total size (all files): **201,327,618** bytes (~192 MB) — includes prerender HTML.
- Prerender: 138 routes generated, 890 HTML pages merged post-build.

## Cron inventory (vercel.json)

35+ cron paths under `/api/cron/*` including long AI/DB pipelines (`source-monitor`, `majlis-knowledge-engine`, `bootstrap-database`, `apply-migrations`, `ai-agents`, …). Dispatch timeout **55s**; Vercel `maxDuration` **60s**.

## Critical risks (P0)

| ID | Risk | Evidence |
|---|---|---|
| P0.1 | AI `credit_exhausted` retried / repeated | `lesson-extractor.mjs` classifies but many callers; no distributed circuit |
| P0.2 | `ERR_HTTP_HEADERS_SENT` | `_http.sendJson` has no `headersSent` guard; timeout 504 then handler continues |
| P0.3 | Long work inside Cron HTTP | 55s timeout on AI/bootstrap jobs |
| P0.4 | `qa_categories.sort_order` drift | `qa_phase4_seed.sql` CREATE without column; UI ignores sort_order |
| P0.5 | Slug → UUID column | `getLessonById` always `.eq("id", id)` first |
| P0.6 | Runtime schema migrations | `/api/cron/apply-migrations`, `bootstrap-database` call `applyMigrations` |
| P0.7 | Seed data in client JS | multi-MB seed chunks in Vite build |

## P1 risks

- Auth: duplicated `getUser`/`getSession` outside AuthProvider; getCurrentUser latency reports historically ~10s.
- `home:upcoming-lessons` / `prayer_times` need EXPLAIN-backed indexes (not measured on prod in this baseline).
- Service Worker + immutable assets already partially hardened; HTML cache / update races remain.

## Next

Remediation on `fix/production-reliability-performance` — see `production-reliability-remediation.md` after fixes.
