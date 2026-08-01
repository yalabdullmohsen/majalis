# Operational tables — retention (proposed, not auto-executed)

**Policy:** no automatic deletion from agents or CI. Counts via `pnpm run ops:backlog-report` only.

## Tables in scope

| Table | Role | Proposed retention | Notes |
|---|---|---|---|
| `background_job_dead_letters` | Failed background jobs | 90 days after resolve / archive | Review before purge |
| `content_production_dead_letter` | Content pipeline failures | 90 days | Keep until root cause closed |
| `automation_step_logs` | Automation audit | 60 days | High volume |
| `akp_review_queue` | Human review queue | Keep open items; archive closed 180 days | RLS required |
| `akp_structured_logs` | Structured AKP logs | 30–60 days | Prefer sampling |
| `mke_decisions` | Knowledge-engine decisions | 180 days | Analytics |
| `mke_quality_reports` | Quality reports | 180 days | Analytics |
| `background_jobs` | Live queue | Completed 14 days; failed → DLQ | Lease reclaim already exists |

## Safe operations

1. `pnpm run ops:backlog-report` — read-only counts.
2. Add indexes only after proving hot queries (include in reviewed migration packs; **do not** `db push` to Production without `workflow_dispatch` + `apply=true`).
3. RLS: ops tables must not be world-readable via anon key; prefer service-role reports.

## Forbidden

- Truncate / delete from CI or cron without explicit owner approval.
- Applying unreviewed migrations to Production.
