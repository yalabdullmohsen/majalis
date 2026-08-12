# Schema drift — 2026-07-29 (updated)

## Expected by code / repo SQL

| Object | Repo source | Live check (MIGRATION_TEST_DATABASE_URL) | Action |
|---|---|---|---|
| `public.background_jobs` | `enterprise_reliability_p0_v1.sql` | present (verify script) | Keep; apply hardening deny policies |
| `public.ai_provider_circuit` | same | present | same |
| `public.background_job_dead_letters` | same | present | same |
| `lesson_sources.failure_count` | `platform_hardening_security_v1.sql` (guarded ADD) | verify on Staging before Prod | Expand-only if missing |
| `mke_runs.created_at` | same | verify on Staging before Prod | Expand-only if missing |
| `qa_categories.sort_order` | `enterprise_reliability_p0_v1.sql` | expected via enterprise SQL | Confirm on Staging |
| `mosques.city` | **no code literal found** | N/A | Do not invent without product need |

## Hardening artifact

| File | Purpose |
|---|---|
| `artifacts/majalis/supabase/platform_hardening_security_v1.sql` | Deny-default RLS on reliability tables + DEFINER hygiene |
| `artifacts/majalis/supabase/platform_hardening_security_v1_ROLLBACK.sql` | Drop deny policies (no column drops) |
| `scripts/verify-platform-hardening-sql.mjs` | Static gate (no DB apply) |

## RLS

Reliability tables: explicit deny policies for anon/authenticated (service_role bypass). Broader ~50 RLS-on/zero-policy inventory still needs Advisors under approval — see `SUPABASE_RLS_MATRIX.md`.

## Auth

Leaked password / MFA admins / redirect URLs: **PENDING** — `pending/2026-07-29_auth_dashboard_REQUIRES_APPROVAL.md`.

## Apply order (Staging → approval → Prod)

1. Backup Staging
2. Confirm `enterprise_reliability_p0_v1.sql` objects exist
3. Apply `platform_hardening_security_v1.sql`
4. Run Security + Performance Advisors
5. Role tests: anon / user A / user B / admin / service_role
6. Explicit approval for Production (agents must not apply Prod SQL)

**Production apply status from this agent: NOT APPLIED** (policy).
