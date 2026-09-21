# CURRENT RELEASE TRUTH — سُنّة

**Generated:** 2026-09-21  
**Program:** SUNNAH FULL PROJECT REMEDIATION (post-audit)  
**Wave:** Wave 8 — deep links + lessons-guide  
**Authority:** Measured from `origin/main` + live production — not from stale freeze pins alone.  
**Canonical status surface:** `docs/release/CURRENT_PROJECT_STATUS.md`

---

## Pins (verified this run)

| Surface | Value | Evidence |
|---|---|---|
| Git root | resolve via `git rev-parse --show-toplevel` | command |
| `origin/main` (Wave 8 base) | `98e29a655bc48a461e469cfc16fe154cc095c28a` | `git rev-parse origin/main` |
| Production `version.json` | re-check after merge | HTTP 200 |
| Full project audit | `docs/audit/SUNNAH_FULL_PROJECT_AUDIT.md` · status `PARTIAL` | committed baseline |
| Library route intent | `docs/content-quality/LIBRARY_ROUTE_INTENT.md` | Wave 8 PRODUCT_INTENT |
| Store RC pin | **not set by owner** — web tip ≠ automatic Store RC | HOLD |
| Historical tip (STALE) | `5e99cd7c` (audit/Wave1) · `168e2155f` (Wave 7 base) | superseded |

**Smoke:** Store remains **HOLD**. Deep-link series slug preserve gated in this wave.

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
| Full Remediation Waves 1–7 | #2192–#2198 |

### STALE_REPORT (corrected in earlier waves)

| Report | Stale claim | Actual |
|---|---|---|
| Prior `CURRENT_RELEASE_TRUTH` / Stabilization / Store readiness pins | tip `3ba020f2` | tip + prod advanced past audit SHA |
| `AGENTS.md` hard-coded root | `/Users/alabdullmohsen/majalis-correct/` | use `git rev-parse --show-toplevel` |
| Audit snapshot numbers | freeze at audit SHA | re-verify each remediation wave |

### CONFIRMED_OPEN → Full Remediation waves (14)

| Item | Severity | Target wave |
|---|---|---|
| Deep links `/learn/series/:slug` (+ `/library` intent) | P0/P1 | **Wave 8 (this PR)** |
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

Unchanged policy: QPC · Hisn · everyayah/mp3quran offline · madinah uncertain · qatami rejected · library `source_missing` (public hidden Wave 3) · sects unpublished.

---

## Explicit non-claims

- Store readiness is still **HOLD**.  
- `SUNNAH_STABILIZATION_COMPLETE` is **not** declared.  
- `SUNNAH_FULL_REMEDIATION_COMPLETE` is **not** declared.  
- `SUNNAH_FULL_AUDIT_COMPLETE` is **not** declared (audit = `PARTIAL`).  
- Green CI ≠ scholarly verification ≠ device verification ≠ license clearance.
