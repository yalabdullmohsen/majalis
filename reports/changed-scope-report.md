# تقرير نطاق التغييرات

**التاريخ:** 2026-09-04T19:35:54.067Z
**عدد الملفات:** 26
**النطاقات:** ui/layout، docs، other
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
| full | ✓ |
| mushaf | — |
| build | ✓ |
| visual | ✓ |
| lighthouse | ✓ |
| color_contrast | ✓ |
| data_audit | — |

## الملفات المتغيرة (أول 40)

- `artifacts/majalis/src/components/HeaderTicker.tsx` → ui_layout
- `artifacts/majalis/src/lib/__tests__/phase5-audio-offline-seo.test.ts` → ui_layout
- `artifacts/majalis/src/styles/components/header-ticker-polish.css` → ui_layout
- `artifacts/majalis/src/styles/final-release.css` → ui_layout
- `artifacts/majalis/src/styles/theme-aliases.css` → ui_layout
- `reports/changed-scope-report.md` → docs
- `reports/changed-scope-verify.json` → other
- `artifacts/majalis/index.html` → other
- `artifacts/majalis/lib/assistant-founder.mjs` → other
- `artifacts/majalis/lib/scholarly-verification/seed-scanner.mjs` → other
- `artifacts/majalis/public/404.html` → other
- `artifacts/majalis/scripts/generate-section-og-images.mjs` → other
- `artifacts/majalis/site.config.json` → other
- `artifacts/majalis/src/components/fiqh/FiqhCategoryCard.tsx` → ui_layout
- `artifacts/majalis/src/components/fiqh/FiqhIssueCard.tsx` → ui_layout
- `artifacts/majalis/src/components/lessons/UnifiedLessonCard.tsx` → ui_layout
- `artifacts/majalis/src/config/sections.registry.ts` → ui_layout
- `artifacts/majalis/src/lib/__tests__/fiqh-hub-layout-gate.test.ts` → ui_layout
- `artifacts/majalis/src/lib/fiqh/fiqhNormalize.ts` → ui_layout
- `artifacts/majalis/src/lib/lessons-service.ts` → ui_layout
- `artifacts/majalis/src/lib/lessons/lessonDeduper.ts` → ui_layout
- `artifacts/majalis/src/lib/supabase.ts` → ui_layout
- `artifacts/majalis/src/lib/updates-seed.ts` → ui_layout
- `artifacts/majalis/src/locales/ar.ts` → ui_layout
- `artifacts/majalis/src/pages/worship/ui/PrayerTimesView.tsx` → ui_layout
- `artifacts/majalis/src/styles/pages/fiqh-hub.css` → ui_layout


## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

