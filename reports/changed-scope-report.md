# تقرير نطاق التغييرات

**التاريخ:** 2026-09-04T16:32:43.942Z
**عدد الملفات:** 17
**النطاقات:** content/data، backend/api، other، ui/layout، docs
**docs-only:** لا

## البوابات المقترحة

| البوابة | مطلوب |
|---------|-------|
| ui | ✓ |
| api | ✓ |
| seo | ✓ |
| pwa | — |
| content | ✓ |
| ios | — |
| full | ✓ |
| mushaf | — |
| build | ✓ |
| visual | ✓ |
| lighthouse | ✓ |
| color_contrast | ✓ |
| data_audit | ✓ |

## الملفات المتغيرة (أول 40)

- `artifacts/majalis/data/feature-registry.json` → content_data
- `artifacts/majalis/lib/api-handlers/readyz.js` → backend_api
- `artifacts/majalis/lib/api-handlers/search.js` → backend_api
- `artifacts/majalis/lib/auto-knowledge-engine/seo-engine.mjs` → other
- `artifacts/majalis/src/lib/feature-registry.ts` → ui_layout
- `artifacts/majalis/src/lib/fiqh-hub-stats.ts` → ui_layout
- `artifacts/majalis/src/lib/fiqh/fiqhNormalize.ts` → ui_layout
- `artifacts/majalis/src/lib/lessons/lessonDeduper.ts` → ui_layout
- `artifacts/majalis/src/lib/lessons/lessonGrouping.ts` → ui_layout
- `artifacts/majalis/src/main.tsx` → ui_layout
- `artifacts/majalis/src/pages/account/MorePage.tsx` → ui_layout
- `artifacts/majalis/src/pages/account/ui/SearchView.tsx` → ui_layout
- `artifacts/majalis/src/pages/library/ui/LibraryDetailView.tsx` → ui_layout
- `artifacts/majalis/src/pages/library/ui/LibraryView.tsx` → ui_layout
- `artifacts/majalis/src/styles/pages/fiqh-hub.css` → ui_layout
- `reports/changed-scope-report.md` → docs
- `reports/changed-scope-verify.json` → other


## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

