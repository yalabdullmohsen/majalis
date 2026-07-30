# PLATFORM BASELINE — 2026-07-30 (Phase 0)

**Purpose:** Freeze scope and evidence before any P0 remediations.  
**This branch contains documentation only — no production code/SQL/signing changes.**

| Field | Value |
|---|---|
| Repository | `yalabdullmohsen/majalis` |
| Documented at (UTC) | `2026-07-30T18:56:42Z` |
| Agent host | Linux cloud agent (no Xcode / no Swift) |
| Node / pnpm (agent) | `v24.17.0` / `10.34.4` |

---

## 1. Current `main` SHA

| Item | Value |
|---|---|
| Full SHA | `0db9c21e22733815a02374d8e3fc3e89c2dc5c2d` |
| Short | `0db9c21e` |
| Tip commit subject | `fix(mushaf): مطابقة مخطط آية — رأس بسيط وشارة صفحة فقط (#638)` |
| Includes | PR **#637** (pre-TestFlight polish) and PR **#638** (Ayah blueprint) |
| Production `version.json` (measured) | commit `0db9c21e…`, `builtAt` `2026-07-30T17:57:48.624Z`, `ref` `main` |

> Phase-0 kickoff asked for “latest main after #637”. Tip of `main` is after #637 (#638 already merged). Baseline SHA above is the live tip.

---

## 2. Vercel projects (known / claimed)

| Project name | Project ID | Role (claimed) | Evidence |
|---|---|---|---|
| **majalis-majalis** | `prj_W2pUhYZqBRzwplLCrr5wU4lha1DV` | **Production web** for `majlisilm.com` | Domains + repo docs (`docs/operations/VERCEL_PROJECT_INVENTORY.md`, `docs/Deployment.md`); live `version.json` on `majlisilm.com` matches `main` |
| **majalis-api-server** | *(not re-queried this run)* | Separate artifact; Vercel builds intentionally skipped | `artifacts/api-server/vercel.json` `ignoreCommand` exits 0 (“served outside this Vercel project”) |
| **majalis** | *(not re-queried this run)* | Legacy / similarly named — **do not delete** | Inventory note: not enumerated without Vercel API |

### Agent access note

- No Vercel CLI / MCP / API token available in this environment.
- Project IDs/domains for non-prod twins were **not live-listed** this run.
- Dashboard framework preset (Vite vs Next.js) **unverified** from the agent.

Team ID previously documented: `team_4Lmty5Xsr16Kf7mGln0C6YLS` (from prior audit; not re-verified).

---

## 3. Which project is real Production — and why

**Production = `majalis-majalis` (`prj_W2pUhYZqBRzwplLCrr5wU4lha1DV`).**

Reasons (measured + repo config):

1. Public site `https://majlisilm.com/version.json` serves `ref: "main"` and commit SHA matching GitHub `main`.
2. Repo Root Directory for that project is expected to be `artifacts/majalis` (Vite app + `api/index.js`).
3. `artifacts/majalis/vercel.json` defines production crons, rewrites (`/api/(.*)` → `/api/index`), security headers, and domain redirect `www` → apex.
4. `artifacts/api-server` is explicitly ignored by its own Vercel project config — not the public site host.

---

## 4. Domains, Git integration, branch linkage

| Surface | Value | Evidence |
|---|---|---|
| Apex domain | `https://majlisilm.com` | Live HTTP |
| www | redirects to apex (permanent) | `vercel.json` redirects |
| GitHub production branch | `main` | `version.json.ref`, workflows, AGENTS.md |
| Repo `vercel.json` `git.deploymentEnabled` | **`true`** (boolean) at SHA `0db9c21e` | Measured from file — *not* the older `{ "*": false, "main": true }` map |
| Preview deploys | May still be canceled by Dashboard “Ignored Build Step” (observed on recent PRs) | CI check annotations on PRs #636–#638 |
| Auto-deploy after main | GitHub `auto-deploy.yml` + Vercel on `main` | Workflow + live `version.json` lag |

---

## 5. Crons, paths, schedules, maxDuration

**Source of truth (repo):** `artifacts/majalis/vercel.json`

| Setting | Value |
|---|---|
| Function entry | `api/index.js` (single catch-all rewrite for `/api/*`) |
| `maxDuration` | **60** seconds |
| Cron count | **43** |

### Cron inventory

