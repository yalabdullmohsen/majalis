# Open PR Governance Report — `yalabdullmohsen/majalis`

**Generated:** 2026-07-30 (reference date for age).  
**Scope:** 45 open PRs targeting `main` (via `gh` + `git fetch` / `git diff --stat origin/main...origin/<branch>`).  
**Actions taken:** none (read-only; no PR closes, no pushes).

## Summary — safe closes

### CI gates (#626 / #620) — closes justified by CI-only overlap?

**No open PR is recommended for `close-as-duplicate` / `close-as-superseded` solely as a proven CI-only duplicate of #626 or #620.**

- **#626** (`cursor/fix-platform-ci-gates-1f54`) is the freshest CI-gates tip vs `main` (still CONFLICTING; keep). It is **not** CI-only: besides workflows it also touches Postgres/queue verify scripts, reliability SQL/tests, and content-count/manifest generators.
- **#620** (`cursor/governance-ci-hardening-1f54`) is an **earlier** CI-hardening attempt with large path overlap with #626 (`ci.yml`, `auto-merge-to-main.yml`, `CODEOWNERS`, `tsconfig.json`, `verify-no-unsafe-auto-merge.mjs`, api-server tsconfig), but it is **not a file-set subset** of #626. Unique-to-#620 paths still differ from main: `pr-status-no-automerge.yml` (absent on main and on #626), `ios-native-macos.yml` deletions, `resolve-pr-conflicts.yml` tweak, `.gitignore`, `docs/operations/github-branch-protection.md`. Overlapping workflow blobs also **differ** from #626 tip (`ci.yml` / `auto-merge-to-main.yml`). → **`needs-manual-review`** (do not auto-close).
- **#618** shares some governance/CI files with #620/#626 but adds product hardening (queue/AI/cron, preview-smoke, audit docs) under `[NO-AUTO-MERGE]` → **`keep`**.

### Proven non-CI closes (stacked product series only)

These are **not** CI duplicates of #626/#620. They are recommended close only because file-level stacking / tip containment is proven:

| PR | Reason |
|---|---|
| **#513** | All 7 new paths ⊆ **#514** (master polish consolidation of part23); close-as-superseded by #514 |
| **#516** | Path-superset stack under **#532** (HomeDashboard tip); earlier new modules evolved forward on tip → close-as-superseded by #532 |
| **#517** | Path-superset stack under **#532** (HomeDashboard tip); earlier new modules evolved forward on tip → close-as-superseded by #532 |
| **#519** | Path-superset stack under **#532** (HomeDashboard tip); earlier new modules evolved forward on tip → close-as-superseded by #532 |
| **#520** | Path-superset stack under **#532** (HomeDashboard tip); earlier new modules evolved forward on tip → close-as-superseded by #532 |
| **#521** | Path-superset stack under **#532** (HomeDashboard tip); earlier new modules evolved forward on tip → close-as-superseded by #532 |
| **#523** | Path-superset stack under **#532** (HomeDashboard tip); earlier new modules evolved forward on tip → close-as-superseded by #532 |
| **#526** | Path-superset stack under **#532** (HomeDashboard tip); earlier new modules evolved forward on tip → close-as-superseded by #532 |
| **#528** | Path-superset stack under **#532** (HomeDashboard tip); earlier new modules evolved forward on tip → close-as-superseded by #532 |
| **#530** | Path-superset stack under **#532** (HomeDashboard tip); earlier new modules evolved forward on tip → close-as-superseded by #532 |
| **#531** | Path-superset stack under **#532** (HomeDashboard tip); earlier new modules evolved forward on tip → close-as-superseded by #532 |

**Not closed despite related work:** #532 (keep tip), #514 (keep), #534/#559/#570/#572 (unique modules), #583–#586 (immersive symbols largely on main but residual three-dot deltas → needs-manual-review), #618/#626 (keep), #620 (needs-manual-review).

### Method notes

- **Age:** calendar days from PR `createdAt` date to **2026-07-30**.
- **conflict:** GitHub `mergeable` / `mergeStateStatus` (all listed PRs currently `CONFLICTING` / `DIRTY`).
- **superseded_by:** later open tip or `main` when path/blob evidence supports it; `—` otherwise.
- Prefer **`keep` / `needs-manual-review`** when unique product code remains or proof is incomplete.

## Full table

