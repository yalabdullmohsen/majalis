# Background jobs

## Flow

1. Vercel Cron hits `/api/cron/<job>` → auth → `enqueueJob` → **HTTP 202**.
2. `/api/cron/job-worker` (every 5 minutes) claims with `FOR UPDATE SKIP LOCKED` (or memory in tests).
3. Worker checkpoints cursor; permanent AI failures go to dead-letter (no retry).

## Allowlist

Only job types in `lib/jobs/queue.mjs` `ALLOWED_JOB_TYPES` can be enqueued. Clients cannot invent types.

## First migrated crons

- `/api/cron/source-monitor`
- `/api/cron/lesson-source-monitor`

Other long crons still need the same enqueue wrapper (tracked as remaining risk).
