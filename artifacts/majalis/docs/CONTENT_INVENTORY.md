# CONTENT_INVENTORY — سُنّة (جولة 2)

تاريخ الجرد: 2026-09-16  
الفرع: `cursor/content-quality-completeness-r2`  
النطاق: `artifacts/majalis` فقط  
الأساس: بعد دمج #2064 و#2065

## مبدأ

لا يُختَرَع محتوى شرعي. الجودة والتوثيق مقدَّمان على ملء الفراغ.

## خريطة الأقسام (بعد الجولة 2)

| القسم | Route | مصدر | قبل | بعد | ملاحظات |
|---|---|---|---|---|---|
| الرئيسية | `/` | catalog | مكتمل | مكتمل | |
| مركز القرآن | `/quran-hub` | hub | مكتمل | مكتمل | |
| المصحف | `/mushaf` | QPC | مقفول | مقفول | لا تعديل نص |
| التفسير | `/tafsir` | editions | مكتمل | مكتمل | |
| الدروس | `/lessons` | seed+Supabase | جزئي | جزئي+منظّف | إزالة وسم المجمع من ندوة النوازل |
| العلماء | `/teachers` | seed | جزئي | جزئي | |
| التوحيد | `/tawhid` | knowledge | مكتمل | مكتمل | |
| الحديث | `/hadith/*` | public/data/hadith | مكتمل | مكتمل | فهرس البحث الموحّد = مداخل أقسام فقط (متعمد) |
| الأربعون | `/arbaeen-nawawi` | seed | مكتمل | مكتمل | |
| الفرق | `/islamic-sects` | static | مكتمل | مكتمل | |
| الفوائد | `/fawaid` | seed | مكتمل | مكتمل | |
| الإعجاز | `/miracles` | seed | مكتمل | مكتمل | |
| التاريخ | `/tarikh-islami` | knowledge | تقرير قديم needs_review | **verified 3578** | تصحيح manifest |
| السيرة/الأنبياء | `/seerah` `/prophets` | knowledge | مكتمل | مكتمل | |
| الأذكار/صلاة/قبلة/تسبيح | متعددة | seeds/calc | مكتمل | مكتمل | |
| البحث | `/search` | index | مكتمل | مكتمل | بلا قرارات فقهية |
| بطاقات الحفظ | `/memorize`→flashcards | UI | اسم قديم | **سُنّة** | |
| الخصوصية | `/privacy` | static+SEO | «خوادم مجالس» | **سُنّة** | |
| ~~المجمع الفقهي~~ | `/fiqh-council*` | — | Redirect | **حذف UI/بذور** | Redirect يبقى |

## ما أُزيل في الجولة 2

- صفحات `FiqhCouncil*.tsx` وواجهات الإدارة المرتبطة
- `src/components/fiqh-council/**`
- بذور/خدمات المجمع غير الموصولة بالمنتج الحي
- نقل `NAWAZIL_TOPICS` إلى `src/lib/fiqh/nawazil-topics.ts` لاستخدام بوابة الفقه فقط

## بوابات

- `test:fiqh-council-completeness` · `test:content-gates` · `test:religious-content`
