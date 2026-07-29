# Security — المجلس العلمي

## Trust boundaries

| Boundary | Rule |
|---|---|
| Browser / mobile | Anon Supabase key only; RLS must enforce authorization |
| Server / cron / admin APIs | Service role or session JWT; never expose service role to clients |
| GitHub Actions | Least privilege (`contents: read` by default); secrets only on privileged jobs |
| Vercel | Deploy from `main` only; protect `CRON_SECRET` for privileged routes |

## Secrets inventory (names only)

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — client
- `SUPABASE_SERVICE_ROLE_KEY` / `DATABASE_URL` / `POSTGRES_*` — server & manual bootstrap only
- `CRON_SECRET` — cron route authentication
- `ANTHROPIC_API_KEY` — assistant API (server)

Never commit secrets. Never log Authorization / anon keys (`structuredLog` redacts credential-like fields).

## Application controls

- RLS policies: no public `FOR ALL USING (true)` on tenant data (see `docs/Database.md`, `test:supabase-policy-audit`).
- Client network: timeouts, backoff, circuit breaker (`docs/Reliability.md`).
- CSP / security headers via Vercel + Express (`HSTS`, `Permissions-Policy`, cache discipline for assets).
- Auth: email confirmation enabled in production Supabase — signup ≠ session.

## CI / deploy controls

- Build ≠ Deploy ≠ Migrate (see `docs/CI-CD.md`).
- Bootstrap / migration workflows: `workflow_dispatch` only.
- CI must not mutate production databases.

## Reporting

Client errors → `error-report` (local ring + optional server). Include `errorId` (`MJL-…`) when filing incidents.
