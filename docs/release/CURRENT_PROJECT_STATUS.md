# CURRENT PROJECT STATUS — سُنّة

**Status surface of record** (single source for agents).  
**Updated:** 2026-09-21 · Full Remediation **Wave 3**  
**Detail pins:** `docs/release/CURRENT_RELEASE_TRUTH.md`  
**Audit baseline:** `docs/audit/SUNNAH_FULL_PROJECT_AUDIT.md` (`PARTIAL`)

---

## Repository tip

| Field | Value |
|---|---|
| `origin/main` (at Wave 3 start) | `a678d5f31bb7914fd665d4ae1cc9a71865aa8437` |
| Resolve root | `git rev-parse --show-toplevel` (do **not** hard-code machine paths) |
| Remote | `https://github.com/yalabdullmohsen/majalis.git` |

## Production tip

Re-check `https://www.ssunnah.com/version.json` after each merge. Store remains **HOLD**.

## Store readiness

**HOLD** — see `docs/store-release/STORE_100_PERCENT_READINESS.md`.  
Web tip is **not** an automatic Store RC pin.

## Program progress

| Wave | Focus | State |
|---|---|---|
| 1 | Truth / docs / AGENTS path / status surface | **MERGED** (#2192) |
| 2 | Store & licenses | **MERGED** (#2193) |
| 3 | Library sources (hide `source_missing`) | **IN_PROGRESS** |
| 4 | Publication honesty | QUEUED |
| 5–7 | Admin v3 shell → centers → legacy migration | QUEUED |
| 8 | Deep links + lessons guide | QUEUED |
| 9 | Mushaf gates + device prep | QUEUED |
| 10 | Prayer / adhan / audio | QUEUED |
| 11 | Performance / bundles | QUEUED |
| 12 | Responsive / a11y / visual | QUEUED |
| 13 | Legacy cleanup + #1791 | QUEUED |
| 14 | Store/production closure docs | QUEUED |

## Wave 3 deltas (this PR)

- Public library APIs show **18** verified books only (`source_missing` 172 hidden from public)
- `booksCatalogTotal` = 190 retained for admin honesty in `content-counts.json`
- Reports: `LIBRARY_REMEDIATION_REPORT.md` · `library-remediation-report.json`
- No invented URLs

## Open P0 (remaining after Wave 3 public hide)

| id | class | note |
|---|---|---|
| P0-STORE-HOLD | OWNER + DEVICE + LICENSE | remains HOLD |
| P0-LICENSE-* | BLOCKED_LICENSE / OWNER_ACTION | QPC, Hisn, offline packs, CAF |
| P0-LIB-SOURCE | **public hide DONE** · backlog of 172 still BLOCKED_SOURCE for enrichment | humans may add real URLs later |
| P0-DEEPLINK-SERIES | implementable Wave 8 | `/learn/series/:slug` → `/lessons` |
| P0-CONTENT-PUB | implementable Wave 4 | publication guards |
| P0-SECTS-EMPTY | BLOCKED_SOURCE / empty-state Wave 4 | 0 published |
| P0-MUSHAF-NOOP | implementable Wave 9 | 34 UI scripts no-op |
| P0-DEVICE-PRAYER | DEVICE_REQUIRED | |
| P0-OWNER-SIGNING | OWNER_ACTION | |

## Owner actions

See `docs/release/OWNER_ACTIONS_CURRENT.md`.

## Device-required

Prayer notification matrix · physical adhan sound · mushaf SE/Pro Max/iPad/Split View · TestFlight soak.

## License blockers

QPC · Hisn · everyayah/mp3quran offline · unresolved CAF · madinah · qatami.

## Source blockers

Library `source_missing` **172**/190 (hidden from public; still in admin catalog) · islamic sects **0** published / **35** hidden.

## Explicit non-claims

`SUNNAH_FULL_REMEDIATION_COMPLETE` · `SUNNAH_STABILIZATION_COMPLETE` · `STORE GO` — **not** declared.
