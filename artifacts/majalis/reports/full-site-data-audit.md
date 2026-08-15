# تدقيق بيانات الموقع الكامل

التاريخ: 2026-08-15T17:34:28.047Z

## أعداد

```json
{
  "books": 173,
  "booksWithSource": 11,
  "booksNeedsSource": 162,
  "scholars": 135,
  "prophets": 25,
  "rulingsTotal": 147,
  "rulingsPublic": 0,
  "rulingsVisible": 147,
  "rulingsPending": 147,
  "rulingsBlocked": 0,
  "fiqhPublic": 4,
  "fiqhIssuesPublic": 64,
  "qa": 0,
  "quiz": 0,
  "adhkar": 329,
  "courses": 63,
  "surahStories": -1,
  "sitemapUrls": 1014
}
```

## الأقسام

- **home**: مصدر=`seo-routes + HomeView` · سجلات=1
- **lessons**: مصدر=`lessons-seed` · سجلات=0
- **quran**: مصدر=`quran-hub + mushaf assets` · سجلات=—
- **quran/surah-stories**: مصدر=`surah-stories.ts` · سجلات=-1
- **adhkar**: مصدر=`adhkar-seed` · سجلات=329
- **dua**: مصدر=`duas routes (/duas)` · سجلات=—
- **hadith**: مصدر=`public/data/hadith + verified-hadith-local-seed` · سجلات=—
- **hadith/sahih**: مصدر=`public/data/hadith/{bukhari,muslim}.json` · سجلات=—
- **hadith/daif**: مصدر=`verified-hadith fill daif` · سجلات=—
- **hadith/mawdu**: مصدر=`verified-hadith fill mawdu` · سجلات=—
- **library**: مصدر=`library-catalog.ts` · سجلات=173
- **scholars**: مصدر=`scholars-data.ts` · سجلات=135
- **prophets**: مصدر=`prophets-data.ts` · سجلات=25
- **fiqh**: مصدر=`fiqh pages + topics` · سجلات=—
- **rulings**: مصدر=`rulings-encyclopedia-seed + publication gate` · سجلات=147 · عامة=0 · pending=147
- **fatwa**: مصدر=`/fatwa → /fiqh|/rulings (ملغى كقسم مستقل)` · سجلات=0
- **fiqh-council**: مصدر=`fiqh-council-seed` · سجلات=6 · عامة=4
- **qa**: مصدر=`/qa → /quiz · SEED_QA` · سجلات=0
- **topics**: مصدر=`topics data via generate-seo` · سجلات=—
- **sins-and-rights**: مصدر=`sins-rights seed` · سجلات=—
- **islamic-glossary**: مصدر=`glossary seed` · سجلات=—
- **prayer**: مصدر=`/prayer-times (مواقيت)` · سجلات=—
- **search**: مصدر=`SearchView · noindex` · سجلات=—
- **knowledge-graph**: مصدر=`KnowledgeGraphPage + kn APIs` · سجلات=—

## نتائج

- critical: 0
- high: 0
- medium: 0
- إجمالي: 0

## Findings

