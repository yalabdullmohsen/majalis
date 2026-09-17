# Supabase Security Plan — Store 1.0.0

**Mode:** PLAN → BACKUP → APPROVAL → APPLY → VERIFY  
**Status:** PLAN only — **no hosted SQL applied** in this session.

## Steps (owner)

1. Confirm correct Supabase project for `www.ssunnah.com`.
2. Full backup / PITR snapshot.
3. Diff hosted schema vs git migrations (official CLI) — no secrets in logs.
4. Classify drift: Expected / Pending / Hosted-only / Repo-only / Security-sensitive / Unknown.
5. Apply only approved security migrations with rollback scripts.
6. Verify: draft/pending not public; no cross-user token reads; no service role in client; admin authZ real.
7. MFA: admin-only enrollment path if product allows — test recovery first.
8. Leaked-password: confirm plan (Pro+); enable in dashboard; test signup error UX without logging passwords.

## Companion files

- `SUPABASE_SCHEMA_DRIFT_REPORT.md` — fill after CLI diff
- `SUPABASE_OWNER_CHECKLIST.md` — sign-off

**fiqh_council hosted data:** backup then idempotent delete of council-only tables/rows — never general fiqh content.
