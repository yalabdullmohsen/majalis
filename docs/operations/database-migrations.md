# Database migrations (operations)

## Rule

Schema changes are **never** applied by Production deploy, Vercel cron, Admin HTTP, content-import requests, or startup handlers.

There is **no** `ALLOW_RUNTIME_SCHEMA_MIGRATIONS` escape hatch. Runtime paths are permanently verify-only.

Approved apply paths only:

1. Supabase SQL Editor (after explicit approval — see `docs/REQUIRES_EXPLICIT_APPROVAL.md`)
2. Documented CLI with `MAJALIS_ALLOW_CLI_MIGRATIONS=1` (e.g. `scripts/apply-activation-migrations.mjs`)
3. GitHub `workflow_dispatch` bootstrap workflows (manual)

## Safe order (expand → code → contract)

1. Apply forward SQL in Supabase SQL Editor or authorized CLI / `workflow_dispatch`.
2. Deploy application code that reads the new columns/tables.
3. Later cleanup migrations only after all clients are on the new code.

## P0 / security migrations (approval-gated)

| File | Purpose |
|---|---|
| `enterprise_reliability_p0_v1.sql` | Queue + AI circuit tables |
| `background_jobs_runtime_hardening_v1.sql` | `next_retry_at` / `completed_at` |
| `platform_hardening_security_v1.sql` | RLS deny-default + DEFINER hygiene |
| `platform_bootstrap_runs_v1.sql` | Bootstrap history table (no runtime CREATE) |
| `p0_security_definer_grants_v2.sql` | EXECUTE revoke from PUBLIC/anon on sensitive RPCs |

## Verify

```sql
SELECT to_regclass('public.ai_provider_circuit');
SELECT to_regclass('public.background_jobs');
SELECT to_regclass('public.platform_bootstrap_runs');
```

Static gate: `pnpm verify:no-runtime-ddl`

## Rollback

Use the matching `*_ROLLBACK.sql` files listed in `docs/REQUIRES_EXPLICIT_APPROVAL.md`. Do **not** DROP columns that production data already uses without a separate approved plan.
