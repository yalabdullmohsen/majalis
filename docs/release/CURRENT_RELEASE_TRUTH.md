# CURRENT RELEASE TRUTH — سُنّة

**Generated:** 2026-09-21  
**Program:** SUNNAH FULL REMEDIATION (post report 2026-09-21)  
**Wave:** Remediation PR-1 (truth sync only)  
**Authority:** Measured from `origin/main` + live production — not from stale freeze pins alone.

---

## Pins (verified this run)

| Surface | Value | Evidence |
|---|---|---|
| Git root | `/Users/alabdullmohsen/majlis-app` | `git rev-parse --show-toplevel` |
| `origin/main` | `3ba020f2f402b81f01dce3ceeb809f78c3ab1089` | `git rev-parse origin/main` |
| Local HEAD (at truth capture) | same as `origin/main` | clean match |
| Production host | `https://www.ssunnah.com` | operational |
| Production `version.json` | `3ba020f2` · `builtAt` `2026-09-21T10:39:12.258Z` · `ref` `main` | HTTP 200 |
| Production home | HTTP 200 | curl |
| Store RC pin (historical) | see `STORE_100_PERCENT_READINESS.md` | **stale vs tip** — do not treat as live tip |
| Release-freeze SoT (historical) | `b0efc979…` in old freeze doc | **stale** — superseded for main tip policy below |

**Smoke:** Production commit **matches** `origin/main` tip. No live CI failure observed on tip at capture time.

---

## Classification matrix (2026-09-21)

### ALREADY_FIXED (evidence on main)

| Item | Evidence |
|---|---|
| Stabilization PR-1…PR-6 | Merged #2181–#2186 |
| Stabilization PR-7 legacy cleanup (SAFE_REMOVE wave) | Merged #2187 · `LEGACY_CLEANUP_REPORT.md` |
| Dual splash / single official launch | Merged #2188 |
| CC0 field / field-full adhan in catalog + bundle | Merged #2189 · production-approved audio ids include `field`, `field-full` |
| Admin tools isolated from public chrome (wave) | #2182 |

### STALE_REPORT (corrected in this PR)

| Report | Stale claim | Actual |
|---|---|---|
| `SUNNAH_STABILIZATION_REPORT.md` | PR-7 `IN_PROGRESS` | **MERGED** #2187 |
| `RELEASE_FREEZE.md` (pre-fix) | Absolute freeze on all main merges; SoT `b0efc979` | Main tip advanced under Stabilization + Remediation; freeze clarified as **Store RC** policy |
| Store readiness pins | Old Phase-0 / PR-A SHAs as “current” | Tip is `3ba020f2`; verdict remains **HOLD** |

### CONFIRMED_OPEN (implementable in later remediation waves)

| Item | Severity | Target wave |
|---|---|---|
| Stabilization Admin v3 shell / centers | P1 | Remediation PR-5 / PR-6 (program) · Stabilization PR-8 / PR-9 |
| Legacy Admin delete readiness | P1 | Blocked until migration · Stabilization PR-10 |
| Content honesty / empty-state publication guards | P0/P1 | Remediation PR-4 · Stabilization PR-11 |
| Library public UI must not expose `source_missing` | P0 | Remediation PR-3 |
| Deep links `/learn/series/:slug` | P1 | Remediation PR-8 |
| Lessons-guide / map behind flags + BLOCKED_DATA | P1 | Remediation PR-8 |
| Mushaf UI package scripts no-op / device prep | P1 | Remediation PR-9 |
| Prayer notification code path + sound reliability | P1 | Remediation PR-10 |
| Entry JS near ceiling (~120.29 KiB gzip) · fiqh-books soft | P0/P1 | Remediation PR-11 |
| Remaining SAFE_REMOVE / NEEDS_PORT CSS (HomepageAdBar, brand-v4/m2030 port) | P2 | Remediation PR-12 |
| Draft PR #1791 offline-first | P2 | Remediation PR-12 (close or re-port) |
| Final validation / COMPLETE gate | P1 | Remediation PR-12 · Stabilization PR-12 |

### OWNER_ONLY

See `docs/release/OWNER_ACTIONS_CURRENT.md`.

- Bundle ID, signing, App Store Connect, production secrets  
- Hosted SQL apply / Auth MFA / leaked-password  
- License acceptance / store binary CAF exclusion decisions  
- Approving madinah or qatami rights  
- Declaring App Store GO  

### DEVICE_REQUIRED

- iOS/Android prayer notification delivery matrix (fg/bg/killed/lock/silent/focus)  
- Verified adhan/notification sound playback on device  
- Mushaf geometry/gesture/FPS on SE / Pro Max / iPad (+ Split View)  

Do **not** mark COMPLETE without run evidence.

### BLOCKED_LICENSE

| Asset / family | Status |
|---|---|
| QPC font redistribution for store binary | مطلوب / قرار بشري |
| everyayah / mp3quran offline packs | جزئي — live only until signed ToS |
| Hisn Muslim edition rights | مطلوب |
| Embedded non-CC0 adhan celebrity / uncertain packs | غير محسوم / مرفوض للإنتاج |
| `madinah` adhan id | `rights_uncertain` · `approvedForProduction: false` |
| `qatami` adhan id | `rejected` · blocked from UI |
| ~172 library books without verified source | لا اختلاق روابط |

### BLOCKED_SOURCE

| Corpus | Counts (recount 2026-09-21 via `audit-library-sources.mjs`) |
|---|---|
| Library books | total **190** · `source_verified` **18** · `source_missing` **172** · `source_broken` **0** |
| Quiz / sects / rulings pending human review | remain unpublished — no auto-publish |

### IMPLEMENTABLE_NOW (queue order)

1. This PR — truth sync  
2. Store/license guardrails (no owner secrets)  
3. Library integrity UI + verified-only surfaces  
4. Content publication guards / empty states  
5. Admin v3 shell → centers → migration readiness  
6. Deep links + lessons-guide honesty  
7. Mushaf gates restoration prep + device runbook  
8. Prayer/adhan reliability (code) + device runbook  
9. Performance / entry budget margin  
10. Legacy cleanup + draft PR hygiene + final reports  

---

## Program map (do not collapse into one PR)

| Remediation PR | Focus | Notes |
|---|---|---|
| PR-1 | Truth + freeze/store/stabilization sync | **this wave** |
| PR-2 | Store & license guardrails | no Bundle ID / signing |
| PR-3 | Library source integrity | no invent URLs |
| PR-4 | Content publication / empty states | no scholarly auto-publish |
| PR-5 | Admin v3 shell | no Legacy delete |
| PR-6 | Admin v3 centers | — |
| PR-7 | Admin migration readiness | Legacy delete only if READY |
| PR-8 | Deep links + lessons guide | flags stay honest |
| PR-9 | Mushaf gates + device prep | DEVICE_REQUIRED for hardware |
| PR-10 | Prayer / adhan reliability | DEVICE_REQUIRED for device matrix |
| PR-11 | Performance / budgets | no raising budgets |
| PR-12 | Legacy cleanup + final validation | CLOSE #1791 or re-port |

Stabilization numbering (PR-8…12 in `SUNNAH_STABILIZATION_REPORT.md`) remains the product-facing admin/content completion track and aligns with Remediation PR-5…12.

---

## Explicit non-claims

- Store readiness is still **HOLD**.  
- `SUNNAH_STABILIZATION_COMPLETE` is **not** declared.  
- `SUNNAH_FULL_REMEDIATION_COMPLETE` is **not** declared.  
- Green CI ≠ scholarly verification ≠ device verification ≠ license clearance.
