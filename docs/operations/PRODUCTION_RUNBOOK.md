# PRODUCTION RUNBOOK (scaffold)

1. Deploy only from `main` after human merge.
2. Migrations: apply via approved SQL / workflow_dispatch — never via user HTTP.
3. Verify `/api/healthz` and `/api/readyz` after deploy.
4. Watch for `durable_store_unavailable`, `credit_exhausted`, `504`, `http.double_response_blocked`.
5. Cron failures: check Vercel cron logs + `background_jobs` when table exists.

See also `ROLLBACK_RUNBOOK.md`.
