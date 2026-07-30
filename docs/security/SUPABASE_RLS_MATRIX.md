# SUPABASE RLS MATRIX

**Status:** Migration artifact ready (`platform_hardening_security_v1.sql`). Live Advisors inventory still **REQUIRES_EXPLICIT_APPROVAL** (no Production SQL from agents).

## Classification

| class | meaning | policy pattern |
|---|---|---|
| `public_read` | Published content | SELECT for anon/auth where published; writes admin/service |
| `user_owned` | Per-user rows | `auth.uid() = user_id` for SELECT/UPDATE/DELETE; INSERT WITH CHECK same |
| `admin` | Ops/CMS | `public.is_admin()` only |
| `service_only` | Queue / AI circuit / spend | Deny anon+authenticated (`USING (false)`); service_role bypasses RLS |
| `audit` | Logs | Insert service/admin; SELECT admin; no client DELETE |
| `frozen` | Internal closed | RLS on + no policies **or** explicit deny policies |

## Reliability tables (service_only) — covered by hardening v1

| table | class | SELECT | INSERT | UPDATE | DELETE | notes |
|---|---|---|---|---|---|---|
| `background_jobs` | service_only | deny anon/auth | deny | deny | deny | durable queue |
| `background_job_attempts` | service_only | deny | deny | deny | deny | attempt log |
| `background_job_dead_letters` | service_only | deny | deny | deny | deny | DLQ |
| `ai_provider_circuit` | service_only | deny | deny | deny | deny | circuit breaker |
| `ai_request_dedup` | service_only | deny | deny | deny | deny | if present |
| `ai_content_cache` | service_only | deny | deny | deny | deny | if present |
| `ai_spend_ledger` | service_only | deny | deny | deny | deny | if present |
| `ai_error_aggregates` | service_only | deny | deny | deny | deny | if present |

## SECURITY DEFINER hygiene (v1)

| function | post-v1 | notes |
|---|---|---|
| `is_admin()` | DEFINER; `search_path=pg_catalog,public`; EXECUTE authenticated+service_role | profiles + governance_user_roles; no user_metadata |
| `increment_fiqh_item_views(text)` | DEFINER; anon+authenticated | slug only |
| `record_lesson_view(uuid)` | DEFINER; anon+authenticated | lesson id only |
| `accept_family_invite` / `revoke_family_link` / `get_similar_users` / `profile_privileges_unchanged` / `upsert_user_interest` | REVOKE PUBLIC+anon; GRANT authenticated+service_role; fixed search_path | if present |

## Acceptance

- Zero RLS-enabled tables without policies **or** explicit allowlist for intentional lockout.
- User A cannot read/write User B rows (Staging integration — pending approval).
- No `USING (true)` on tenant or reliability data.

## REQUIRES_EXPLICIT_APPROVAL

- Any Production policy / function DDL apply
- Running Security/Performance Advisors with privileged session
- Auth dashboard: leaked password, MFA admins, redirect URLs (see `pending/2026-07-29_auth_dashboard_REQUIRES_APPROVAL.md`)
- Moving `pg_trgm` / `vector` out of `public`
