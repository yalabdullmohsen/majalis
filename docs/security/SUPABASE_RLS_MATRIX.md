# SUPABASE RLS MATRIX — scaffold

**Status:** Inventory incomplete until live Advisors / SQL against Staging or Production (read-only) is run with approval.

## Classification template (per table)

| table | class | SELECT | INSERT | UPDATE | DELETE | notes |
|---|---|---|---|---|---|---|
| _(fill from Advisors)_ | public_read / user_owned / admin / service_only / audit / frozen | | | | | |

## Acceptance

- Zero RLS-enabled tables without policies **or** explicit allowlist entry documenting intentional lockout (no policies = deny all via RLS).
- User A cannot read/write User B rows (integration tests).

## REQUIRES_EXPLICIT_APPROVAL

- Any Production policy DDL
- Enabling leaked password protection (Auth dashboard)
