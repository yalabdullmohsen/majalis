# Emergency Root Fix — Detail/Search Routes Report

## 1. Root Cause

Three compounding failures caused ErrorBoundary on lesson detail and search routes:

| Issue | Impact |
|-------|--------|
| **URL building without encoding** | Links like `/lessons/kuwait-lessons:7b923f5b...` used raw string concatenation; colon IDs were inconsistent between generated links and router param decoding |
| **Lookup by exact id only** | `fetchLessonById` compared `l.id === id` only — failed when param was `%3A`-encoded, hash-only, or UUID while catalog used `external_key` |
| **Render crashes on partial data** | `sheikhName.replace(...)` in `fromKuwaitLesson`, `enrichScheduleFields`, and SEO helpers threw when `sheikhName` was missing on imported/partial records |

Example failing URL: `/lessons/kuwait-lessons:7b923f5b0be018325687e73a1d9...`

## 2. Solution

### Unified content layer
- `src/lib/content-id.ts` — normalize/decode route params, expand identifier candidates
- `src/lib/content-url.ts` — `buildContentUrl()` / `buildLessonUrl()` with `encodeURIComponent`
- `src/lib/content-resolver.ts` — resolve lessons by UUID, external_key, encoded id, legacy kw- prefix, seed fallback

### Lookup chain
1. Decode/normalize route param
2. Search merged Supabase + catalog list via expanded identifiers
3. Seed/catalog fallback via `findSeedLessonById`
4. Supabase direct query by id **and** external_key for all candidates

### Defensive rendering
- `stripSheikhPrefix()` safe helper; fallback «غير محدد»
- SEO structured data hardened against missing fields

## 3. Files Modified (core)

- `src/lib/content-id.ts`, `content-url.ts`, `content-resolver.ts` (new)
- `src/lib/lessons-service.ts`, `lessons-seed.ts`, `supabase.ts`
- `src/views/LessonDetailPage.tsx`, `SearchPage.tsx`, `CalendarPage.tsx`
- `src/lib/unified-lesson-card.ts`, `search-suggestions.ts`, `seo-structured-data.ts`
- `src/components/ErrorBoundary.tsx`
- `lib/supabase/server-data.ts`
- `scripts/smoke-detail-routes.mjs`, `scripts/test-content-resolver.mjs`

## 4. Tests

| Script | Result |
|--------|--------|
| `pnpm --filter @workspace/majalis run test:content-resolver` | 6/6 PASS |
| `pnpm --filter @workspace/majalis run smoke:detail-routes` | **30/30 PASS** |
| `pnpm --filter @workspace/majalis run build` | PASS |

Smoke coverage includes:
- Colon IDs (raw + encoded)
- UUID unknown id (404, no crash)
- 15 live lesson links from `/lessons`
- Search «سالم» / «درس»
- Calendar, library, fatwa, rulings, qa, courses, circles, sheikhs

## 5. Production Verification (post-deploy)

After merge/deploy, verify on https://www.majlisilm.com:
- Search «سالم» → open results → no ErrorBoundary
- Open 10+ lessons from home and search
- Open `/lessons/kuwait-lessons:<hash>` links from Kuwait imported lessons

## 6. Commands

```bash
pnpm --filter @workspace/majalis run test:content-resolver
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run preview
pnpm --filter @workspace/majalis run smoke:detail-routes --base=http://127.0.0.1:24216
```
