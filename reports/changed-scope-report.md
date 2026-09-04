# تقرير نطاق التغييرات

**التاريخ:** 2026-09-04T00:09:38.787Z
**عدد الملفات:** 3
**النطاقات:** ci/config، docs، other
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
- `reports/changed-scope-report.md` → docs
- `reports/changed-scope-verify.json` → other


## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

