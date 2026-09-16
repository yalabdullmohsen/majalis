# CONTENT_INVENTORY — سُنّة (جولة 3)

تاريخ الجرد: 2026-09-16  
الفرع: `cursor/content-quality-completeness-r3`  
النطاق: `artifacts/majalis` فقط  
الأساس: `origin/main` @ d1bfec484 (بعد #2067)

## مبدأ

لا يُختَرَع محتوى شرعي. الجودة والتوثيق مقدَّمان على ملء الفراغ.  
`IMPLEMENTATION_FROZEN` بعد اكتمال P0/P1 هذه الجولة.

## خريطة الأقسام (جرد r3)

| القسم | Route | مصدر البيانات | عناصر فعلية | الحالة | جودة النص | العرض | المصدر الشرعي | الإجراء | أولوية |
|---|---|---|---|---|---|---|---|---|---|
| الرئيسية | `/` | catalog/home | ديناميكي | مكتمل | جيد | جيد | — | صيانة | — |
| مركز القرآن | `/quran-hub` | hub | ثابت | مكتمل | جيد | جيد | QPC | لا | — |
| المصحف | `/mushaf` | QPC | صفحات معتمدة | مقفول | — | جيد | QPC | **لا تعديل نص** | — |
| التلاوة/القراء | `/tilawa` إلخ | seeds | موجود | مكتمل | جيد | جيد | معتمد | لا | — |
| التفسير | `/tafsir` | editions | موجود | مكتمل | جيد | جيد | معتمد | لا | — |
| فهرس السور | `/surahs` | QPC meta | 114 | مكتمل | جيد | جيد | QPC | لا | — |
| الدروس | `/lessons` | seed+Supabase | جزئي محلي | جزئي | حسّن r2 | جيد | مختلط | Empty عند غياب API | P1 |
| تفاصيل درس | `/lessons/:id` | seed+API | مرتبط | جزئي | جيد | جيد | مرتبط | لا اختراع | P1 |
| السلاسل/دورات | `/annual-courses` | API | عند توفر | جزئي | جيد | جيد | مرتبط | Empty | P1 |
| العلماء | `/teachers` | seed | موجود | جزئي | جيد | جيد | تراجم بذور | لا توسيع بلا مصدر | P1 |
| الأقسام/موضوعات | `/topics` | static | موجود | مكتمل | جيد | جيد | — | لا | — |
| العقيدة/توحيد | `/tawhid` | knowledge | verified | مكتمل | جيد | جيد | Verified | لا | — |
| الحديث | `/hadith/*` | public/data/hadith | كتب معتمدة | مكتمل | جيد | جيد | مصادر مثبتة | لا megaseed | — |
| الأربعون | `/arbaeen-nawawi` | seed | 40 | مكتمل | جيد | جيد | نووي | لا | — |
| الفرق | `/islamic-sects` | static | موجود | مكتمل | جيد | جيد | ثابت موثّق | لا | — |
| الفوائد | `/fawaid` | seed | موجود | مكتمل | جيد | جيد | بذور | لا | — |
| الإعجاز | `/miracles` | seed | موجود | مكتمل | جيد | جيد | بذور | لا | — |
| التاريخ | `/tarikh-islami` | knowledge JSON | 3578 verified | مكتمل | جيد | جيد | Verified | لا | — |
| السيرة | `/seerah` | knowledge | موجود | مكتمل | جيد | جيد | Verified | لا | — |
| قصص الأنبياء | `/prophets` | knowledge | موجود | مكتمل | جيد | جيد | Verified | لا | — |
| الأذكار | `/adhkar` | seed | موجود | مكتمل | جيد | جيد | معتمد | لا | — |
| الصلاة/مواقيت | `/prayer` | calc | حي | مكتمل | جيد | جيد | حساب | لا | — |
| القبلة | `/qibla` | calc | حي | مكتمل | جيد | جيد | حساب | لا | — |
| التسبيح | `/tasbih` | UI | حي | مكتمل | جيد | جيد | — | لا | — |
| البحث | `/search` | index+API | فهرس | مكتمل | حسّن r3 | جيد | بلا قرارات | stub `searchFiqh` | P0✓ |
| دليل طالب العلم | `/learning/*` | paths | جزئي | جزئي | جيد | جيد | مرتبط | Empty | P1 |
| المحتوى اليومي | home widgets | sync | عند توفر | جزئي | جيد | جيد | — | لا | P1 |
| حساب/مفضلة/تقدم | `/account/*` | local+API | محلي | مكتمل | جيد | جيد | — | لا | — |
| الإعدادات | `/settings` | local | — | مكتمل | جيد | جيد | — | لا | — |
| الإشعارات | `/notifications` | API/local | — | مكتمل | جيد | جيد | — | لا | — |
| الإدارة | `/admin/*` | CMS | — | مكتمل | جيد | جيد | مصدر مطلوب | منع council | P0✓ |
| خطأ/فارغ | مضمّن | UI | — | مكتمل | حسّن | جيد | — | لا | P2 |
| SEO/Sitemap | generate-seo + builder | حي+ثابت | — | منظّف r3 | — | — | — | بلا council | P0✓ |
| المؤسسات | `/institutions` | catalog | مصفّى | منظّف | جيد | جيد | catalog | حذف mecca | P0✓ |
| المشاهد | `/islamic-landmarks` | landmarks-data | 34 | حسّن r3 | حسّن | جيد | ثابت | إزالة جملة وهمية | P0✓ |
| الفقه العام | `/fiqh` | hub | مواضيع | مكتمل | جيد | جيد | عام | ليس مجمعًا | — |
| ~~المجمع الفقهي~~ | `/fiqh-council*` | — | 0 | Redirect→`/fiqh` | — | — | محذوف | يبقى redirect | P0✓ |
| ~~قرارات فقهية~~ | API/search | — | 0 حي | محظور | — | — | Unsupported | stub | P0✓ |

## ما أُصلح في r3 (كود حي)

- `searchFiqh` → `[]` (لا `fiqh_council_items` / `fiqh_decision`)
- إيقاف `runFiqhCouncilSync` واستبدالها بـ no-op معلَّم
- حذف `fiqh-council-mecca` من catalog + فلتر مؤسسات عامة
- تفريغ `fiqh_decisions` في snapshot
- إزالة استعلامات `fiqh_council_*` من sitemap/RSS
- stub محرك البحث الفقهي عن جداول council
- وسم SEO «الفقه» بدل «المجمع الفقهي»
- تنظيف وصف معلَمَين من جملة «ويُعرض تعريفًا خاصًا…»
- microcopy بحث/مسابقات/مساعد بحث
- migration مالك: `supabase/fiqh_council_product_purge_v1.sql`

## بوابات

- `test:fiqh-council-completeness` (موسّع r3)
- `test:content-gates` · `test:religious-content`
