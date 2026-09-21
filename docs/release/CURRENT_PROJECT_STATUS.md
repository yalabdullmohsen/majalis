# CURRENT PROJECT STATUS — سُنّة

**Status surface of record** (single source for agents).  
**Updated:** 2026-09-21 · Full Remediation **Wave 4**  
**Detail pins:** `docs/release/CURRENT_RELEASE_TRUTH.md`  
**Audit baseline:** `docs/audit/SUNNAH_FULL_PROJECT_AUDIT.md` (`PARTIAL`)  
**Publication contract:** `docs/content-quality/PUBLICATION_CONTRACT.md`

---

## Repository tip

| Field | Value |
|---|---|
| `origin/main` (Wave 4 base) | `bd4838b07bf70861ed8313e07163a15d35d81bcc` |
| Resolve root | `git rev-parse --show-toplevel` (do **not** hard-code machine paths) |
| Remote | `https://github.com/yalabdullmohsen/majalis.git` |

## Production tip

| Field | Value |
|---|---|
| Host | `https://www.ssunnah.com` |
| `version.json` (at Wave 4 doc sync) | `bd4838b0` · `builtAt` `2026-09-21T15:34:09.728Z` · `ref` `main` |
| Match | Production matches Wave 3 tip / Wave 4 base |

Store remains **HOLD**.

## Store readiness

**HOLD** — see `docs/store-release/STORE_100_PERCENT_READINESS.md`.  
Web tip is **not** an automatic Store RC pin.

## Program progress

| Wave | Focus | State |
|---|---|---|
| 1 | Truth / docs / AGENTS path / status surface | **MERGED** (#2192) |
| 2 | Store & licenses | **MERGED** (#2193) |
| 3 | Library sources (hide `source_missing`) | **MERGED** (#2194) |
| 4 | Publication honesty | **IN_PROGRESS** |
| 5–7 | Admin v3 shell → centers → legacy migration | QUEUED |
| 8 | Deep links + lessons guide | QUEUED |
| 9 | Mushaf gates + device prep | QUEUED |
| 10 | Prayer / adhan / audio | QUEUED |
| 11 | Performance / bundles | QUEUED |
| 12 | Responsive / a11y / visual | QUEUED |
| 13 | Legacy cleanup + #1791 | QUEUED |
| 14 | Store/production closure docs | QUEUED |

## Wave 4 deltas (this PR)

- Islamic sects hub: honest empty when published = 0 (no filters / share / quiz / enums / «0 سجل منشور»)
- Detail: no publication-status enums to users; unpublished = soft empty + `noindex`
- Quiz game: no `PUBLISHED` enum in public copy
- Contract: `docs/content-quality/PUBLICATION_CONTRACT.md`
- Gate: `publication-honesty-gate.test.ts`
- **No** auto-publish of 35 sect records · **No** mass quiz publish

## Open P0 (after Wave 4 public honesty)

| id | class | note |
|---|---|---|
| P0-STORE-HOLD | OWNER + DEVICE + LICENSE | remains HOLD |
| P0-LICENSE-* | BLOCKED_LICENSE / OWNER_ACTION | QPC, Hisn, offline packs, CAF |
| P0-LIB-SOURCE | public hide DONE · 172 still BLOCKED_SOURCE for enrichment | |
| P0-CONTENT-PUB | **Wave 4 public surfaces DONE** · enrichment backlog remains OWNER | |
| P0-SECTS-EMPTY | empty-state DONE · 0 published remains BLOCKED_SOURCE until human review | |
| P0-DEEPLINK-SERIES | Wave 8 | `/learn/series/:slug` |
| P0-MUSHAF-NOOP | Wave 9 | 34 UI scripts no-op |
| P0-DEVICE-PRAYER | DEVICE_REQUIRED | |
| P0-OWNER-SIGNING | OWNER_ACTION | |

## Owner actions

See `docs/release/OWNER_ACTIONS_CURRENT.md`.

## Device-required

Prayer notification matrix · physical adhan sound · mushaf SE/Pro Max/iPad/Split View · TestFlight soak.

## License blockers

QPC · Hisn · everyayah/mp3quran offline · unresolved CAF · madinah · qatami.

## Source blockers

Library `source_missing` **172**/190 (hidden from public) · islamic sects **0** published / **35** inventory · quiz bank local **0** published under `canPublishQuestion`.

## Explicit non-claims

`SUNNAH_FULL_REMEDIATION_COMPLETE` · `SUNNAH_STABILIZATION_COMPLETE` · `STORE GO` — **not** declared.
