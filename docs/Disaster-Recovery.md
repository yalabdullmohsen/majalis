# Disaster Recovery — سُنّة

## RPO / RTO targets (operational)

| Tier | Example | RPO intent | RTO intent |
|---|---|---|---|
| A — Auth + core catalog | Supabase primary | Point-in-time via Supabase backups | Restore project / promote backup |
| B — Static web | Vercel + git `main` | Last green commit | Redeploy previous deployment |
| C — Generated SEO/assets | Build outputs | Rebuild from git | Re-run production build |

Exact SLA numbers are owned by the ops calendar; this doc is the procedure map.

## Failure playbooks

### 1. Bad deploy (UI broken, API OK)

1. Vercel → promote previous successful deployment for `majalis-majalis`.
2. Confirm `main` tip; revert or forward-fix with a hotfix PR (no force-push to `main`).
3. Verify `/api/healthz` and critical routes.

### 2. Supabase outage / RLS lockout

1. Check status; do not weaken RLS to “open” policies.
2. Client already fail-softs with timeouts / circuit breaker / graceful `runWithTimeout`.
3. If schema repair needed: manual `workflow_dispatch` bootstrap after SQL review — never from CI push.

### 3. Secret leak

1. Rotate leaked secret in Supabase / Vercel / GitHub immediately.
2. Invalidate sessions if auth-related.
3. Audit Actions logs and recent commits for accidental material.

### 4. Data corruption / bad migration

1. Stop further migration workflows.
2. Restore from Supabase PITR / backup to a staging project first when possible.
3. Re-apply reviewed migrations only.

### 5. Domain / TLS / CDN

1. Confirm DNS for `majlisilm.com` → Vercel.
2. Purge CDN only if stale HTML masks a good deploy (prefer cache-versioned assets).

## Backups

- Database: Supabase managed backups / PITR (project settings).
- Source of truth for app: GitHub `main`.
- Do not rely on laptop worktrees or automation branches as DR sources.

## Contacts / ownership

- Code + release: repository maintainers
- DB changes: require explicit human approval before any bootstrap workflow
- Incidents: include client `errorId` (`MJL-…`) and deploy commit SHA from `/api/healthz`
