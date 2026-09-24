# تقرير نطاق التغييرات

**التاريخ:** 2026-09-24T22:16:33.299Z
**عدد الملفات:** 12
**النطاقات:** other، quran/mushaf، ui/layout، docs
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
| mushaf | ✓ |
| build | ✓ |
| visual | ✓ |
| lighthouse | ✓ |
| color_contrast | ✓ |
| data_audit | — |

## الملفات المتغيرة (أول 40)

- `artifacts/majalis/package.json` → other
- `artifacts/majalis/scripts/interaction-touch-static-audit.mjs` → other
- `artifacts/majalis/src/features/mushaf-reader/NewMushafReader.tsx` → quran_mushaf
- `artifacts/majalis/src/features/mushaf-reader/mushaf-reader.css` → quran_mushaf
- `artifacts/majalis/src/features/mushaf-reader/page-goto-dial.css` → quran_mushaf
- `artifacts/majalis/src/index.css` → ui_layout
- `artifacts/majalis/src/lib/__tests__/touch-interaction-system-gate.test.ts` → ui_layout
- `artifacts/majalis/src/styles/breakpoints.css` → ui_layout
- `artifacts/majalis/src/styles/components/native-feel.css` → ui_layout
- `artifacts/majalis/src/styles/critical-first-paint.css` → ui_layout
- `docs/qa/INTERACTION_AUDIT.md` → docs
- `docs/qa/interaction-touch-under44-static.json` → docs


## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

