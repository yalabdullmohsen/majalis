# Library Restructure Hardening Report

Generated: 2026-06-26

## Summary

Regression-hardening suite added for PR #202 library separation (books · articles · research). All automated checks pass with **no content-type mixing detected**.

## Test Results

| Command | Tests | Result |
|---------|-------|--------|
| `pnpm run test:library-restructure` | **65** | ✅ 65/65 PASS |
| `pnpm run verify:library-restructure` | **25** | ✅ 25/25 PASS |
| `pnpm run audit:library-content-types` | **10** | ✅ 10/10 PASS (1 WARN) |
| `pnpm run typecheck` (majalis) | — | ✅ PASS |

## Coverage Matrix

### 1. Unit Tests (`test-library-restructure.mjs`)

- Book → `/library/books` and `/books` only
- Article → `/library/articles` and `/articles` only
- Research → `/research` only (not `library_items`)
- Legacy `/library/:id` redirect via `detailPath()`
- Missing `content_type` blocks publish
- Unknown / research types rejected for `library_items`
- Cross-contamination filter (`assertNoCrossContamination`)

### 2. Search Tests

- `splitLibrarySearchRows()` — books bucket excludes articles & research
- SearchPage grouped headings: الكتب · المقالات · الأبحاث العلمية
- Book/article hrefs use typed paths
- Supabase search delegates to shared split logic

### 3. Smart CMS / Import Tests

- `mapRowToPayload("books")` → `content_type=book`
- `mapRowToPayload("articles")` → `content_type=article`
- Research API → `research_papers` table
- No research type in import registry → `library_items`
- AKE publisher stamps `content_type` on book/article publishes

### 4. Admin Tests

- `/admin/library-books` · `/admin/library-articles` · `/admin/scientific-research` wired
- `LibraryTypeAdminSection` filters by `content_type`
- `validateContentTypeForSection` enforced on save

### 5. Production Migration Guard (`audit-library-content-types.mjs`)

Static checks on `supabase/library_content_types_v1.sql`:

- `content_type` column + enum (`book` | `article` only)
- Publish trigger `library_items_require_content_type`
- CHECK constraint `library_items_content_type_allowed`
- Indexes on `content_type`

Live mode (`--production` + service role): verifies no approved rows without `content_type`.

## Mixing Status

**No mixing detected** in static analysis or unit simulation.

## Migration Readiness

| Item | Status |
|------|--------|
| SQL migration file | ✅ Ready (`supabase/library_content_types_v1.sql`) |
| Migration classifier script | ✅ `migrate-library-content-types.mjs` |
| Registered in migration-paths | ✅ |
| Applied to production DB | ⚠️ **Manual step required** |

## Production Manual Step

Apply in Supabase SQL Editor if not already applied:

```
supabase/library_content_types_v1.sql
```

Then run:

```bash
pnpm --filter @workspace/majalis run audit:library-content-types -- --production
```

## Files Modified / Added

| File | Change |
|------|--------|
| `lib/library/content-types.mjs` | **NEW** — shared classification + guards |
| `src/lib/library/content-types.ts` | Re-exports from `.mjs` |
| `scripts/test-library-restructure.mjs` | **NEW** — 65 regression tests |
| `scripts/audit-library-content-types.mjs` | **NEW** — migration guard |
| `scripts/verify-library-restructure.mjs` | Expanded orchestration |
| `supabase/library_content_types_v1.sql` | Enum limited to book/article + CHECK |
| `lib/knowledge-engine/publisher.mjs` | Stamps `content_type` on publish |
| `src/lib/supabase.ts` | Uses shared search split |
| `src/lib/library-service.ts` | Type-safe contamination filter |
| `package.json` | Added `test:` / `audit:` scripts |

## Commands

```bash
pnpm --filter @workspace/majalis run test:library-restructure
pnpm --filter @workspace/majalis run verify:library-restructure
pnpm --filter @workspace/majalis run audit:library-content-types
```
