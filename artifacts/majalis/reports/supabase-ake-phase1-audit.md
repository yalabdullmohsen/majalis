# Phase 1 — Supabase + AKE Integration Audit

**Date:** 2026-06-28  
**Branch:** `cursor/supabase-ake-integration-92e6`

## Executive Summary

Phase 1 audit of Quran Circles, Mutoon, Courses, Search, Admin, AKE, Publisher, and Monitoring modules. **No code changes were made during this audit.**

| Module | Supabase | localStorage | Static/Seed | CRUD | AKE | Status |
|--------|----------|--------------|-------------|------|-----|--------|
| Quran Circles | ❌ | ❌ | ❌ | ❌ | ❌ | **Greenfield** |
| Mutoon (standalone) | ❌ | ❌ | Partial (array on courses) | ❌ | ❌ | **Greenfield** |
| Courses (`annual_courses`) | ✅ Partial | ❌ | ✅ Seed fallback | ✅ Basic | ⚠️ Broken publish | **70%** |
| Search | ✅ RPC + seed | ⚠️ History only | ✅ Seed fallback | N/A | N/A | **75%** |
| Contact Messages | ❌ | ❌ | mailto only | ❌ | ❌ | **0%** |
| Admin | ✅ Partial | ❌ | ✅ Seed fallback | ✅ Basic | N/A | **60%** |
| AKE | ✅ Core tables | ❌ | N/A | N/A | ⚠️ Gaps | **55%** |
| Publisher | ✅ | ❌ | N/A | N/A | ⚠️ Missing kinds | **50%** |
| Monitoring | ✅ | ❌ | N/A | N/A | ✅ | **85%** |

---

## 1. Quran Circles

**Finding:** Feature does not exist.

- No routes, pages, tables, seeds, admin sections, or AKE content kind.
- Related but separate: `/quran`, `/quran-live`, `/quran-radio`, mushaf reader.

**Dependencies:** None on localStorage or static data.

**Required:** New tables, pages, admin, AKE kind, search integration, progress tracking.

---

## 2. Mutoon

**Finding:** Not a standalone feature — only embedded as `mutoon TEXT[]` on `annual_courses`.

- One seed course `mutoon-alfiyyah` in `annual-courses-seed.ts`.
- Filter via `course_type = 'متن'` on `/annual-courses`.
- No dedicated pages, admin fields, or progress tracking.

**Dependencies:** `annual_courses.mutoon[]` column (Supabase when migrated).

---

## 3. Courses (`annual_courses`)

**Supabase:** Table in `supabase/platform_expansion_v3.sql` (+ slug/published_at in `cms_platform_v4.sql`).

**Services:**
- Read: `src/lib/platform-content-service.ts` → `getAnnualCourses`, `getAnnualCourseById`
- Admin: `src/lib/platform-supabase.ts` → basic CRUD
- Admin UI: `src/views/admin/AnnualCoursesSection.tsx`

**Gaps:**
- Admin form missing: `mutoon[]`, `sheikh_names[]`, `schedule`, `keywords`, dates, archive
- No audit log on CRUD operations
- No import/export
- `platform_expansion_v3.sql` not in auto-migration list (`migration-paths.mjs`)
- AKE `annual_course` in TABLE_MAP but `buildRecord()` has no case → `unsupported_kind`

---

## 4. Search

**Supabase:** `search_platform` RPC (extended in `platform_expansion_v3.sql`) includes `courses` bucket.

**Client:**
- `searchEverything()` in `src/lib/supabase.ts` calls RPC with seed fallback
- `searchPlatformSeed()` in `src/lib/platform-search.ts`

**localStorage (UX only):**
- `majalis-search-history` — `src/lib/search-history.ts`
- `majalis-search-analytics` — same file

**Gaps:**
- No `quran_circles` or `mutoon` in RPC or UI
- No unified suggestions for new content types

---

## 5. Contact Messages

**Finding:** Static page only (`src/views/ContactPage.tsx`) — mailto link, no form, no DB, no API.

---

## 6. Admin

**Sections relevant to Phase 3:**
- `AnnualCoursesSection` — basic CRUD, seed fallback when DB empty
- `FatwaAdminSection`, `RulingsSection`, `UpdatesSection` — same pattern
- Audit log infrastructure exists: `admin_audit_logs` + `src/lib/cms/audit-log.ts`

**Gaps:**
- No Quran Circles / Mutoon / Contact admin sections
- Missing publish/unpublish/archive/review workflow on courses
- No search/filters/import/export on platform content admin
- Audit log not wired to platform CRUD operations

---

## 7. AKE (Auto Knowledge Engine)

**Content kinds (`content-kind.mjs`):** Aliases only — no `quran_circle`, `mutoon`, `annual_course`.

**Publisher (`publisher.mjs` TABLE_MAP):**
- `annual_course → annual_courses` ✅ mapped
- `sharia_ruling → sharia_rulings` ✅ mapped
- **`buildRecord()` missing cases** for both → publishes as `unsupported_kind`

**Connectors (`connectors/index.mjs` detectKind):**
- Detects: fatwa, fiqh_decision, lesson, fawaid, miracle, book, article
- Missing: quran_circle, mutoon, annual_course, event

**Dual course model:**
- AKE `course` kind → `lessons` table
- CMS `annual_courses` via `course-handler.mjs` (uses `description` vs schema `summary` — bug)

---

## 8. Publisher

**Supported publish targets:** lessons, library, fawaid, miracles, qa, platform_updates, fatwas, fiqh (fallback library).

**Broken:** `annual_course`, `sharia_ruling`, `quran_circle`, `mutoon`.

---

## 9. Monitoring

**Status:** Operational via AKE v17/v18 monitoring tables and `/admin/platform/monitoring`.

**Gap:** No metrics for quran_circles/mutoon (tables don't exist yet).

---

## 10. Migration File

**`supabase/quran_circles_mutoon_v1.sql`:** Does not exist — must be created in Phase 2.

**Prerequisites:** `platform_expansion_v3.sql`, `platform_v2_schema_fixed.sql`, `search_fts.sql` (for `normalize_ar`, `search_platform`).

---

## localStorage Inventory (scoped modules)

| Module | localStorage | Action |
|--------|-------------|--------|
| Quran Circles | None | N/A |
| Mutoon | None | N/A |
| Courses | None | N/A |
| Contact | None | N/A |
| Admin CRUD | None | N/A |
| Search | History + analytics | Migrate to Supabase (Phase 2) |

Other localStorage usage (Quran prefs, mushaf, theme, tasbeeh) is out of scope — client UX state.

---

## Recommended Phase 2+ Order

1. Create `quran_circles_mutoon_v1.sql` (idempotent)
2. Wire TypeScript services + replace search history with Supabase
3. Build public pages + admin CRUD with audit log
4. Fix AKE publisher + connector classification
5. Quality pipeline gate before publish
6. Extend search RPC + UI
7. Progress tracking tables + services
8. Design unification
9. Tests + Lighthouse

---

*End of Phase 1 audit — no modifications made.*
