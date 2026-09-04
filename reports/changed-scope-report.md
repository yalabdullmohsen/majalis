# تقرير نطاق التغييرات

**التاريخ:** 2026-09-04T17:09:44.457Z
**عدد الملفات:** 5
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

- `artifacts/majalis/src/data/content-counts.json` → ui_layout
- `artifacts/majalis/src/lib/__tests__/miracles-ui-gate.test.ts` → ui_layout
- `artifacts/majalis/src/lib/miracles-seed.ts` → ui_layout
- `artifacts/majalis/src/styles/pages/miracles.css` → ui_layout
- `artifacts/majalis/src/views/MiraclesPage.tsx` → ui_layout


## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

