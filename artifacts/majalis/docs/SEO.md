# SEO — تحديث ١٣ أغسطس ٢٠٢٦

## مُنجَز مقيس
| بند | حالة |
|-----|------|
| `/library` `/updates` `/knowledge-graph` `/more` | صفحات حقيقية + prerender حيث ينطبق |
| `/quran/mushaf` → `/mushaf` | تحويل دائم App + Vercel 308 |
| `/prayer` → `/prayer-times` | تحويل دائم |
| `robots.txt` | يمنع `/admin` و`/search/` و`/api/` |
| `sitemap.xml` | بلا `/search` (بوابة `perf-seo-cache-gate`) |
| البحث | محرك موحّد `runAppSearch` |
| metadata مساري | `usePageSeo` / `seo-routes.json` |

## متبقٍ / قرار بشري
- قياس lastmod ديناميكي لكل سجل محتوى من بيانات حية.
- إثراء JSON-LD لصفحات الكتب/العلماء عند نقص الحقول.
- أرقام الرئيسية: تُحسب عند البناء عبر `generate:counts` — لا تُكتب يدوياً.
