# تقرير نطاق التغييرات

**التاريخ:** 2026-09-04T01:08:30.030Z
**عدد الملفات:** 15
**النطاقات:** ci/config، other
**docs-only:** لا

## البوابات المقترحة

| البوابة | مطلوب |
|---------|-------|
| ui | — |
| api | — |
| seo | — |
| pwa | — |
| content | — |
| ios | — |
| full | ✓ |
| mushaf | — |
| build | ✓ |
| visual | — |
| lighthouse | — |
| color_contrast | — |
| data_audit | — |

## الملفات المتغيرة (أول 40)

- `.github/workflows/release-majlisilm.yml` → ci_config
- `artifacts/majalis/tests/snapshots/ui-regression/fiqh-dark.png` → other
- `artifacts/majalis/tests/snapshots/ui-regression/fiqh-light.png` → other
- `artifacts/majalis/tests/snapshots/ui-regression/hadith-dark.png` → other
- `artifacts/majalis/tests/snapshots/ui-regression/hadith-light.png` → other
- `artifacts/majalis/tests/snapshots/ui-regression/home-dark.png` → other
- `artifacts/majalis/tests/snapshots/ui-regression/home-light.png` → other
- `artifacts/majalis/tests/snapshots/ui-regression/lessons-dark.png` → other
- `artifacts/majalis/tests/snapshots/ui-regression/lessons-light.png` → other
- `artifacts/majalis/tests/snapshots/ui-regression/prayer-dark.png` → other
- `artifacts/majalis/tests/snapshots/ui-regression/prayer-light.png` → other
- `artifacts/majalis/tests/snapshots/ui-regression/quran-dark.png` → other
- `artifacts/majalis/tests/snapshots/ui-regression/quran-light.png` → other
- `artifacts/majalis/tests/snapshots/ui-regression/search-dark.png` → other
- `artifacts/majalis/tests/snapshots/ui-regression/search-light.png` → other


## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

