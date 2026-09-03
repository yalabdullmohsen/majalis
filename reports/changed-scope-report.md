# تقرير نطاق التغييرات

**التاريخ:** 2026-09-03T17:02:32.926Z
**عدد الملفات:** 388
**النطاقات:** other، content/data، quran/mushaf، ui/layout، docs
**docs-only:** لا

## البوابات المقترحة

| البوابة | مطلوب |
|---------|-------|
| ui | ✓ |
| api | — |
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

- `"artifacts/majalis/content/archive/rulings-encyclopedia/data/chunks/\330\247\331\204\331\206\331\210\330\247\330\262\331\204-\330\247\331\204\331\205\330\271\330\247\330\265\330\261\330\251.json"` → other
- `artifacts/majalis/content/archive/rulings-encyclopedia/seeds/rulings-encyclopedia-seed.generated.ts` → content_data
- `artifacts/majalis/data/data-quality-audit.json` → content_data
- `artifacts/majalis/data/needs-post-review.jsonl` → content_data
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
- `artifacts/majalis/public/data/knowledge/nations/nation-ashab-ukhdud.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-bani-israil.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-firaun.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-madyan.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-qawm-ibrahim.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-qawm-lut.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-qawm-nuh.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-qawm-yunus.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-qurun-mujmala.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-rum-furs.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-saba.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-thamud.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-tubba.json` → content_data
- `artifacts/majalis/public/data/knowledge/nations/nation-yajuj-majuj.json` → content_data
- `artifacts/majalis/public/data/knowledge/prophets/adam.json` → content_data
- `artifacts/majalis/public/data/knowledge/prophets/al-yasa.json` → content_data
- `artifacts/majalis/public/data/knowledge/prophets/ayyub.json` → content_data
- `artifacts/majalis/public/data/knowledge/prophets/dawud.json` → content_data
- `artifacts/majalis/public/data/knowledge/prophets/dhul-kifl.json` → content_data
- `artifacts/majalis/public/data/knowledge/prophets/harun.json` → content_data
- `artifacts/majalis/public/data/knowledge/prophets/hud.json` → content_data
- `artifacts/majalis/public/data/knowledge/prophets/ibrahim.json` → content_data
- `artifacts/majalis/public/data/knowledge/prophets/idris.json` → content_data
- `artifacts/majalis/public/data/knowledge/prophets/ilyas.json` → content_data

… +348 ملفًا

## سياسات

- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).

## أوامر محلية

- PR صغير / docs: `pnpm run verify:changed`
- PR سريع: `pnpm run verify:ci-fast`
- main/release: `pnpm run verify:ci-full`

