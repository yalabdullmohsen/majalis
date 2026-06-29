# Production Automation Audit — Majalis Al-Ilm
**Date:** 2026-06-29  
**Auditor scope:** Code + Supabase (live REST) + Production HTTP probes + Vercel cron registry  
**Production URL:** https://www.majlisilm.com  
**Machine-readable report:** `reports/production-automation-audit.json`

---

## Executive Summary

| Metric | Value | Notes |
|--------|-------|-------|
| **Automation subsystems in code** | **35+** | AKE, MKE, AKP v3, Content Engines, Import, QGen, etc. |
| **Vercel crons registered** | **48** | `vercel.json` — verified from repo |
| **Code completeness (estimated)** | **~85%** | Handlers, tables, scripts exist for most pipelines |
| **Production verified running (sampled)** | **4/8 core systems** | Live DB + HTTP evidence |
| **Production automation operational (estimated)** | **~45–55%** | Many crons registered; several pipelines idle or failing |
| **Health Dashboard timeout** | **Fixed** | Client 8s → 35s; server queries parallelized |

> **Important:** This audit ran without `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or `DATABASE_URL` in the agent environment. Cron *execution* was inferred from Supabase activity timestamps, not from Vercel logs. Anything not directly probed is marked **غير متحقق**.

---

## 1. Root Findings

### What IS working on Production (verified)

| System | Evidence | Last activity |
|--------|----------|---------------|
| **Content Engines** | `content_engine_runs`: **2,440 rows**; runs today | `lesson-intelligence` 2026-06-29 04:32 UTC (40s) |
| **AKE (Auto Knowledge Engine)** | `ake_connectors`: 25 rows; sync timestamps today | `web-awqaf-kw` sync 2026-06-29 04:23 UTC |
| **Knowledge Search API** | `GET /api/knowledge-search?q=صلاة` → 200, 8 results | 634ms |
| **SEO / Sitemap** | `/sitemap.xml` → 200 (20KB) | 42ms |
| **Public health** | `/api/healthz`, `/api/assistant/health` → 200 | Upstash rate-limit configured |
| **Cron auth** | Unauthenticated POST → **401** on all probed crons | Security enforced ✓ |
| **Notifications engine** | Run today `items_published=50` | 2026-06-29 04:30 UTC |
| **Recommendations engine** | Run today `items_published=66` | 2026-06-29 04:29 UTC |

### What is NOT working / idle (verified)

| System | Evidence | Root cause (likely) |
|--------|----------|---------------------|
| **AKP v3 pipelines** | `akp_content_sources=0`, `akp_pipeline_runs=0` | Bootstrap/seed never completed |
| **Question Generation** | `question_generation_jobs` table **404 (missing migration)**; `sin_jeem_questions=0` | Migration not applied |
| **MKE (Majlis Knowledge Engine)** | `mke_runs=0` | No successful orchestrator runs logged |
| **Content Import (lessons)** | Last 5 jobs: **all `failed`** @ 2026-06-28/29 | Import worker errors (needs log review) |
| **Fiqh Council sync** | `fiqh_council_items=0` | Sync cron unverified; table empty |
| **AKE engine runs** | `ake_engine_runs=0`, `ake_job_queue=0` | Connectors sync but orchestrator runs not persisting |

### غير متحقق (Unverified)

- Vercel Environment Variables inventory (requires Vercel dashboard access)
- Per-cron last-run from Vercel Cron logs (requires Vercel dashboard or `CRON_SECRET`)
- `DATABASE_URL` / index-policy verification via pg_catalog
- Admin `/api/admin/autonomous-platform?action=health` (requires admin JWT)
- Instagram Graph connector (no `INSTAGRAM_GRAPH_*` in agent env)
- Anthropic/OpenAI AI pipelines end-to-end (keys not in agent env)
- Push notification API server (`artifacts/api-server`) separate deployment

---

## 2. Supabase Live Table Audit (Production)

Probed via anon REST key against hosted Supabase:

| Table | Exists | Row count | Status |
|-------|--------|-----------|--------|
| lessons | ✓ | 8 | Low — most content from catalog merge |
| sheikhs | ✓ | 2 | Low |
| fawaid | ✓ | 7 | Active |
| qa_questions | ✓ | 39 | Active |
| content_import_jobs | ✓ | 43 | **Jobs failing** |
| content_engine_runs | ✓ | 2,440 | **Active today** |
| ake_connectors | ✓ | 25 | **Syncing today** |
| knowledge_items | ✓ | 11 | Partial |
| auto_imported_content | ✓ | 10 | Partial |
| akp_content_sources | ✓ | 0 | **Empty — bootstrap blocked** |
| akp_pipeline_runs | ✓ | 0 | **Empty** |
| sin_jeem_questions | ✓ | 0 | Idle |
| question_generation_jobs | ✗ | — | **Migration missing** |
| mke_runs | ✓ | 0 | Idle |
| fiqh_council_items | ✓ | 0 | Empty |

---

## 3. Vercel Cron Registry (48 jobs)

All paths registered in `artifacts/majalis/vercel.json`. Function timeout: **60s**.

**High-frequency (every 1 min):**
- `process-import-jobs`, `ake-queue-drain`, `content-engines-drain`

**Every 15 min:**
- `auto-knowledge-sync`, `connector-health`, `lesson-intelligence`, `source-monitor`, `question-answer-generation-drain`

**Hourly / daily / weekly:** 40+ additional jobs (sync-data, bootstrap, AKE reports, AKP v3, scholarly verification, etc.)

**Cron auth:** Production returns 401 without `Authorization: Bearer $CRON_SECRET`. Vercel-native cron headers may still invoke handlers — **individual invocation success غير متحقق without Vercel logs**.

---

## 4. Secrets Matrix

| Secret | Agent env | Production (inferred) | Used by |
|--------|-----------|----------------------|---------|
| VITE_SUPABASE_URL | ✓ | ✓ (public-config) | Client + REST |
| VITE_SUPABASE_ANON_KEY | ✓ | ✓ | Client + probes |
| SUPABASE_SERVICE_ROLE_KEY | ✗ | **Likely ✓** (crons write DB) | Crons, admin APIs |
| CRON_SECRET | ✗ | **Likely ✓** (401 enforced) | Cron auth |
| DATABASE_URL | ✗ | **غير متحقق** | Migrations, pg_catalog |
| OPENAI_API_KEY | ✗ | **غير متحقق** | Embeddings, semantic |
| ANTHROPIC_API_KEY | ✗ | **غير متحقق** | Vision, AI generation |
| UPSTASH_REDIS_* | ✗ | **Likely ✓** (assistant health) | Rate limiting |
| INSTAGRAM_GRAPH_* | ✗ | **غير متحقق** | Instagram engine |

---

## 5. Health Dashboard Timeout — Root Cause & Fix

**Symptom:** `/admin/platform/health` shows timeout / fails to load.

**Root cause:**
1. Client `fetchProductionHealth()` used default **8s** timeout (`REQUEST_TIMEOUT_MS`)
2. Server `buildAkpProductionHealth()` runs **15+ sequential** DB probes (~15s observed in audit)

**Fix applied (this branch):**
- `fetchProductionHealth()` → **35s** client timeout
- `getDatabaseHealth()` → parallel `countTableRows` via `Promise.all`
- `buildAkpProductionHealth()` → parallel independent sections

---

## 6. Systems Inventory (abbreviated)

| # | System | Cron | Production status |
|---|--------|------|-------------------|
| 1 | Content Engines | ✓ | **Running** |
| 2 | AKE | ✓ | **Running** (connectors); runs table empty |
| 3 | Content Import | ✓ | **Running, failing jobs** |
| 4 | AKP v3 | ✓ | **Not producing** |
| 5 | MKE | ✓ | **Idle** |
| 6 | Lesson Intelligence | ✓ | **Running** |
| 7 | Question Generation | ✓ | **Migration missing** |
| 8 | Auto Content Sync | ✓ | Partial (10 rows) |
| 9 | Knowledge Sync | ✓ | Partial (11 items) |
| 10 | Scholarly Verification | ✓ | غير متحقق |
| 11 | Islamic Intelligence | ✓ | غير متحقق |
| 12 | AI Agents | ✓ | غير متحقق |
| 13 | Verified Knowledge | ✓ | غير متحقق |
| 14 | Knowledge Reasoning | ✓ | غير متحقق |
| 15 | Platform Bootstrap | ✓ | Blocked without secrets in agent |
| 16 | apply-migrations | ✓ | غير متحقق |
| 17 | sync-data (prayer/occasions) | ✓ | غير متحقق |
| 18 | Fiqh Council sync | ✓ | **Empty table** |
| 19 | OCR/Vision (embedded) | — | غير متحقق (needs ANTHROPIC) |
| 20 | SEO/Sitemap | request | **Running** |

*(Full inventory: 35+ subsystems — see agent exploration report)*

---

## 7. Fixes Applied

| File | Change |
|------|--------|
| `src/lib/autonomous-platform-api.ts` | Health fetch timeout 8s → 35s |
| `lib/autonomous-platform/v3/production-health.mjs` | Parallel DB counts + parallel health sections |
| `scripts/audit-production-automation.mjs` | **New** — live production audit script |
| `package.json` | `audit:production-automation` script |

---

## 8. Required Owner Actions (cannot fix from code alone)

1. **Apply missing migration:** `supabase/question_generation_v1.sql`
2. **Verify Vercel secrets:** `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
3. **Bootstrap AKP v3:** trigger `apply-migrations?scope=activation-tables` then `autonomous-platform-bootstrap`
4. **Investigate import failures:** review `content_import_jobs.error_message` in Supabase
5. **Verify Vercel cron logs** for all 48 jobs (dashboard → Cron Jobs → Logs)

---

## 9. Verification Commands

```bash
# Live production audit
pnpm --filter @workspace/majalis run audit:production-automation

# Infrastructure readiness (needs env vars)
pnpm --filter @workspace/majalis run audit:infrastructure

# With CRON_SECRET (owner):
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.majlisilm.com/api/cron/system-health"

curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.majlisilm.com/api/cron/apply-migrations?scope=question-generation"
```

---

## 10. Conclusion

**Production automation is partially live.** Content Engines and AKE connectors demonstrate active cron execution today. However, **AKP v3, question generation, MKE, and import pipelines are not delivering production value** — either due to missing migrations, empty bootstrap, or failing jobs.

**Estimated production automation operational rate: ~45–55%** (not 100%).  
**Code completeness: ~85%** — most handlers exist; gaps are migrations, secrets, and bootstrap.

The Health Dashboard timeout is fixed in code; deploy required for production effect.
