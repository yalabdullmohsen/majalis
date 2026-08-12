# Database & Supabase (Phase 5)

## Model

- Production data/auth: **hosted Supabase** (Postgres + Auth + Storage + RLS).
- Browser/mobile talk to Supabase directly with the anon key; elevated work uses service role only on the server/cron.
- `lib/db` Drizzle schema is a placeholder — not the live schema.

## Schema sources

| Location | Role |
|---|---|
| `.migration-backup/01_schema.sql` | Historical base schema |
| `supabase/*.sql` + `supabase/migrations/` | Shared SQL |
| `artifacts/majalis/supabase/**` | App-specific batches + RLS hardenings |

## Security rules

1. **RLS on** for all public content/user tables.
2. Never ship `CREATE POLICY … FOR ALL USING (true)` without `TO service_role`.
3. Profile role escalation must stay blocked (see `profile_escalation_hardening_*.sql`).
4. **No automatic production migrations from CI push** (see Phase 6 / `docs/CI-CD.md`).

## Phase 5 remediation (manual)

File: `supabase/migrations/20260729_enterprise_phase5_hardening.sql`

- Restricts `open_*` policies to `service_role` (+ owner read for API keys).
- Adds hot indexes for lessons, registrations, content_views, fawaid, profiles.

Apply only after review:

```bash
# Prefer: GitHub Actions → Production Bootstrap (workflow_dispatch)
# Or paste into Supabase SQL Editor
```

## Verification

```bash
pnpm --filter @workspace/majalis run test:supabase-policy-audit
```

Static scan of SQL trees for dangerous open policies (no DB connection).