| PR | branch | age | conflict | superseded_by | unique_changes | recommendation |
|---|---|---|---|---|---|---|
| #466 | `cursor/quran-focus-azkar-quiz-khatmah-1f54` | 2d | CONFLICTING/DIRTY | — | 5 edu hooks (focus/azkar/quiz/khatmah/tafseer) — not on main | **keep** |
| #468 | `cursor/reading-analytics-bookmarks-prefetch-1f54` | 2d | CONFLICTING/DIRTY | — | 5 analytics/bookmarks/SM-2/prefetch hooks — not on main | **keep** |
| #470 | `cursor/learning-tracks-fiqh-backup-1f54` | 2d | CONFLICTING/DIRTY | — | 5 learning-track/fiqh/backup hooks — not on main | **keep** |
| #473 | `cursor/hadith-audio-circadian-sync-recall-1f54` | 2d | CONFLICTING/DIRTY | — | 5 hadith/audio/circadian/recall hooks — not on main | **keep** |
| #478 | `cursor/unified-quranic-logic-engine-1f54` | 2d | CONFLICTING/DIRTY | — | unified offline-first logic engine + services — not on main | **keep** |
| #480 | `cursor/enterprise-perf-hardening-1f54` | 2d | CONFLICTING/DIRTY | — | enterprise perf utils (defer-storage, today-key) + tests — unique | **keep** |
| #482 | `cursor/systems-polish-resilience-1f54` | 2d | CONFLICTING/DIRTY | — | idb migrate, offline queue, audio-focus — unique vs later | **keep** |
| #484 | `cursor/main-thread-workers-resilience-1f54` | 2d | CONFLICTING/DIRTY | — | search worker core, browser-features, list-window — unique | **keep** |
| #485 | `cursor/cold-boot-audio-deeplink-1f54` | 2d | CONFLICTING/DIRTY | — | audio-retry, idle-defer, protected-session — unique | **keep** |
| #487 | `cursor/runtime-perf-workers-1f54` | 2d | CONFLICTING/DIRTY | — | rAF/frame-budget/audio-memory + hook shims — unique | **keep** |
| #493 | `cursor/concurrency-idle-streams-1f54` | 2d | CONFLICTING/DIRTY | — | idle streams / mutex hooks suite (17 new) — unique | **keep** |
| #495 | `cursor/system-hardening-part10-1f54` | 2d | CONFLICTING/DIRTY | — | battery-throttle, async-mutex, system hardening — unique | **keep** |
| #497 | `cursor/runtime-gesture-fetch-part11-1f54` | 2d | CONFLICTING/DIRTY | — | gesture-raf, safe-regex, audio-cache-integrity — unique | **keep** |
| #498 | `cursor/audio-sync-workers-part12-1f54` | 2d | CONFLICTING/DIRTY | — | audio-raf-clock, analytics-worker, permission shield — unique | **keep** |
| #499 | `cursor/multitab-prefetch-search-part13-1f54` | 2d | CONFLICTING/DIRTY | — | aho-corasick, cross-tab-leader, adaptive-prefetch — unique | **keep** |
| #500 | `cursor/gc-hibernate-compress-part14-1f54` | 2d | CONFLICTING/DIRTY | — | compress-store, page-hibernate, GC suite — unique | **keep** |
| #502 | `cursor/webview-crypto-lifecycle-part15-1f54` | 2d | CONFLICTING/DIRTY | — | webview lifecycle, device-capabilities, layout-batch — unique | **keep** |
| #504 | `cursor/chunk-incognito-virtual-part17-1f54` | 2d | CONFLICTING/DIRTY | — | resumable Range, private-storage, journey-perf — unique | **keep** |
| #505 | `cursor/prefetch-audio-crdt-part18-1f54` | 2d | CONFLICTING/DIRTY | — | speculative prefetch, LWW CRDT, crossfade — unique vs #514 | **keep** |
| #508 | `cursor/v8-stream-outbox-part20-1f54` | 2d | CONFLICTING/DIRTY | — | V8 shapes, binary stream, outbox, audio pool — unique vs #514 | **keep** |
| #513 | `cursor/rtt-sw-mse-inp-part23-1f54` | 2d | CONFLICTING/DIRTY | #514 | Part23 new modules all present on #514 tip; only keyboard-inp.ts content drifted slightly | **close-as-superseded** |
| #514 | `cursor/master-polish-consolidation-1f54` | 2d | CONFLICTING/DIRTY | — | Master polish consolidation (V8/Range/MSE/INP) — 18 new modules not on main | **keep** |
| #516 | `cursor/quran-reader-ayah-tarteel-1f54` | 2d | CONFLICTING/DIRTY | #532 | Stacked under HomeDashboard tip: all paths ⊆ #532; new-module blobs mostly match tip (evolved forward) | **close-as-superseded** |
| #517 | `cursor/quran-engine-part2-memorize-tadabbur-1f54` | 2d | CONFLICTING/DIRTY | #532 | Stacked under HomeDashboard tip: all paths ⊆ #532; new-module blobs mostly match tip (evolved forward) | **close-as-superseded** |
| #519 | `cursor/quran-engine-part3-mutashabihat-sync-1f54` | 2d | CONFLICTING/DIRTY | #532 | Stacked under HomeDashboard tip: all paths ⊆ #532; new-module blobs mostly match tip (evolved forward) | **close-as-superseded** |
| #520 | `cursor/quran-engine-part4-page-curl-wird-1f54` | 2d | CONFLICTING/DIRTY | #532 | Stacked under HomeDashboard tip: all paths ⊆ #532; new-module blobs mostly match tip (evolved forward) | **close-as-superseded** |
| #521 | `cursor/quran-engine-consolidation-1f54` | 2d | CONFLICTING/DIRTY | #532 | Stacked under HomeDashboard tip: all paths ⊆ #532; new-module blobs mostly match tip (evolved forward) | **close-as-superseded** |
| #523 | `cursor/quran-engine-qa-pipeline-1f54` | 2d | CONFLICTING/DIRTY | #532 | Stacked under HomeDashboard tip: all paths ⊆ #532; new-module blobs mostly match tip (evolved forward) | **close-as-superseded** |
| #526 | `cursor/quran-core-structure-1f54` | 2d | CONFLICTING/DIRTY | #532 | Stacked under HomeDashboard tip: all paths ⊆ #532; new-module blobs mostly match tip (evolved forward) | **close-as-superseded** |
| #528 | `cursor/optional-tajweed-coloring-1f54` | 2d | CONFLICTING/DIRTY | #532 | Stacked under HomeDashboard tip: all paths ⊆ #532; new-module blobs mostly match tip (evolved forward) | **close-as-superseded** |
| #530 | `cursor/audio-engine-core-1f54` | 2d | CONFLICTING/DIRTY | #532 | Stacked under HomeDashboard tip: all paths ⊆ #532; new-module blobs mostly match tip (evolved forward) | **close-as-superseded** |
| #531 | `cursor/tafseer-service-drawer-1f54` | 2d | CONFLICTING/DIRTY | #532 | Stacked under HomeDashboard tip: all paths ⊆ #532; new-module blobs mostly match tip (evolved forward) | **close-as-superseded** |
| #532 | `cursor/home-dashboard-1f54` | 2d | CONFLICTING/DIRTY | — | Quran engine tip: HomeDashboard + ~95 new modules (offline/core/panels) not on main | **keep** |
| #534 | `cursor/quran-engine-going-live-1f54` | 2d | CONFLICTING/DIRTY | — | Going-live docs + web-vitals-reporter (new) — not on main | **keep** |
| #559 | `cursor/quran-reading-history-1f54` | 2d | CONFLICTING/DIRTY | — | useLogReadingProgress + quran-reading-history (new) — not on main | **keep** |
| #570 | `cursor/quran-reciter-audio-urls-1f54` | 2d | CONFLICTING/DIRTY | — | quran-reciters.ts + tests (new) — not on main | **keep** |
| #572 | `cursor/quran-audio-playback-speed-1f54` | 2d | CONFLICTING/DIRTY | — | quran-playback-speed.ts (new) + AudioEngine speed wiring — not fully on main as this module | **keep** |
| #583 | `cursor/quran-immersive-controller-1f54` | 2d | CONFLICTING/DIRTY | main (later immersive landings) | QuranController/ImmersiveQuranPage already on main (several blobs identical); residual mostly deletions vs newer main | **needs-manual-review** |
| #584 | `cursor/quran-master-immersive-architecture-1f54` | 2d | CONFLICTING/DIRTY | main (later immersive landings) | Master immersive architecture symbols on main; many tip blobs identical; residual deletion-heavy | **needs-manual-review** |
| #585 | `cursor/quran-app-controller-immersive-1f54` | 2d | CONFLICTING/DIRTY | main (later immersive landings) | QuranAppController/ImmersiveQuranApp on main; core libs identical tip; some UI still differs (+/−) | **needs-manual-review** |
| #586 | `cursor/majlisilm-flutter-shell-1f54` | 2d | CONFLICTING/DIRTY | main (later immersive landings) | Majlis shell widgets mostly on main; large identical set; residual deletions in CSS/nav | **needs-manual-review** |
| #602 | `cursor/production-root-fixes-1f54` | 1d | CONFLICTING/DIRTY | — | Unique: content-dedupe + production audits; but ~900 seo-prerender churn + CONFLICTING — triage carefully | **needs-manual-review** |
| #618 | `cursor/fix-pr616-production-hardening-1f54` | 1d | CONFLICTING/DIRTY (draft) | — | [NO-AUTO-MERGE] preview-smoke, durable queue/AI hardening, audit docs; not fully on main — KEEP | **keep** |
| #620 | `cursor/governance-ci-hardening-1f54` | 1d | CONFLICTING/DIRTY | partially #626 (CI overlap only) | Older CI gates; overlaps #626 on ci.yml/auto-merge/CODEOWNERS/tsc but NOT a subset — unique: pr-status-no-automerge.yml (new), ios-native-macos deletions, docs, .gitignore | **needs-manual-review** |
| #626 | `cursor/fix-platform-ci-gates-1f54` | 1d | CONFLICTING/DIRTY | — | Latest CI gates: tsc -b, Postgres queue verify, safer auto-merge, CODEOWNERS; still differs from main — KEEP as CI tip | **keep** |

