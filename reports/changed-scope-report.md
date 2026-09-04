# تقرير نطاق التغييرات

**التاريخ:** 2026-09-04T15:47:15.331Z
**عدد الملفات:** 11
**النطاقات:** other، ui/layout، content/data، docs
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
| mushaf | — |
| build | ✓ |
| visual | ✓ |
| lighthouse | ✓ |
| color_contrast | ✓ |
| data_audit | ✓ |

## الملفات المتغيرة (أول 40)

- `artifacts/majalis/public/native-load-error.html` → other
- `artifacts/majalis/src/App.tsx` → ui_layout
- `artifacts/majalis/src/components/LazyRouteFallback.tsx` → ui_layout
- `artifacts/majalis/src/components/topic/TopicPage.tsx` → ui_layout
- `artifacts/majalis/src/lib/__tests__/canonical-apex-gate.test.ts` → ui_layout
- `artifacts/majalis/src/lib/__tests__/prophets-final-routes.test.ts` → content_data
- `artifacts/majalis/src/main.tsx` → ui_layout
- `artifacts/majalis/src/styles/pages/prophet-stories.css` → ui_layout
- `artifacts/majalis/src/views/ProphetStoriesPage.tsx` → content_data
- `reports/changed-scope-report.md` → docs
- `reports/changed-scope-verify.json` → other


## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

