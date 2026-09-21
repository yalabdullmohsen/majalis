# LIBRARY REMEDIATION REPORT — Wave 3

**Generated:** 2026-09-21  
**Program:** SUNNAH FULL PROJECT REMEDIATION · Wave 3  
**Policy:** لا اختلاق مصادر · لا نشر جماعي لـ `source_missing`

## Counts (recomputed)

| Metric | Value |
|---|---:|
| total (admin catalog) | 190 |
| source_verified | 18 |
| source_missing | 172 |
| source_broken | 0 |
| publicVisible | 18 |

Evidence: `node artifacts/majalis/scripts/audit-library-sources.mjs` · `library-public-source-gate.test.ts`

## Changes

- `hasVerifiedLibrarySource` + `getPublicLibraryCatalog` in `library-service.ts`
- Public search / filter / featured / related / merge default to verified-only
- `includeUnverified: true` reserved for admin listing paths
- `bookRepository` public entity API filtered
- Scholar work links only resolve verified books
- `content-counts.json`: `books` = 18 public; `booksCatalogTotal` = 190 internal
- Gate: `test:library-integrity` includes `library-public-source-gate`

## Explicit non-claims

- 172 missing books were **not** given invented URLs
- Admin catalog rows were **not** deleted
- Store readiness unchanged (HOLD)

## Acceptance

- [x] No `source_missing` in default public library APIs
- [x] Search fallback catalog verified-only
- [x] Public count reflects verified only
- [x] Gate fails if missing IDs leak into public search
