# PLATFORM ROOT CAUSE AUDIT — 2026-07-29

## 0. Identity

| Field | Value |
|---|---|
| Repository | `yalabdullmohsen/majalis` |
| Audit branch | `cursor/audit-platform-root-cause-2026-07-29-1f54` |
| Baseline SHA (main at start) | `87be8fb50e083b05edd0d947ddb04ef77842718c` |
| Expected baseline match | **YES** (matches task brief) |
| App path | `artifacts/majalis` |
| Production domains | `majlisilm.com`, `www.majlisilm.com` |
| Vercel project (claimed prod) | `majalis-majalis` / `prj_W2pUhYZqBRzwplLCrr5wU4lha1DV` |
| Vercel team | `team_4Lmty5Xsr16Kf7mGln0C6YLS` |
| Supabase project ref | `ngmvmlulzacrlicuagyp` |
| PostgreSQL (claimed) | 17 |
| iOS project | `artifacts/majalis/ios/App/App.xcodeproj` scheme `App` |
| Audit date (UTC) | 2026-07-29 |

## 1. Toolchain on this agent host

| Tool | Result |
|---|---|
| Node | `v24.17.0` |
| pnpm | `10.34.4` (packageManager) |
| corepack | `0.35.0` |
| xcodebuild | **NOT AVAILABLE** (Linux cloud agent) |
| Swift | **NOT AVAILABLE** |
| Ruby / CocoaPods | **NOT AVAILABLE** |
| Docker | **NOT AVAILABLE** at start of prior session; Postgres 16 installed via apt for local tests only |

**Implication:** Any claim of successful `xcodebuild` / device audio / Instruments from this host is **false**. iOS native proof requires macos-latest CI or a Mac.

## 2. Monorepo structure (observed)

- Root: pnpm workspace (`package.json` + `pnpm-workspace`)
- Primary web: `artifacts/majalis` (Vite + Express-style `/api` on Vercel)
- Mobile Expo: `artifacts/majalis-mobile`
- API server artifact: `artifacts/api-server`
- Shared libs under `lib/` / packages as present
- Capacitor iOS shell embedded under `artifacts/majalis/ios/`

## 3. GitHub Workflows inventory

| Workflow | Trigger highlights | Write? | Merges / undrafts? | Evidence |
|---|---|---|---|---|
| `ci.yml` | PR + push main | read | No | Does **not** run full `pnpm test` |
| `auto-merge-to-main.yml` | PR events + CI workflow_run + **schedule */15** | contents+PRs write | **YES** `gh pr ready` + `gh pr merge --auto --squash` | Present on main @ `87be8fb50` |
| `resolve-pr-conflicts.yml` | schedule */15 | write | Merges main **into** PR branches | Mentions Auto-merge in comments |
| `release-majlisilm.yml` | workflow_dispatch | write | Merges dual automation branches → push main | Manual only |
| `auto-deploy.yml` | push main / hourly | read | No merge; health curl | |
| `ios-capacitor-gates.yml` | path filter | read | No | **ubuntu-latest**, **no xcodebuild** |
| `production-bootstrap.yml` | dispatch | read | Calls runtime migrate APIs / applyMigrations in Actions | |
| `platform-bootstrap.yml` | dispatch | read | Cron bootstrap | |
| `owner-bootstrap.yml` | dispatch | read | Owner promote | |
| `phase2-trial-import.yml` | dispatch | read | Import | |

**CODEOWNERS:** **ABSENT** (`.github/CODEOWNERS` missing).

**Confirmed defect (P0):** Auto-merge undrafts Draft PRs and enables squash auto-merge on a 15-minute schedule. This explains PR #617 merge despite NO-AUTO-MERGE intent if title guard was incomplete or race occurred. Workflow still on main after #617.

## 4. CI gaps (proven by reading `ci.yml` + `package.json`)

| Gate | In package scripts? | In CI `ci.yml`? |
|---|---|---|
| `test:content-guard` | yes | yes |
| `typecheck` (majalis + libs) | yes | yes |
| `lint` (`max-warnings 50`) | yes | yes (recursive if-present) |
| **full `pnpm --filter @workspace/majalis run test`** | yes (large suite) | **NO** |
| `test:regression` | yes | **NO** |
| `build` | yes (embeds more tests/generators) | yes |
| `git diff --exit-code` after build | — | **NO** |
| ESLint `--max-warnings=0` | **NO** (50 allowed) | **NO** |
| macOS `xcodebuild` | — | **NO** |

## 5. Vercel configuration (repo)

`artifacts/majalis/vercel.json`:

- `framework: "vite"` (repo says Vite; task reports Dashboard may still show Next.js — **Dashboard not verified from this host**)
- `git.deploymentEnabled`: `{ "*": false, "main": true }` → **Preview Ignored for non-main branches**
- Root expected: `artifacts/majalis`
- `functions.api/index.js.maxDuration: 60`
- Large cron list including `/api/cron/apply-migrations` and `/api/cron/bootstrap-database`

**Three similar Vercel projects:** Documented as claim; **not enumerated via Vercel API from this agent** (no Vercel MCP). See `docs/operations/VERCEL_PROJECT_INVENTORY.md` (REQUIRES_EXPLICIT_APPROVAL for deletion/unlink).

## 6. Supabase / PostgreSQL (claims vs repo)

### Task-provided production facts (not re-queried here)

