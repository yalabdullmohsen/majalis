# Production reliability remediation

**Branch:** `fix/production-reliability-performance`  
**Base commit:** `1622d9e5c2dd6a284bee64ff0a3fb270cd6f51a2`

## Executive summary

Root fixes for AI credit storms, double HTTP responses, long Cron HTTP holds, UUID/slug mixups, and runtime schema migrations. Durable queue + circuit breaker SQL added. Seed-size CSS/JS reductions remain partially open (measured, not silently budget-bumped).

## Root causes → fixes

| Item | Before | After | Status | Evidence |
|---|---|---|---|---|
| AI credit storms | Retries / repeated provider hits | Distributed circuit + no retry on permanent errors | Done (code) | `lib/ai/*`, tests |
| ERR_HTTP_HEADERS_SENT | `sendJson` no guard; 55s timeout then late write | Safe `sendJson` + AbortSignal lifecycle; cron timeout 12s | Done | `_http.mjs`, `request-lifecycle.mjs` |
| Long Cron HTTP | Full AI/DB work in request | Enqueue 202 + job-worker | Partial | source-monitor migrated |
| sort_order | Drift / ignored | SQL ADD + UI `.order(sort_order)` | Code+SQL | migration file; apply manually |
| UUID/slug | Slug queried as UUID | `classifyIdentifier` branch | Done | `getLessonById`, tests |
| Runtime migrations | Cron apply/bootstrap DDL | Blocked unless env unlock | Done | apply-migrations / bootstrap-database |
| Auth TOKEN_REFRESHED | Re-fetched profile | Ignored for refresh; inflight dedupe | Done | AuthProvider, supabase.ts |
| Seed in JS | Multi-MB chunks | **Unchanged this PR** | Remaining | baseline sizes |
| CSS 504KB | At budget ceiling | **Not raised** | Remaining | critical CSS budget |

## Migrations

- `artifacts/majalis/supabase/enterprise_reliability_p0_v1.sql` (manual apply)

## Manual steps remaining

1. Apply SQL in Supabase SQL Editor (Production) after review.
2. Confirm Vercel env does **not** set `ALLOW_RUNTIME_SCHEMA_MIGRATIONS`.
3. GitHub branch protection (see `docs/operations/github-branch-protection.md` if present / CI-CD.md).
4. Continue wrapping remaining long crons with enqueue handlers.
5. Extract seed chunks from client bundle (next PR).

## Merge / Production

This PR must stay **Draft**, **not merged**, **not auto-merged**, **not Production-deployed** by the agent.
