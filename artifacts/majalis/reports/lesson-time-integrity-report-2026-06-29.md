# Lesson Time & Prayer Data Integrity — Final Report

**Date:** 2026-06-29  
**Branch:** `cursor/lesson-time-integrity-92e6`

---

## 1. Root Cause

**Primary:** JavaScript `\b` word boundaries do **not** treat Arabic letters as word characters. The parser in `lesson-time.ts` used `\م\b` and `\ص\b` to detect PM/AM shorthand, which **never matched** strings like `6:00 م` and `7:20 م` from the Kuwait CSV import.

**Effect:** Evening lessons were parsed as morning (e.g. `6:00 م` → 06:00 instead of 18:00), breaking sort order, “next occurrence,” time-slot filters, and relative labels.

**Secondary causes:**
| Issue | Location |
|-------|----------|
| Duplicate weaker parser (`parseTimeToMinutesSafe`) | `kuwait-lessons.ts` |
| Times stored as free text, never normalized | CSV import / DB |
| `start_time` / `end_time` columns unused | Schema vs app code |
| CSV mapper dropped `start_date`, `is_recurring` | `mappers.mjs` |
| No prayer rank field | Lessons table |

---

## 2. Audit Results (Local Seed Data)

| Metric | Count |
|--------|-------|
| Total lessons audited | 16 |
| With issues (shorthand PM/AM) | 6 |
| AM/PM shorthand needing normalization | 6 |
| Unparseable times | 0 |
| End before start | 0 |
| Needs manual review | 0 |
| Prayer rank coverage | **100%** |

**Affected shorthand rows (from `02-kuwait-lessons.csv`):**
- `6:00 م`, `7:20 م`, `8:50 م` (course sessions)
- Plus rows needing display normalization to `٦:٠٠ مساءً` format

**Production DB audit:** Run after migration:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "/api/admin/lesson-time-audit?action=audit"
# Bulk repair:
curl -X POST -H "Content-Type: application/json" \
  -d '{"action":"repair"}' /api/admin/lesson-time-audit
```

---

## 3. Repairs Applied

| Category | Approach |
|----------|----------|
| Parser fix | `isPmMarker()` / `isAmMarker()` — Arabic-safe detection |
| Display | `formatLessonTimeDisplay()` → `٧:٣٠ مساءً` (no `7:30 PM`) |
| Import | Auto-normalize on CSV import via `applyLessonTimeRepair()` |
| DB bulk | Admin one-click repair + logged `time_repair_log` |
| Prayer rank | Auto-classify + optional `prayer_rank_override` |

---

## 4. Architecture — Unified Time Engine

```
lib/lesson-time-core.mjs     ← server (import, audit, repair)
src/lib/lesson-time.ts       ← client (display, sort, filters)
```

**Single timezone:** `Asia/Kuwait` everywhere.

**API surface:**
- `parseTimeToMinutes()` — fixed Arabic PM/AM
- `formatLessonTimeDisplay()` — Arabic numerals + مساءً/صباحاً
- `classifyPrayerRank()` / `resolvePrayerRank()` — مرتبة الصلاة
- `normalizeLessonTimeFields()` / `auditLessonRow()` / `applyLessonTimeRepair()`

---

## 5. Database Changes

**File:** `supabase/kuwait_lessons_time_v2.sql`

| Column | Purpose |
|--------|---------|
| `prayer_rank` | Auto-classified prayer window |
| `prayer_rank_override` | Admin manual override (wins) |
| `start_time` | Normalized 24h HH:MM |
| `end_time` | Range end when specified |
| `time_period` | صباحاً / مساءً |
| `time_repair_log` | JSON audit trail |

---

## 6. Files Modified / Created

### New
- `lib/lesson-time-core.mjs`
- `supabase/kuwait_lessons_time_v2.sql`
- `lib/api-handlers/admin/lesson-time-audit.js`
- `src/views/admin/LessonTimeValidationPanel.tsx`
- `scripts/audit-repair-lesson-times.mjs`
- `scripts/test-lesson-time-integrity.mjs`
- `reports/lesson-time-integrity-report-2026-06-29.md`

### Modified
- `src/lib/lesson-time.ts` — unified engine (root cause fix)
- `src/lib/kuwait-lessons.ts` — single parser, prayer rank
- `src/lib/unified-lesson-card.ts` — timeDisplay + prayerRank
- `src/components/lessons/UnifiedLessonCard.tsx`
- `src/views/LessonDetailPage.tsx`
- `lib/content-import/mappers.mjs` — import normalization
- `src/views/admin/LessonsSection.tsx` — validation dashboard
- `lib/api-dispatch.mjs`

---

## 7. Test Results

```
node scripts/test-lesson-time-integrity.mjs → 15/15 PASS
pnpm run typecheck → PASS
node scripts/audit-repair-lesson-times.mjs → 16 audited, 6 flagged
```

---

## 8. Before / After

| Aspect | Before | After |
|--------|--------|-------|
| `6:00 م` parsed as | 06:00 (wrong) | 18:00 (correct) |
| Display | Raw `6:00 م` | `٦:٠٠ مساءً` |
| Prayer rank | Not shown | Auto + override |
| Import | Raw text stored | Normalized + ranked |
| Admin | No audit tool | Dashboard + bulk repair |
| Filters | Broken for `م` times | Consistent parser |

---

## 9. Verification Checklist

- [x] Root cause identified and fixed at parser level
- [x] All lesson display paths use unified engine
- [x] CSV import normalizes times on ingest
- [x] Prayer rank on cards + detail page
- [x] Admin validation dashboard
- [x] Regression tests (15 cases)
- [ ] Production DB bulk repair (requires deploy + migration)

---

## 10. Production Activation

```bash
# Apply migration
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.majlisilm.com/api/cron/apply-migrations?scope=kuwait-lessons"

# Audit + repair
curl "/api/admin/lesson-time-audit?action=audit"
curl -X POST -d '{"action":"repair"}' /api/admin/lesson-time-audit
```

After repair, re-run audit — expect **0** shorthand AM/PM issues and **100%** prayer rank coverage.