| Path | Schedule |
|---|---|
| `/api/cron/process-import-jobs` | `*/10 * * * *` |
| `/api/cron/sync-data` | `5 21 * * *` |
| `/api/cron/sync-fiqh-council` | `0 6 * * *` |
| `/api/cron/knowledge-sync` | `0 2 * * *` |
| `/api/cron/auto-knowledge-sync` | `30 2 * * *` |
| `/api/cron/auto-content-sync` | `0 3 * * *` |
| `/api/cron/auto-content-health` | `15 3 * * *` |
| `/api/cron/daily-benefit-rotation` | `0 * * * *` |
| `/api/cron/system-health` | `45 3 * * *` |
| `/api/cron/connector-health` | `0 4 * * *` |
| `/api/cron/platform-bootstrap` | `30 4 * * *` |
| `/api/cron/bootstrap-database` | `0 5 * * *` |
| `/api/cron/apply-migrations` | `0 4 * * 0` |
| `/api/cron/check-fiqh-links` | `0 7 * * *` |
| `/api/cron/scholarly-verification` | `0 8 * * *` |
| `/api/cron/autonomous-orchestrator` | `15 8 * * *` |
| `/api/cron/global-reference-review` | `0 9 * * 0` |
| `/api/cron/islamic-intelligence` | `0 10 * * *` |
| `/api/cron/governance-backup` | `10 4 * * 0` |
| `/api/cron/ai-agents` | `30 10 * * *` |
| `/api/cron/verified-knowledge` | `0 11 * * *` |
| `/api/cron/source-monitor` | `*/30 * * * *` |
| `/api/cron/job-worker` | `*/5 * * * *` |
| `/api/cron/lesson-intelligence` | `15,45 * * * *` |
| `/api/cron/monitor-sources` | `10 6 * * *` |
| `/api/cron/lesson-source-monitor` | `30 6 * * *` |
| `/api/cron/telegram-processor` | `*/5 * * * *` |
| `/api/cron/majlis-knowledge-engine` | `5 * * * *` |
| `/api/cron/content-scheduler` | `0 * * * *` |
| `/api/cron/knowledge-reasoning` | `30 11 * * *` |
| `/api/cron/autonomous-platform-fetch` | `20 * * * *` |
| `/api/cron/autonomous-platform-validate` | `0 */2 * * *` |
| `/api/cron/autonomous-platform-questions` | `0 */3 * * *` |
| `/api/cron/autonomous-platform-benefits` | `30 */6 * * *` |
| `/api/cron/autonomous-platform-reindex` | `10 2 * * *` |
| `/api/cron/autonomous-platform-audit` | `20 4 * * 0` |
| `/api/cron/autonomous-platform-cleanup` | `0 3 1 * *` |
| `/api/cron/autonomous-platform-bootstrap` | `30 5 * * *` |
| `/api/cron/autonomous-platform-monitor` | `10,40 * * * *` |
| `/api/cron/autonomous-platform-recovery` | `*/15 * * * *` |
| `/api/cron/content-scoring` | `0 1 * * *` |
| `/api/cron/universities-review` | `0 2 * * 1` |
| `/api/cron/researches-daily-import` | `20 5 * * *` |

Handler modules under `artifacts/majalis/lib/api-handlers/cron/`: **36** files (some vercel cron paths share dispatch patterns).

**Risk flag (for Phase 1):** All `/api/*` including health + every cron share one Function (`api/index.js`) with 60s maxDuration.

---

## 6. Supabase projects / branches (actual)

| Item | Value | Evidence |
|---|---|---|
| Production project ref | `ngmvmlulzacrlicuagyp` | Task brief + agent `VITE_SUPABASE_URL` host matches `*.supabase.co` for that ref (value not logged) |
| Host pattern | `https://<project-ref>.supabase.co` | Env present in agent; secrets not written here |
| PostgreSQL version | **17 claimed** in architecture docs | Not re-queried via SQL this run |
| Branches / preview DBs | **Not enumerated** | No Supabase Management API in this agent |
| Client package | Browser → anon key; server → `DATABASE_URL` / service role where configured | Code paths |

**Schema / RLS / SECURITY DEFINER live inventory:** deferred to Phase 2–3 (read-only SQL). Prior audit claims (~150 tables, RLS gaps) remain **unverified** in this Phase 0 run.

---

## 7. `/api/healthz` and `/api/readyz` (measured live)

| Endpoint | HTTP | Body (truncated) | Notes |
|---|---:|---|---|
| `GET https://majlisilm.com/api/healthz` | **500** | `{"ok":false,"message":"تعذر تشغيل واجهة API."}` | Matches bootstrap `catch` in `artifacts/majalis/api/index.js` — Function failed before/during `dispatchApiRequest` |
| `GET https://majlisilm.com/api/readyz` | **503** | `{"status":"not_ready","version":"0db9c21e…"}` | Readiness not green; version string matches production commit |

**Not claimed here:** exact stack trace (`Cannot find package 'pg'` / `@anthropic-ai/sdk`) — Vercel Runtime Logs API unavailable.  
**Repo note:** `api/_deps.mjs` currently traces only `@supabase/supabase-js`, `@upstash/redis`, `@upstash/ratelimit` (pg/Anthropic intentionally not in that light marker file). `pg` and `@anthropic-ai/sdk` remain in `artifacts/majalis/package.json` **dependencies**.

---

## 8. Vercel error aggregation (24h / 7d)

| Window | Status |
|---|---|
| Last 24 hours (grouped by message / path / deployment) | **NOT MEASURED** — no Vercel API/token in agent |
| Last 7 days | **NOT MEASURED** |

### Known error classes from prior audits + live symptoms (qualitative)

These are **historical / symptomatic**, not a counted log pull:

- Function bootstrap failure → generic Arabic 500 on `/api/healthz` (live now).
- Prior reports: `Cannot find package 'pg'`, `Cannot find package '@anthropic-ai/sdk'`, `credit_exhausted`, `ERR_HTTP_HEADERS_SENT` / `double_response_blocked`, `durable_store_unavailable`, slug→UUID query failures.