## Special focus

### PR #626 — `cursor/fix-platform-ci-gates-1f54`

- **Status:** open, Ready, CONFLICTING/DIRTY, age 1d.
- **vs `main`:** 20 files, +705/−357 (three-dot).
- **Key deltas still off main:** `.github/workflows/ci.yml`, `auto-merge-to-main.yml`, `.github/CODEOWNERS`, root `tsconfig.json` / `package.json`, `scripts/verify-no-unsafe-auto-merge.mjs`, `scripts/db-migration-verify.mjs`, `scripts/test-postgres-queue-integration.mjs`, plus some majalis reliability/test/SQL and content-count/manifest script churn.
- **Recommendation:** **keep** (current CI-gates candidate; resolve conflicts then merge).

### PR #620 — `cursor/governance-ci-hardening-1f54`

- **Status:** open, CONFLICTING/DIRTY, age 1d (created ~3h before #626).
- **vs `main`:** 16 files, +447/−224.
- **Overlap with #626:** 11 paths (workflows, CODEOWNERS, tsconfigs, verify script, content-count/manifest generators).
- **Not subset of #626:** `pr-status-no-automerge.yml`, `ios-native-macos.yml` (deletes lines vs main), `resolve-pr-conflicts.yml`, `.gitignore`, `docs/operations/github-branch-protection.md`.
- **Blob compare:** overlapping `ci.yml` / `auto-merge-to-main.yml` / `verify-no-unsafe-auto-merge.mjs` **differ** from #626 tip (#626 is ahead on those).
- **Recommendation:** **needs-manual-review** — cherry-pick any unique workflow bits into #626 if desired, then close; do **not** treat as proven pure duplicate.

### PR #618 — `[NO-AUTO-MERGE]` production hardening

- **Status:** Draft, CONFLICTING, age 1d.
- **Unique still valuable:** `preview-smoke.yml`, audit/ops docs under `docs/audits` & `docs/operations`, queue/AI/cron hardening diffs, verify scripts.
- **Recommendation:** **keep** unless a future audit proves every product delta already on `main` (currently not).

### Quran engine series #516–#586

- **#516→#532** form a **strict path-superset stack** (`prev_all ⊆ curr` at every step). Tip **#532** still has ~95 paths absent from `main` (offline engine, panels, HomeDashboard page, etc.) → keep #532; close earlier stack PRs as superseded by #532.
- **#534, #559, #570, #572** introduce modules/symbols not found on `main` (`web-vitals-reporter`, `useLogReadingProgress`, `quran-reciters`, `quran-playback-speed`) → **keep**.
- **#583–#586:** `QuranController` / `ImmersiveQuranApp` / `QuranAppController` / shell pieces already exist on `main` with many identical tip blobs; remaining three-dot hunks are often deletion-heavy against newer main → **needs-manual-review** (likely close-as-superseded after human confirm no intentional regression fixes).

## Counts

- **keep:** 28
- **close-as-superseded:** 11
- **close-as-duplicate:** 0
- **needs-manual-review:** 6

---

*Report only — no PRs were closed or modified by this analysis.*
