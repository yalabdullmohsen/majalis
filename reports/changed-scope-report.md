# تقرير نطاق التغييرات

**التاريخ:** 2026-09-04T17:43:07.373Z
**عدد الملفات:** 9
**النطاقات:** ui/layout
**docs-only:** لا

## البوابات المقترحة

| البوابة | مطلوب |
|---------|-------|
| ui | ✓ |
| api | — |
| seo | ✓ |
| pwa | — |
| content | — |
| ios | — |
| full | — |
| mushaf | — |
| build | ✓ |
| visual | ✓ |
| lighthouse | ✓ |
| color_contrast | ✓ |
| data_audit | — |

## الملفات المتغيرة (أول 40)

- `artifacts/majalis/src/components/lessons/LessonFilters.tsx` → ui_layout
- `artifacts/majalis/src/components/lessons/LessonScheduleGroup.tsx` → ui_layout
- `artifacts/majalis/src/components/lessons/UnifiedLessonCard.tsx` → ui_layout
- `artifacts/majalis/src/lib/__tests__/lessons-filter-chips-layout.test.ts` → ui_layout
- `artifacts/majalis/src/lib/lesson-time.ts` → ui_layout
- `artifacts/majalis/src/lib/unified-lesson-card.ts` → ui_layout
- `artifacts/majalis/src/pages/lessons/ui/LessonsView.tsx` → ui_layout
- `artifacts/majalis/src/styles/pages/lessons-legacy.css` → ui_layout
- `artifacts/majalis/src/styles/pages/lessons.css` → ui_layout


## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

