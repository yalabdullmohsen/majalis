# تقرير نطاق التغييرات

**التاريخ:** 2026-09-16T06:47:13.802Z
**عدد الملفات:** 129
**النطاقات:** docs، other، content/data، ui/layout، quran/mushaf
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

- `artifacts/majalis/docs/CONTENT_AFFINITY_REPORT.md` → docs
- `artifacts/majalis/docs/ds-coverage-report.json` → other
- `artifacts/majalis/public/data/lessons/chunk-000.json` → content_data
- `artifacts/majalis/public/data/search/index.json` → content_data
- `artifacts/majalis/public/data/sources/instagram-quota.json` → content_data
- `artifacts/majalis/scripts/audit-feature-readiness.ts` → other
- `artifacts/majalis/scripts/lessons-seed.snapshot.json` → other
- `artifacts/majalis/scripts/validate-kuwait-lessons.mjs` → other
- `artifacts/majalis/seo-prerender/lessons/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-abdulaziz-alfawzan-fiqh-weekly-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-ahmadi-umdat-ahkam-sabah-abu-khashaba-2026-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-ahmadi-zad-muslim-ulum-quran-2026-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-ahmadi-zad-muslim-usool-athlatha-2026-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-ajraa-murtaqa-course-3-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-arabic-nahw-beginner-course-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-asima-umdat-ahkam-sarra-2026-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-fiqh-ibadaat-course-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-fiqh-maliki-risala-program-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-fiqh-purification-program-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-jahraa-muhimmat-aqeeda-women-2026-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-jury-aldahi-sharia-program-4-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-khalid-almushlih-usool-program-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-mahboula-dosari-umdat-tawhid-2026-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-murtaqa-madarij-altalab-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-mutlaq-aljasr-talaeea-elm-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-osama-shatti-prayer-book-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-othman-talkhis-mukhtasar-almuqni-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/kw-rashed-fundamental-course-0/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/sci-fiqh-ibadat-weekly/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/sci-fiqh-inheritance-course/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/sci-online-fiqh-course-shafii/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/sci-rawdat-alafham-muwaiziri/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/sci-talae-alilm-murtaqaa/index.html` → other
- `artifacts/majalis/seo-prerender/lessons/sci-umdat-ahkam-daham/index.html` → other
- `artifacts/majalis/src/components/ComingSoonDialog.tsx` → ui_layout
- `artifacts/majalis/src/components/GlobalSearchModal.tsx` → ui_layout
- `artifacts/majalis/src/components/home/home-start-here-data.ts` → ui_layout
- `artifacts/majalis/src/components/lessons/UnifiedLessonCard.tsx` → ui_layout
- `artifacts/majalis/src/components/quiz-game/DailyChallengeQuiz.tsx` → ui_layout
- `artifacts/majalis/src/components/ui/TopicQuiz.tsx` → ui_layout

… +89 ملفًا

## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

