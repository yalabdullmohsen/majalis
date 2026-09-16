# CONTENT_INVENTORY — سُنّة

تاريخ الجرد: 2026-09-16  
النطاق: `artifacts/majalis` فقط  
المصدر: AppRoutes · routes.ts · sections.registry · sitemap · seo-routes · seeds · public/data

## مبدأ

لا يُختَرَع محتوى شرعي. الجودة والتوثيق مقدَّمان على ملء الفراغ.

## خريطة الأقسام (ملخص)

| القسم | Route رئيسي | مصدر البيانات | الحالة | ملاحظات |
|---|---|---|---|---|
| الرئيسية | `/` | catalog + seeds | مكتمل | |
| مركز القرآن | `/quran-hub` | static hub | مكتمل | |
| المصحف | `/mushaf` | QPC + pages | مكتمل مقفول | لا تعديل نص/ترتيب |
| التلاوة/القراء | عبر المصحف + dock | audio registries | مكتمل | |
| التفسير | `/tafsir` + sheet | editions JSON | مكتمل موثّق | |
| فهرس السور | `/surahs` ونحوه | quran data | مكتمل | |
| الدروس | `/lessons` | seed + Supabase | مكتمل جزئيًا | فارغ بدون Supabase |
| العلماء | `/teachers` | seed | مكتمل جزئيًا | |
| الأقسام | `/sections` | registry | مكتمل | |
| التوحيد | `/tawhid` | knowledge pack | مكتمل | |
| الحديث | `/hadith/*` | public/data/hadith | مكتمل موثّق | |
| الأربعون | `/arbaeen-nawawi` | seed | مكتمل | |
| الفرق | `/islamic-sects` | static | مكتمل | |
| الفوائد | `/fawaid` | seed | مكتمل جزئيًا | |
| الإعجاز | `/miracles` | seed | hides needs_review | |
| التاريخ | `/tarikh-islami` | knowledge | needs_review كثير | لا يُنشر غير موثّق |
| السيرة | `/seerah` | knowledge | مكتمل جزئيًا | |
| قصص الأنبياء | `/prophets` | knowledge | مكتمل موثّق | |
| الأذكار | `/adhkar` | seed | مكتمل | |
| الصلاة | `/prayer-times` | AlAdhan + calc | مكتمل | |
| القبلة | `/qibla` | calc | مكتمل | |
| التسبيح | `/tasbih` | local | مكتمل | |
| البحث | `/search` | search index | مكتمل | بلا قرارات فقهية |
| دليل طالب العلم | `/adab-talab-ilm` ونحوه | static | مكتمل جزئيًا | |
| المحتوى اليومي | home strip | seeds | مكتمل | |
| الحساب | `/settings` `/my-learning` | Supabase/local | مكتمل | |
| الإدارة | `/admin/*` | Supabase | مكتمل | |
| Empty/Error | مكوّنات مشتركة | UI | مكتمل | |
| SEO/Sitemap | generate-seo | scripts | نُظّف من المجمع | |
| ~~المجمع الفقهي~~ | `/fiqh-council*` | — | **محذوف منتجيًا** | Redirect → `/fiqh` |

## تصنيف المحتوى

- **Verified**: يظهر للمستخدم مع مصدر.
- **Needs verification / Unsupported**: لا يُنشر؛ يُسجَّل في `CONTENT_GAPS_REPORT.md`.

## اكتشاف routes

- Runtime: `src/AppRoutes.tsx` (~364 path)
- Registry: `src/app/router/routes.ts` (~388)
- أقسام حيّة: `src/config/sections.registry.ts` (~78)
- SEO: `src/lib/seo-routes.json` (~212) · `public/sitemap.xml` (~764)

## بوابات المحتوى ذات الصلة

- `test:content-gates` · `test:religious-content` · `test:public-weak-content`
- `test:fiqh-council-completeness` · `test:content-audit-gates`
