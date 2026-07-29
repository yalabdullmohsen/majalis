# Deployment — المجلس العلمي

## Production path

1. Squash-merge PR → `main` after green CI (`Verify build`).
2. Vercel project `majalis-majalis` builds `artifacts/majalis` from `main` only (`vercel.json` `git.deploymentEnabled`).
3. Optional: `auto-deploy.yml` post-deploy URL verification (no DB writes).
4. Combined release of parallel automation branches: manual `workflow_dispatch` of `.github/workflows/release-majlisilm.yml` when used.

## Local / preview

```bash
pnpm install --frozen-lockfile
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run start
```

Dev:

```bash
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run dev
```

## Required build env

| Variable | Purpose |
|---|---|
| `PORT` | Required by Vite/Express services |
| `BASE_PATH` | Web base path (usually `/`) |
| `VITE_SUPABASE_*` | Optional for UI shell; required for live data |

## What must never run on deploy

- Automatic production SQL migrations
- Bootstrap / seed of production data
- Soft-skipped secret checks (`|| true`)

Migrations and bootstrap: **manual** GitHub Actions only (`docs/CI-CD.md`, `docs/Database.md`).

## Health after deploy

- `GET https://www.majlisilm.com/api/healthz` → `ok`, `uptimeMs`, commit/build ids
- Smoke: home, mushaf, login shell, one lesson list

## Mobile / native

- Expo: `artifacts/majalis-mobile`
- Capacitor iOS/Android sync from web build artifacts when cutting a store release
- Flutter legacy: not the production store path (`docs/Architecture.md`)
