# تقرير نطاق التغييرات

**التاريخ:** 2026-09-16T00:29:42.336Z
**عدد الملفات:** 60
**النطاقات:** content/data، other، ui/layout، quran/mushaf، docs
**docs-only:** لا

## البوابات المقترحة

| البوابة | مطلوب |
|---------|-------|
| ui | ✓ |
| api | — |
| seo | ✓ |
| pwa | — |
| content | ✓ |
| ios | — |
| full | ✓ |
| mushaf | ✓ |
| build | ✓ |
| visual | ✓ |
| lighthouse | ✓ |
| color_contrast | ✓ |
| data_audit | ✓ |

## الملفات المتغيرة (أول 40)

- `artifacts/majalis/public/data/lessons/chunk-000.json` → content_data
- `artifacts/majalis/public/data/search/index.json` → content_data
- `artifacts/majalis/scripts/lessons-seed.snapshot.json` → other
- `artifacts/majalis/seo-prerender/lessons/sci-online-fiqh-course-shafii/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/sci-talae-alilm-murtaqaa/index.html` → other
- `artifacts/majalis/src/components/ComingSoonDialog.tsx` → ui_layout
- `artifacts/majalis/src/components/GlobalSearchModal.tsx` → ui_layout
- `artifacts/majalis/src/components/home/home-start-here-data.ts` → ui_layout
- `artifacts/majalis/src/config/section-lobbies.ts` → ui_layout
- `artifacts/majalis/src/config/sections.registry.ts` → ui_layout
- `artifacts/majalis/src/features/mushaf-madinah/TafsirTabPanel.tsx` → quran_mushaf
- `artifacts/majalis/src/lib/__tests__/fiqh-door-chapter-fill-gate.test.ts` → ui_layout
- `artifacts/majalis/src/lib/fiqh/fiqhNormalize.ts` → ui_layout
- `artifacts/majalis/src/lib/ia-final-structure.ts` → ui_layout
- `artifacts/majalis/src/lib/scientific-announcements-seed.ts` → ui_layout
- `artifacts/majalis/src/lib/ui-copy.ts` → ui_layout
- `artifacts/majalis/src/pages/fiqh/ui/FiqhView.tsx` → ui_layout
- `artifacts/majalis/src/pages/lessons/ui/LessonsView.tsx` → ui_layout
- `artifacts/majalis/src/pages/quran/ui/QuranPersonDetailView.tsx` → quran_mushaf
- `artifacts/majalis/src/pages/worship/ui/AdhkarView.tsx` → content_data
- `artifacts/majalis/src/pages/worship/ui/DailyWirdView.tsx` → ui_layout
- `artifacts/majalis/src/styles/m2030/foundation.css` → ui_layout
- `artifacts/majalis/src/styles/pages/fiqh-hub.css` → ui_layout
- `artifacts/majalis/src/views/KnowledgeSectionPage.tsx` → ui_layout
- `artifacts/majalis/src/views/MiraclesPage.tsx` → ui_layout
- `artifacts/majalis/src/views/VaultPage.tsx` → ui_layout
- `artifacts/majalis/src/views/learning/LearningPathDetailPage.tsx` → ui_layout
- `reports/fiqh-section-audit.json` → other
- `reports/fiqh-section-audit.md` → docs
- `artifacts/majalis/scripts/validate-kuwait-lessons.mjs` → other
- `artifacts/majalis/src/components/lessons/UnifiedLessonCard.tsx` → ui_layout
- `artifacts/majalis/src/components/ui/TopicQuiz.tsx` → ui_layout
- `artifacts/majalis/src/data/institutions-catalog.json` → ui_layout
- `artifacts/majalis/src/data/library-catalog.json` → ui_layout
- `artifacts/majalis/src/data/universities-catalog.json` → ui_layout
- `artifacts/majalis/src/lib/library-catalog.ts` → ui_layout
- `artifacts/majalis/src/lib/recent-pages.ts` → ui_layout
- `artifacts/majalis/src/pages/account/ui/FlashCardsView.tsx` → ui_layout
- `artifacts/majalis/src/pages/account/ui/IslamicGlossaryView.tsx` → ui_layout
- `artifacts/majalis/src/pages/account/ui/LoginView.tsx` → ui_layout

… +20 ملفًا

## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

