# CURRENT RELEASE TRUTH — سُنّة

**Generated:** 2026-09-21  
**Program:** SUNNAH FULL PROJECT REMEDIATION (post-audit)  
**Wave:** Wave 1 — truth / docs sync only  
**Authority:** Measured from `origin/main` + live production — not from stale freeze pins alone.  
**Canonical status surface:** `docs/release/CURRENT_PROJECT_STATUS.md`

---

## Pins (verified this run)

| Surface | Value | Evidence |
|---|---|---|
| Git root | resolve via `git rev-parse --show-toplevel` (example worktree: `/Users/alabdullmohsen/majlis-app`) | command |
| `origin/main` | `5e99cd7cf53244444916b0ecd7b55b3a8953cfd8` | `git rev-parse origin/main` |
| Local HEAD (at truth capture) | same as `origin/main` | clean match |
| Production host | `https://www.ssunnah.com` | operational |
| Production `version.json` | `5e99cd7c` · `builtAt` `2026-09-21T12:10:15.331Z` · `ref` `main` | HTTP 200 |
| Production home | HTTP 200 | curl |
| Full project audit | `docs/audit/SUNNAH_FULL_PROJECT_AUDIT.md` · status `PARTIAL` | committed baseline |
| Store RC pin | **not set by owner** — web tip ≠ automatic Store RC | `STORE_100_PERCENT_READINESS.md` |
| Historical tip (STALE) | `3ba020f2…` (pre #2190/#2191) | superseded |

**Smoke:** Production commit **matches** `origin/main` tip at capture. Store remains **HOLD**.

---

## Classification matrix (2026-09-21 · post-audit recount)

### ALREADY_FIXED (evidence on main)

| Item | Evidence |
|---|---|
| Stabilization PR-1…PR-7 | Merged #2181–#2187 |
| Dual splash / tagline «رفيقك في العلم والعمل» | #2188 |
| CC0 field / field-full adhan | #2189 |
| Prior remediation truth sync | #2190 |
| Store/license asset guards | #2191 |
| Admin tools isolated from public chrome | #2182 |

### STALE_REPORT (corrected in this wave)

| Report | Stale claim | Actual |
|---|---|---|
| Prior `CURRENT_RELEASE_TRUTH` / Stabilization / Store readiness pins | tip `3ba020f2` | tip + prod = `5e99cd7c` |
| `AGENTS.md` hard-coded root | `/Users/alabdullmohsen/majalis-correct/` | use `git rev-parse --show-toplevel` |
| Audit snapshot numbers | freeze at audit SHA | re-verify each remediation wave |

### CONFIRMED_OPEN → Full Remediation waves (14)

| Item | Severity | Target wave |
|---|---|---|
| Active status docs drift | P0 | **Wave 1 (this PR)** |
| Store flavor / license binary strip hardening (beyond #2191) | P0 | Wave 2 |
| Library public UI must not expose `source_missing` (172) | P0 | Wave 3 |
| Publication honesty / empty states (sects 0 published, quiz, etc.) | P0/P1 | Wave 4 |
| Admin v3 Shell | P1 | Wave 5 |
| Admin v3 Centers | P1 | Wave 6 |
| Legacy Admin migration then delete | P1 | Wave 7 |
| Deep links `/learn/series/:slug` (+ `/library` intent) | P0/P1 | Wave 8 |
| Mushaf UI 34 no-op scripts + device prep | P0/P1 | Wave 9 |
| Prayer / adhan / audio reliability | P1 | Wave 10 |
| Entry JS margin · fiqh-books soft | P1 | Wave 11 |
| Responsive / a11y / visual sweep | P1/P2 | Wave 12 |
| Legacy CSS SAFE_REMOVE · close #1791 | P2 | Wave 13 |
| Store/production closure docs | P1 | Wave 14 |

### OWNER_ONLY

See `docs/release/OWNER_ACTIONS_CURRENT.md`.

### DEVICE_REQUIRED

- iOS/Android prayer notification delivery matrix  
- Verified adhan/notification sound on physical device  
- Mushaf geometry/gesture/FPS on SE / Pro Max / iPad (+ Split View)  

### BLOCKED_LICENSE / BLOCKED_SOURCE

Unchanged policy: QPC · Hisn · everyayah/mp3quran offline · madinah uncertain · qatami rejected · library `source_missing` 172 (recount via `audit-library-sources.mjs`) · sects unpublished.

---

## Explicit non-claims

- Store readiness is still **HOLD**.  
- `SUNNAH_STABILIZATION_COMPLETE` is **not** declared.  
- `SUNNAH_FULL_REMEDIATION_COMPLETE` is **not** declared.  
- `SUNNAH_FULL_AUDIT_COMPLETE` is **not** declared (audit = `PARTIAL`).  
- Green CI ≠ scholarly verification ≠ device verification ≠ license clearance.
