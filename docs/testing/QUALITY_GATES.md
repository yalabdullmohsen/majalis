# QUALITY GATES

## Required (target)

| Gate | Command / check | Notes |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | |
| Typecheck | `pnpm -r --if-present run typecheck` | |
| Lint | `eslint ... --max-warnings=0` | currently 50 on main — defect |
| Unit/integration package | `pnpm --filter @workspace/majalis run test` | **not in CI today** |
| Build | `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build` | |
| Clean tree | `git diff --exit-code` | **fails after build today** (counts/manifest) |
| No unsafe auto-merge | `node scripts/verify-no-unsafe-auto-merge.mjs` | to land in PR1 |
| No runtime DDL | verify script | PR1/PR3 |
| Postgres migration | CI service container | PR2/PR3 |
| iOS native | macos-latest xcodebuild | **missing** |
| Preview smoke | commit-linked | Preview currently Ignored |

## Negative tests required

Gates must fail when defect reintroduced (auto-merge workflow, RLS gap, runtime DDL, double response, credit retry, etc.).
