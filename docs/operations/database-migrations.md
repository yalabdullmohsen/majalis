# Database migrations (operations)

## Rule

Schema changes are **never** applied by Production deploy, Vercel cron, or request handlers unless `ALLOW_RUNTIME_SCHEMA_MIGRATIONS=1` is set for an emergency and revoked immediately after.

## Safe order (expand → code → contract)

1. Apply forward SQL in Supabase SQL Editor or authorized `workflow_dispatch` bootstrap.
2. Deploy application code that reads the new columns/tables.
3. Later cleanup migrations only after all clients are on the new code.

## New P0 migration

File: `artifacts/majalis/supabase/enterprise_reliability_p0_v1.sql`

Creates/updates:

- `ai_provider_circuit`
- `background_jobs` (+ attempts / dead letters)
- `qa_categories.sort_order` (ADD IF NOT EXISTS + backfill)
- optional hot indexes for `prayer_times` / `lessons`

## Verify

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'qa_categories' AND column_name = 'sort_order';

SELECT to_regclass('public.ai_provider_circuit');
SELECT to_regclass('public.background_jobs');
```

## Rollback notes

Do **not** DROP `sort_order` if production data uses it. Circuit/queue tables may be left in place (unused) safely.
