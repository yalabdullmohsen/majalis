# تقرير نطاق التغييرات

**التاريخ:** 2026-09-04T20:22:06.987Z
**عدد الملفات:** 7
**النطاقات:** other، ui/layout، docs
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

- `artifacts/majalis/lib/scholarly-verification/seed-scanner.mjs` → other
- `artifacts/majalis/scripts/generate-seo.mjs` → other
- `artifacts/majalis/scripts/verify-body-meta-gate.mjs` → other
- `artifacts/majalis/src/app/router/routes.ts` → ui_layout
- `artifacts/majalis/src/lib/__tests__/phase5-audio-offline-seo.test.ts` → ui_layout
- `reports/changed-scope-report.md` → docs
- `reports/changed-scope-verify.json` → other


## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

