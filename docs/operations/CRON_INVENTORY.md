# Cron inventory (Vercel → `/api/cron/*`)

Source of truth: `artifacts/majalis/vercel.json` + `artifacts/majalis/lib/api-handlers/cron/*`.

## Architecture

```
Vercel Cron (schedule)
  → api/index.js router (maxDuration=60)
    → light/health/verify: inline handler
    → heavy work: createEnqueueCronHandler → background_jobs → /api/cron/job-worker
```

| Concern | Behavior |
|---|---|
| Timeout budget | Function ≤ 60s; heavy work enqueued |
| Idempotency | Job keys / claim leases in queue layer |
| Dead-letter | Failed jobs → `background_job_dead_letters` (see OPS_TABLES_RETENTION) |
| Gate | `pnpm run verify:single-response` forbids heavy inline crons |

## Inline allowlist (must stay light)

From `scripts/verify-single-response-pattern.mjs`:

- `system-health`, `auto-content-health`, `connector-health`
- `apply-migrations` (verify-oriented; not Production apply)
- `bootstrap-owner`, `check-fiqh-links`
- `daily-benefit-rotation` (small rotation)
- `job-worker` (claims queued work under deadline)
- `process-import-jobs` (bounded watchdog)
- hybrid health paths in MKE / bootstrap-database

All other scheduled paths **must** use `createEnqueueCronHandler`.

## How to extend safely

1. Prefer enqueue for anything > ~5s or multi-step.
2. Add handler under `lib/api-handlers/cron/`.
3. Register schedule in `vercel.json`.
4. Run `pnpm run verify:single-response`.
5. Do **not** grow one Function into many heavy inline jobs — split via queue.

## Related

- `docs/operations/background-jobs.md`
- `docs/operations/OPS_TABLES_RETENTION.md`