**Phase 1 must open with a real Vercel log export** (Dashboard or API) before claiming quantitative reduction.

---

## 9. CI workflows currently required / active

Enumerated via `gh api …/actions/workflows` (state=active):

| Workflow | Path | Role |
|---|---|---|
| CI (`Verify build`) | `.github/workflows/ci.yml` | Required quality gate on PR→main: typecheck, ESLint `--max-warnings=0`, full `pnpm test`, build, `git diff --exit-code`, no-runtime-ddl, platform hardening SQL |
| Auto-ready and merge PRs to main | `.github/workflows/auto-merge-to-main.yml` | Squash auto-merge after green checks (schedule `*/15`) |
| Resolve PR conflicts from main | `.github/workflows/resolve-pr-conflicts.yml` | Merge `main` into behind/conflicting PRs |
| Auto Deploy main → production | `.github/workflows/auto-deploy.yml` | Post-merge health verification |
| Preview smoke | `.github/workflows/preview-smoke.yml` | Commit-linked smoke |
| iOS Capacitor Gates | `.github/workflows/ios-capacitor-gates.yml` | Static iOS/Capacitor gates (ubuntu) |
| iOS native (macOS) | `.github/workflows/ios-native-macos.yml` | `xcodebuild` simulator when iOS paths change |
| Release Majlisilm | `.github/workflows/release-majlisilm.yml` | Manual dual-branch release |
| Production / Platform / Owner bootstrap | `production-bootstrap.yml`, `platform-bootstrap.yml`, `owner-bootstrap.yml` | Manual/dispatch ops |
| Phase 2 Trial Import | `phase2-trial-import.yml` | Manual |
| Quran Engine Tests | `quran-engine-tests.yml` | Active |
| PR status comments (no auto-merge) | `pr-status-no-automerge.yml` | Active |

**Branch protection API:** `403 Resource not accessible by integration` from this token — cannot confirm required checks list programmatically. Repo settings observed: `allow_auto_merge=true`, `delete_branch_on_merge=true`, `default_branch=main`.

---

## 10. Bundle sizes (Entry JS / Icons / CSS)

### Production (live CDN assets, gzip-9 recomputed)

| Asset | File | Raw | Gzip-9 | Budget |
|---|---|---:|---:|---|
| Entry JS | `index-D0nh4fDN.js` | 544 906 | **145.6 KiB** | ≤ 160 KiB |
| Icons | `icons-BUkVSt4Q.js` | 68 797 | **21.6 KiB** | ≤ 30 KiB |
| Main CSS | `index-CbseZQ74.css` | 497 639 | **88.8 KiB** | ≤ 100 KiB |

### Local rebuild at baseline SHA

`PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build` then `test:bundle-budget`:

| Metric | Result |
|---|---|
| Entry JS gzip | **144.8 KiB** ✓ |
| Icons gzip | **21.4 KiB** ✓ |
| CSS gzip | **88.9 KiB** ✓ |
| Mega-seed IDs in entry | absent ✓ |

---

## 11. iOS Version / Build (repo)

| Field | Value | Source |
|---|---|---|
| Bundle ID (App) | `com.yousef.majlisilm` | `project.pbxproj` |
| Bundle ID (Live Activity) | `com.yousef.majlisilm.PrayerLiveActivity` | `project.pbxproj` |
| Development Team | `5D8TX37HTS` | `project.pbxproj` |
| Marketing Version | **1.0** | `MARKETING_VERSION` |
| Build Number | **9** | `CURRENT_PROJECT_VERSION` |
| Scheme / project | `App` / `artifacts/majalis/ios/App/App.xcodeproj` | Repo |
| TestFlight / Archive this phase | **Not run** (Linux agent + Phase 0 docs-only) | — |

---

## 12. Explicit non-actions (Phase 0)

This Phase 0 document / PR:

- Does **not** change application code, SQL, RLS, or Capacitor native sources.
- Does **not** apply SQL on Production.
- Does **not** alter Bundle ID / Team / Signing / Version / Build.
- Does **not** upload TestFlight.
- Does **not** push to `main` directly.
- Does **not** start Phase 1 (`fix/p0-vercel-runtime`) until this PR is merged and production reflects the docs commit (or owner waives docs-deploy wait).

---

## 13. Phase gate decision inputs (for Phase 1)

| Signal | Status now | Blocks TestFlight? |
|---|---|---|
| `/api/healthz` healthy | **FAIL** (HTTP 500) | **YES** |
| `/api/readyz` ready | **FAIL** (HTTP 503) | **YES** |
| Bundle budgets | PASS | No |
| Vercel error counts | Unknown (no API) | Treat as unknown risk |
| Schema/queue durability | Unverified live | Treat as P0 for Phase 2 |
| iOS device validation | Not started | Blocks TestFlight upload (later phases) |

**Phase 0 verdict for starting Phase 1 after merge:** documentation complete; **runtime Production API is not healthy** — Phase 1 (`fix/p0-vercel-runtime`) is the correct next branch.
