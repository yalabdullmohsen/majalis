# تقرير نطاق التغييرات

**التاريخ:** 2026-09-04T04:09:38.502Z
**عدد الملفات:** 15
**النطاقات:** content/data، other، ui/layout، docs
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

- `artifacts/majalis/public/data/search/index.json` → content_data
- `artifacts/majalis/scripts/generate-unified-search-index.mjs` → other
- `artifacts/majalis/seo-prerender/nations/ashab-ukhdud/index.html` → other
- `artifacts/majalis/seo-prerender/nations/qawm-yunus/index.html` → other
- `artifacts/majalis/src/config/navigation.ts` → ui_layout
- `artifacts/majalis/src/config/sections.registry.ts` → ui_layout
- `artifacts/majalis/src/features/search/__tests__/unified-search.test.ts` → ui_layout
- `artifacts/majalis/src/lib/__tests__/sections-registry.test.ts` → ui_layout
- `artifacts/majalis/src/lib/__tests__/site-sections-final-structure.test.ts` → ui_layout
- `artifacts/majalis/src/lib/nations/data/knowledge-extras.ts` → ui_layout
- `artifacts/majalis/src/lib/nav-visibility.ts` → ui_layout
- `artifacts/majalis/src/lib/site-footer-nav.ts` → ui_layout
- `artifacts/majalis/src/views/MiraclesPage.tsx` → ui_layout
- `reports/changed-scope-report.md` → docs
- `reports/changed-scope-verify.json` → other


## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

