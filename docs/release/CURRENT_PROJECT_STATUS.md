# CURRENT PROJECT STATUS — سُنّة

**Status surface of record** (single source for agents).  
**Updated:** 2026-09-21 · Full Remediation **Wave 1**  
**Detail pins:** `docs/release/CURRENT_RELEASE_TRUTH.md`  
**Audit baseline:** `docs/audit/SUNNAH_FULL_PROJECT_AUDIT.md` (`PARTIAL`)

---

## Repository tip

| Field | Value |
|---|---|
| `origin/main` | `5e99cd7cf53244444916b0ecd7b55b3a8953cfd8` |
| Resolve root | `git rev-parse --show-toplevel` (do **not** hard-code machine paths) |
| Remote | `https://github.com/yalabdullmohsen/majalis.git` |

## Production tip

| Field | Value |
|---|---|
| Host | `https://www.ssunnah.com` |
| `version.json` commit | `5e99cd7c` |
| `builtAt` | `2026-09-21T12:10:15.331Z` |
| Parity with `origin/main` | **MATCHED** at Wave-1 capture |

## Store readiness

**HOLD** — see `docs/store-release/STORE_100_PERCENT_READINESS.md`.  
Web tip is **not** an automatic Store RC pin.

## Program progress

| Wave | Focus | State |
|---|---|---|
| 1 | Truth / docs / AGENTS path / status surface | **MERGED** (#2192) |
| 2 | Store & licenses (guards beyond #2191) | **IN_PROGRESS** |
| 3 | Library sources (hide `source_missing`) | QUEUED |
| 4 | Publication honesty | QUEUED |
| 5–7 | Admin v3 shell → centers → legacy migration | QUEUED |
| 8 | Deep links + lessons guide | QUEUED |
| 9 | Mushaf gates + device prep | QUEUED |
| 10 | Prayer / adhan / audio | QUEUED |
| 11 | Performance / bundles | QUEUED |
| 12 | Responsive / a11y / visual | QUEUED |
| 13 | Legacy cleanup + #1791 | QUEUED |
| 14 | Store/production closure docs | QUEUED |

Prior merges still valid: Stabilization #2181–#2187 · splash #2188 · CC0 adhan #2189 · truth #2190 · store guards #2191 · Wave 1 #2192.

## Wave 2 deltas (this PR)

- Deleted legacy `public/sounds/adhan/madinah-general.m4a`
- Hard-ban gate: no qatami/madinah media in public adhan trees
- Store strip removes `dist/fonts/qpc-v2` in addition to adhan media
- `verify:store-assets` wired into `verify:ci` repo-gates
- Inventory: `reports/store-license-inventory.json`
- Store readiness remains **HOLD** (CAF Archive + OWNER license acceptances still open)

## Open P0 (implementable or classified)

| id | class | note |
|---|---|---|
| P0-STORE-HOLD | OWNER + DEVICE + LICENSE | remains HOLD |
| P0-LICENSE-* | BLOCKED_LICENSE / OWNER_ACTION | QPC, Hisn, offline packs, CAF |
| P0-LIB-SOURCE | implementable Wave 3 | 172 `source_missing` |
| P0-DEEPLINK-SERIES | implementable Wave 8 | `/learn/series/:slug` → `/lessons` |
| P0-CONTENT-PUB | implementable Wave 4 | publication guards |
| P0-SECTS-EMPTY | BLOCKED_SOURCE / empty-state Wave 4 | 0 published |
| P0-MUSHAF-NOOP | implementable Wave 9 | 34 UI scripts no-op |
| P0-DEVICE-PRAYER | DEVICE_REQUIRED | |
| P0-OWNER-SIGNING | OWNER_ACTION | |
| P0-PROD-PARITY-DOCS | **closing in Wave 1** | SHA sync |

## Owner actions

See `docs/release/OWNER_ACTIONS_CURRENT.md` (Bundle ID, signing, ASC, SQL, MFA, license acceptances, Store GO).

## Device-required

Prayer notification matrix · physical adhan sound · mushaf SE/Pro Max/iPad/Split View · TestFlight soak.

## License blockers

QPC · Hisn · everyayah/mp3quran offline · unresolved CAF · madinah `rights_uncertain` · qatami rejected.

## Source blockers

Library `source_missing` **172**/190 · islamic sects **0** published / **35** hidden · human review queues (quiz/rulings) — no auto-publish.

## Explicit non-claims

`SUNNAH_FULL_REMEDIATION_COMPLETE` · `SUNNAH_STABILIZATION_COMPLETE` · `STORE GO` — **not** declared.
