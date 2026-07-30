# Developer Guide — المجلس العلمي

## Prerequisites

- Node.js **24**
- `pnpm` via Corepack (`pnpm@10` as pinned by the repo)
- Optional: Flutter SDK (legacy module), Expo tooling (mobile)

## Clone & install

```bash
git clone https://github.com/yalabdullmohsen/majalis.git
cd majalis
pnpm install --frozen-lockfile
```

Git root must be the monorepo root (paths like `artifacts/majalis/...`).

## Run the web app

```bash
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run dev
```

Without `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` the shell still loads; lists stay empty and auth errors.

## Quality gates (before every PR)

```bash
pnpm install --frozen-lockfile
pnpm --filter @workspace/majalis run typecheck
pnpm --filter @workspace/majalis run lint
pnpm --filter @workspace/majalis run test
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
bash artifacts/majlisilm-flutter/scripts/flutter-gates.sh   # when Flutter touched
```

## Branch / PR policy

- Feature branches: `cursor/<descriptive-name>-1f54` (cloud) or descriptive session branches.
- Small commits; Arabic commit messages preferred for product work.
- Squash-merge to `main` after CI green.
- **Never** merge/push to `main` from automation worktrees that forbid it; release workflow owns combined merges when applicable.

## Code layout

See `docs/Architecture.md`. Prefer extending `src/features/<feature>/` with ports + use cases; keep UI free of Supabase orchestration.

## Useful packages

| Filter | Role |
|---|---|
| `@workspace/majalis` | Production web |
| `@workspace/majalis-mobile` | Expo app |
| `@workspace/api-server` | Push notification API |

## Docs map

| Doc | Topic |
|---|---|
| Architecture.md | Layers, strangler, stack |
| Security.md | Trust boundaries, secrets |
| Deployment.md | Vercel / build / health |
| Database.md | Supabase / RLS / migrations |
| CI-CD.md | Workflows & bootstrap |
| Performance.md | Bundles & caching |
| Reliability.md | Timeouts, circuit breaker |
| Testing.md | Suites & Flutter gates |
| Disaster-Recovery.md | Incident playbooks |
| Developer-Guide.md | This file |

## Conventions

- No `any`, `@ts-ignore`, `eslint-disable`, `|| true`, `--no-verify`, force pushes.
- No production migrations/seeds unless explicitly requested.
- RTL Arabic UX; preserve brand tokens in `styles/brand-v4*.css`.