- ~150 public tables
- ~97 with RLS enabled
- ~50 with RLS and **zero policies**
- 17 `SECURITY DEFINER` functions executable by anon/authenticated/PUBLIC
- Leaked password protection **disabled**
- Missing relative to code expectations:
  - `public.background_jobs`
  - `public.ai_provider_circuit`
  - `lesson_sources.failure_count` (repo uses trusted/smart source SQL variants — verify exact table name)
  - `mke_runs.created_at`
  - `mosques.city` (**no code literal `mosques.city` found**; possible dead expectation)

### Repo migration present but not proven applied in prod

- `artifacts/majalis/supabase/enterprise_reliability_p0_v1.sql` creates `ai_provider_circuit`, `background_jobs`, attempts, dead_letters, `qa_categories.sort_order`

**Production apply status:** **UNVERIFIED** from this agent (no live Supabase SQL session with service role in audit logs). Treating as **schema drift HIGH**.

## 7. Data path (web)

Browser → Vite SPA → Supabase JS client (`VITE_SUPABASE_URL` / anon) **and/or** `/api/*` (Vercel serverless `api/index` → `api-dispatch.mjs` → handlers) → PostgreSQL via `DATABASE_URL` / service role where authorized.

Auth: Supabase Auth; email confirmation enabled (AGENTS.md).

## 8. Cron jobs

36 handlers under `lib/api-handlers/cron/`.  
**Only** `source-monitor` + `lesson-source-monitor` use enqueue→202 on **main @ 87be8fb50**.  
Others run long work **inline** under HTTP (timeout risk / 504 / double response).  
`job-worker.js` processes queue; unknown types may stub-complete on main (fixed on unmerged PR #618).

Runtime schema paths still exist: `apply-migrations.js`, `bootstrap-database.js` gated by `ALLOW_RUNTIME_SCHEMA_MIGRATIONS` — still callable surface.

## 9. AI providers

- Anthropic primary (`ANTHROPIC_API_KEY`) via `lib/ai/provider-client.mjs`
- Classifier: `credit_exhausted`, rate limit, auth, etc.
- On main: Memory fallback when Postgres circuit table missing → **not durable across isolates**
- Production logs (task): continued calls after credit exhaustion — consistent with non-durable / missing table drift

## 10. Environment variable **names** (no values)

See exploration dump: `VITE_SUPABASE_*`, `EXPO_PUBLIC_SUPABASE_*`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `ANTHROPIC_API_KEY`, `ALLOW_RUNTIME_SCHEMA_MIGRATIONS`, Vercel git metadata, etc.  
**Never log values.**

## 11. Defect register (severity → evidence → reproduce)

| ID | Severity | Defect | Evidence | Reproduce |
|---|---|---|---|---|
| G1 | P0 | Auto-merge undrafts + merges on schedule | `.github/workflows/auto-merge-to-main.yml` | Open Draft PR matching allow pattern; wait schedule / CI success |
| G2 | P0 | PR #617 merged without xcodebuild | Merge commit `87be8fb50`; `ios-capacitor-gates.yml` ubuntu static only | Read workflow; confirm no xcodebuild |
| G3 | P0 | Full `pnpm test` not in CI | `ci.yml` vs `package.json` `test` script | Diff CI steps |
| G4 | P1 | ESLint allows 50 warnings | `"lint": "... --max-warnings 50"` | `pnpm lint` |
| G5 | P0 | Preview disabled for branches | `vercel.json` deploymentEnabled | Open PR → Ignored deploy |
| G6 | P0 | Schema drift reliability tables | Task + missing objects in prod claim; SQL in repo | SQL `to_regclass('public.background_jobs')` on prod |
| G7 | P0 | RLS without policies (~50) | Task claim | Advisors / `pg_policies` inventory |
| G8 | P0 | SECURITY DEFINER EXECUTE to PUBLIC/anon | Task claim | `has_function_privilege` |
| G9 | P0 | Runtime/cron migrations surface | cron handlers + vercel crons | Call apply-migrations with secret |
| G10 | P0 | Inline long crons | 30+ handlers | Hit cron under load → 55s timeout |
| G11 | P1 | Double response / HEADERS_SENT | Task prod logs; partial guards on main | Concurrent timeout paths |
| G12 | P1 | iOS JS module import fail | Task claim | SW + stale HTML after deploy |
| G13 | P1 | UUID vs slug | Task + partial fix in #616 | Request slug on UUID column |
| G14 | P2 | Framework preset confusion Next vs Vite | Task Dashboard claim | Vercel project settings |
| G15 | P1 | Leaked password protection off | Task claim | Auth settings UI |

## 12. Baseline command results

Recorded under `/tmp/baseline-audit/` and summarized in `docs/EXECUTION_STATUS.md` as commands complete.  
**Do not invent exit codes.**

## 13. Open related work (not merged)

- PR #618 Draft: production hardening after #616 (durable stores, delete auto-merge, enqueue crons) — **not on main**; main still has auto-merge.

## 14. REQUIRES_EXPLICIT_APPROVAL

- Apply any SQL to production Supabase
- Enable leaked password protection (Auth setting)
- Delete/unlink extra Vercel projects
- Change Dashboard framework preset on production project
- Force-disable Auto-merge via org settings if workflows alone insufficient
- TestFlight / Archive with real signing
- Paid Supabase branching if required
