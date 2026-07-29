# Schema drift — 2026-07-29

## Expected by code / repo SQL but reported missing in Production (task claim)

| Object | Repo source | Prod status (task) | Action |
|---|---|---|---|
| `public.background_jobs` | `enterprise_reliability_p0_v1.sql` | missing | Apply SQL on Staging then Prod (approval) |
| `public.ai_provider_circuit` | same | missing | same |
| `lesson_sources.failure_count` | smart/trusted source SQL variants | missing / name verify | Confirm actual table name before ALTER |
| `mke_runs.created_at` | MKE SQL | missing | Expand-only ALTER if column absent |
| `mosques.city` | **no code literal found** | N/A | Do not invent without product need |

## RLS

~50 tables RLS-on / zero policies (task). Matrix scaffold: `SUPABASE_RLS_MATRIX.md`.

## Auth

Leaked password protection: **disabled** (task) — enable in Dashboard (**approval**).

## Apply order

1. Staging branch / isolated DB
2. Backup
3. Apply `enterprise_reliability_p0_v1.sql`
4. Verify `to_regclass` + RLS advisors
5. Explicit approval for Production
