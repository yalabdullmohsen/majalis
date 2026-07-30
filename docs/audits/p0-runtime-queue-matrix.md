# P0 Runtime Queue Matrix — Phase 1 (re-verified on main `8472d205`)

| job_type | cron source (vercel.json) | worker | timeout | retry | DLQ | idempotency | status |
|---|---|---|---|---|---|---|---|
| source-monitor | `*/30 * * * *` | yes | worker 8s / cron HTTP 12s | exponential | yes | `jobType[:mode][:job]:YYYY-MM-DDTHH` | OK |
| lesson-source-monitor | `30 6 * * *` | yes (alias) | same | same | yes | same | OK |
| lesson-intelligence | `15,45 * * * *` | yes | same | same | yes | same | OK (was dead-letter) |
| majlis-knowledge-engine | `5 * * * *` | yes | same | same | yes | includes `metadata.mode` | OK (mode fixed) |
| content-scheduler | `0 * * * *` | yes | same | same | yes | includes `metadata.job` | OK (job fixed) |
| auto-content-sync | `0 3 * * *` | yes | same | same | yes | same | OK |
| auto-knowledge-sync | `30 2 * * *` | yes | same | same | yes | same | OK (was dead-letter) |
| islamic-intelligence | `0 10 * * *` | yes | same | same | yes | same | OK |
| knowledge-reasoning | `30 11 * * *` | yes | same | same | yes | same | OK |
| verified-knowledge | `0 11 * * *` | yes | same | same | yes | same | OK |
| scholarly-verification | `0 8 * * *` | yes | same | same | yes | same | OK |
| ai-agents | `30 10 * * *` | yes | same | same | yes | same | OK |
| autonomous-platform | path suffixes (fetch/validate/…) | yes | same | same | yes | includes mode | OK (mode fixed) |
| autonomous-platform-recovery | `*/15 * * * *` | yes | same | same | yes | mode=recovery | OK |
| telegram-processor | `*/5 * * * *` | yes | same | same | yes | same | OK (was dead-letter) |
| process-import-jobs | `*/10 * * * *` **inline** | yes (also registered) | inline path | n/a | n/a | n/a | OK |
| knowledge-sync | `0 2 * * *` | yes | same | same | yes | same | OK (was dead-letter) |
| platform-bootstrap | `30 4 * * *` | yes (verify-only) | same | same | yes | same | OK |
| autonomous-orchestrator | `15 8 * * *` | yes | same | same | yes | same | OK (was dead-letter) |
| monitor-sources | `10 6 * * *` | yes | same | same | yes | same | OK |
| content-scoring | `0 1 * * *` | yes | same | same | yes | same | OK (was dead-letter) |
| global-reference-review | `0 9 * * 0` | yes | same | same | yes | same | OK (was dead-letter) |
| researches-daily-import | `20 5 * * *` | yes | same | same | yes | same | OK (was dead-letter) |
| universities-review | `0 2 * * 1` | yes | same | same | yes | same | OK (was dead-letter) |
| sync-data | `5 21 * * *` | yes | same | same | yes | same | OK (was dead-letter) |
| sync-fiqh-council | `0 6 * * *` | yes | same | same | yes | same | OK (was dead-letter) |
| import-phase2-trial | no vercel cron (manual) | yes | same | same | yes | same | OK |
| governance-backup | `10 4 * * 0` | yes | same | same | yes | mode=backup | OK (was dead-letter) |
| job-worker | `*/5 * * * *` | processor | 8s deadline + AbortSignal | n/a | n/a | n/a | OK |

## Guarantees after Phase 1

1. Every `ALLOWED_JOB_TYPES` entry has a `JOB_WORKERS` runner.
2. Enqueue returns **503 `no_worker_registered`** (not fake 202) if a worker is missing.
3. Enqueue returns **503** when durable Postgres store is unavailable (no Production memory fallback).
4. Claim uses `FOR UPDATE SKIP LOCKED` + `pg_try_advisory_xact_lock(hashtext('bgjob:'||job_type))` + blocks second active lease per `job_type`.
5. Attempts written to `background_job_attempts`; DLQ to `background_job_dead_letters`.
6. Worker deadline aborts via `AbortController` so subordinate work stops.

## SQL (not applied to Production by this PR)

- Apply: `artifacts/majalis/supabase/background_jobs_runtime_hardening_v1.sql`
- Rollback: `artifacts/majalis/supabase/background_jobs_runtime_hardening_v1_ROLLBACK.sql`
