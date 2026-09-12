# سُنّة — Cleanup P0 Baseline

**Phase:** P0 (foundation only — no mass deletion)  
**Brand:** سُنّة  
**Base commit (main):** `72ed84d8dbc53dbee735af9ce16180cd3a9d7c04`  
**Branch:** `cursor/sunnah-cleanup-p0`  
**Collected:** 2026-09-12 (UTC)

## Purpose

Freeze a measurable starting point before any cleanup deletions or consolidations.  
P1+ must compare against `docs/cleanup/baseline.json`.

## Workspaces / surfaces

| Surface | Path | Role |
|---|---|---|
| Web + Capacitor product | `artifacts/majalis` | Production app (authoritative) |
| API (push) | `artifacts/api-server` | Express notifications |
| Shared DB package | `lib/db` | Drizzle schema package |
| API client / handlers / zod | `lib/api-*` | Shared API contracts |
| Expo mobile | `artifacts/majalis-mobile` | Frozen / not store path |
| Flutter sketch | `artifacts/majlisilm-flutter` | Frozen |
| Mushafi / tasmee3 | `artifacts/mushafi` | Reference — do not delete |
| Marketing | pitch / promo / mockup | Excluded from root typecheck/build filters |
| Supabase assets | `artifacts/supabase` | SQL / apply |

Authoritative map: `docs/Architecture.md`, `PLATFORMS.md`.

## Scale (approx, excluding heavy build caches where pruned)

| Metric | Value |
|---|---|
| Repo files (walk, pruned node_modules/dist) | ~17 765 |
| `artifacts/majalis` files | ~15 012 |
| `artifacts/majalis/src` TS/TSX/CSS files | ~2 405 |
| `artifacts/majalis/src` TS/TSX LOC (wc) | ~382 302 |
| Repo disk (`du -sh .`) | ~3.3G |
| `artifacts/majalis` disk | ~1.0G |
| `node_modules` disk | ~1.5G |
| majalis `dependencies` | 31 |
| majalis `devDependencies` | 62 |
| majalis npm scripts | 531 |
| Lockfile package entries (approx) | ~3 460 |
| Open PRs at baseline | 9 |

## Quality probes (commands that exist)

| Probe | Command | Result at P0 |
|---|---|---|
| Typecheck | `pnpm --filter @workspace/majalis exec tsc -p tsconfig.json --noEmit` | PASS (0 errors) |
| Lint | `pnpm --filter @workspace/majalis run lint` | PASS (`--max-warnings 0`) |
| Local CI mirror | `pnpm run verify:ci -- --changed` | Required before push |
| Content-ops P0 | `pnpm --filter @workspace/majalis run content-ops:p0-gate` | Existing gate |
| Cleanup P0 | `node scripts/cleanup/p0-gate.mjs` | This phase |

## Not measured yet (explicit NOT VERIFIED)

- Production JS bundle size / chunk map
- Cold start / TTI on device
- Full `test:ci-unit` duration delta
- E2E / visual / contrast beyond existing CI lanes
- TestFlight
- Dependency vulnerability audit deep pass

## Safe rollback tag

After this PR merges (or before risky P1):

```bash
git tag cleanup-p0-baseline-$(git rev-parse --short HEAD)
git push origin cleanup-p0-baseline-$(git rev-parse --short HEAD)
```

See `P0_ROLLBACK_PLAN.md`.

## Policy reminder

No file deletion in P0. Candidates only go to `removal-candidates.json` with `approvedForDeletion: false` until evidence is complete.
