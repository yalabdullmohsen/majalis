# تقرير نطاق التغييرات

**التاريخ:** 2026-09-01T17:23:02.548Z
**عدد الملفات:** 7
**النطاقات:** ci/config، ios/capacitor
**docs-only:** لا

## البوابات المقترحة

| البوابة | مطلوب |
|---------|-------|
| ui | — |
| api | — |
| seo | — |
| pwa | — |
| content | — |
| ios | ✓ |
| full | ✓ |
| mushaf | — |
| build | ✓ |
| visual | — |
| lighthouse | — |
| color_contrast | — |
| data_audit | — |

## الملفات المتغيرة (أول 40)

- `.github/workflows/auto-deploy.yml` → ci_config
- `.github/workflows/harvest-sources.yml` → ci_config
- `.github/workflows/ios-capacitor-gates.yml` → ios_capacitor
- `.github/workflows/pr-quality-report.yml` → ci_config
- `package.json` → ci_config
- `scripts/ci/__tests__/changed-scope.test.mjs` → ci_config
- `scripts/ci/changed-scope.mjs` → ci_config


## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

