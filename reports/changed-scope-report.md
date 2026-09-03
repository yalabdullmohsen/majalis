# تقرير نطاق التغييرات

**التاريخ:** 2026-09-03T22:41:00.894Z
**عدد الملفات:** 824
**النطاقات:** ci/config، other، content/data، docs، backend/api، quran/mushaf، ui/layout
**docs-only:** لا

## البوابات المقترحة

| البوابة | مطلوب |
|---------|-------|
| ui | ✓ |
| api | ✓ |
| seo | ✓ |
| pwa | ✓ |
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

- `.github/workflows/release-majlisilm.yml` → ci_config
- `"artifacts/majalis/content/archive/rulings-encyclopedia/data/chunks/\330\247\331\204\330\243\330\263\330\261\330\251.json"` → other
- `"artifacts/majalis/content/archive/rulings-encyclopedia/data/chunks/\330\247\331\204\330\255\330\254-\331\210\330\247\331\204\330\271\331\205\330\261\330\251.json"` → other
- `"artifacts/majalis/content/archive/rulings-encyclopedia/data/chunks/\330\247\331\204\330\262\331\203\330\247\330\251.json"` → other
- `"artifacts/majalis/content/archive/rulings-encyclopedia/data/chunks/\330\247\331\204\330\265\331\204\330\247\330\251.json"` → other
- `"artifacts/majalis/content/archive/rulings-encyclopedia/data/chunks/\330\247\331\204\330\265\331\212\330\247\331\205.json"` → other
- `"artifacts/majalis/content/archive/rulings-encyclopedia/data/chunks/\330\247\331\204\330\267\331\207\330\247\330\261\330\251.json"` → other
- `"artifacts/majalis/content/archive/rulings-encyclopedia/data/chunks/\330\247\331\204\330\271\331\202\331\212\330\257\330\251.json"` → other
- `"artifacts/majalis/content/archive/rulings-encyclopedia/data/chunks/\330\247\331\204\331\205\330\271\330\247\331\205\331\204\330\247\330\252.json"` → other
- `"artifacts/majalis/content/archive/rulings-encyclopedia/data/chunks/\330\247\331\204\331\206\331\210\330\247\330\262\331\204-\330\247\331\204\331\205\330\271\330\247\330\265\330\261\330\251.json"` → other
- `artifacts/majalis/content/archive/rulings-encyclopedia/data/manifest.json` → content_data
- `artifacts/majalis/content/archive/rulings-encyclopedia/seeds/rulings-encyclopedia-seed.generated.ts` → content_data
- `artifacts/majalis/content/fiqh/FIQH_CONTENT_QUEUE.md` → docs
- `artifacts/majalis/content/fiqh/books.json` → other
- `artifacts/majalis/content/hadith-corpus/HADITH_IMPORT_QUEUE.md` → docs
- `artifacts/majalis/content/quran-stats/QUEUE.md` → docs
- `artifacts/majalis/data/CONTENT_REVIEW_QUEUE.md` → docs
- `artifacts/majalis/data/data-quality-audit.json` → content_data
- `artifacts/majalis/data/needs-post-review.jsonl` → content_data
- `artifacts/majalis/docs/AHRUF_REVIEW_QUEUE.md` → docs
- `artifacts/majalis/docs/CONTENT_REVIEW_QUEUE.md` → docs
- `artifacts/majalis/docs/FIQH_REVIEW_QUEUE.md` → docs
- `artifacts/majalis/index.html` → other
- `artifacts/majalis/lib/api-dispatch.mjs` → backend_api
- `artifacts/majalis/lib/api-handlers/client-error-log.js` → backend_api
- `artifacts/majalis/lib/content-flags.mjs` → other
- `artifacts/majalis/lib/static-search-server.mjs` → other
- `artifacts/majalis/lib/updates-ios-fallback.mjs` → other
- `artifacts/majalis/package.json` → other
- `artifacts/majalis/public/data/knowledge/discover-islam/path-and-faq.json` → content_data
- `artifacts/majalis/public/data/knowledge/history/timeline.json` → content_data
- `artifacts/majalis/public/data/knowledge/intro-islam/topics.json` → content_data
- `artifacts/majalis/public/data/knowledge/manifest.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-aad.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-ashab-fil.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-ashab-janna.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-ashab-kahf.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-ashab-qarya.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-ashab-rass.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-ashab-sabt.json` → content_data

… +784 ملفًا

## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

