# SEO — تحديث ١٣ أغسطس ٢٠٢٦

## مُنجَز مقيس
| بند | حالة |
|-----|------|
| `/library` `/updates` `/knowledge-graph` `/more` | صفحات حقيقية + prerender حيث ينطبق |
| `/quran/mushaf` → `/mushaf` | تحويل دائم App + Vercel 308 |
| `/prayer` → `/prayer-times` | تحويل دائم |
| `robots.txt` | يمنع `/admin` و`/search/` و`/api/` |
| `sitemap.xml` | بلا `/search`؛ يشمل `/hadith/sahih|daif|books-and-rulings|mawdu` |
| البحث | محرك موحّد `runAppSearch` |
| metadata مساري | `usePageSeo` / `seo-routes.json` |
| JSON-LD الرئيسية | `defaultSiteJsonLd()` (Organization + WebSite/SearchAction) على النطاق المجرّد |
| روابط JSON-LD/مشاركة | `SITE_URL` من `site.config.json` (بلا www) في الصفحات الحرجة |

## متبقٍ / قرار بشري
- قياس lastmod ديناميكي لكل سجل محتوى من بيانات حية.
- إثراء JSON-LD لصفحات الكتب/العلماء عند نقص الحقول.
- أرقام الرئيسية: تُحسب عند البناء عبر `generate:counts` — لا تُكتب يدوياً.
