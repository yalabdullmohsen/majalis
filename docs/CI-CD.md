# CI/CD Security Model — سُنّة (Majalis)

## Separation of concerns

| Concern | Mechanism |
|---|---|
| Build / quality gate | `.github/workflows/ci.yml` — typecheck, lint, build, content tests |
| Deploy | **Vercel** auto-deploys from `main` only |
| Post-deploy health | `.github/workflows/auto-deploy.yml` (verify only; no DB secrets) |
| Database migrations / bootstrap | **workflow_dispatch only** (never on `push`) |

## Manual bootstrap workflows

Run from GitHub → Actions after reviewing SQL:

1. **Production Bootstrap** — `applyMigrations` + `bootstrap-database` cron
2. **Platform Self Bootstrap** — platform seed/bootstrap + cron
3. **Owner Bootstrap** — owner SQL + promote + cron

Missing secrets **fail** these workflows (no soft-skip greenwash).

## Rules

1. CI `verify` must not mutate production databases.
2. No `push:` triggers on bootstrap/migration workflows.
3. Prefer `pnpm install --frozen-lockfile` and Node **24**.
4. Workflow `permissions` default to `contents: read` unless write is required.
5. Vercel cron paths that apply migrations remain operational safeguards; treat them as privileged and protect `CRON_SECRET`.

## Playwright / color-contrast gate

CI installs Chromium before the gate (see `.github/workflows/ci.yml`):

```bash
pnpm --filter @workspace/majalis exec playwright install --with-deps chromium
pnpm --filter @workspace/majalis run test:color-contrast-gate
```

Locally the same install is required — the gate **fails loudly** if Chromium is missing (no silent skip). The gate binds Vite to `127.0.0.1` only.

## TypeScript runners

Prefer `node --import tsx <file>` over `npx tsx` / bare `tsx` in package scripts and CI.
