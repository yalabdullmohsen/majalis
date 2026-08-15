# التقرير النهائي — تدقيق بيانات الموقع الكامل (Majlisilm)

التاريخ: 2026-08-15  
الفرع: `cursor/full-site-data-audit-20260815`  
القاعدة: لا تعديل إلا بدليل من الكود/`dist`؛ إشارة Google alone لا تكفي.

الخرائط والتدقيق الآلي:
- `reports/full-site-data-map.json`
- `reports/full-site-data-audit.md`
- سكربت: `pnpm run audit:full-site-data`

## هل الموقع صالح للنشر؟

**نعم — مع قيود صريحة:** الصفحات الناقصة المثبتة إما اكتملت أو أصبحت `noindex` وخارج sitemap. لا تُعرض كمواد معتمدة.

## الأقسام المفحوصة والأعداد

| القسم | سجلات / ملاحظة |
|---|---|
| home | hub ثابت |
| lessons | ~97 درس (seed) |
| quran / mushaf / ulum-quran | hubs + أصول مصحف |
| quran/surah-stories | 114 |
| adhkar | 329 |
| dua (`/duas`) | hub |
| hadith / sahih / daif / mawdu | hubs + `public/data/hadith` |
| library | **173** (11 بمصدر · **162** بلا مصدر → noindex) |
| scholars | **135** |
| prophets | **25** |
| fiqh | hub |
| rulings | **147** إجمالي · **0** عامة · **147** pending_review |
| fatwa | مسار مستقل ملغى → تحويلات |
| fiqh-council | 4 عناصر عامة موثّقة · 33 مسألة عامة |
| qa | SEED=0 · `/qa` → `/quiz` |
| topics | hub + مواضيع |
| sins-and-rights | hub |
| islamic-glossary | hub |
| prayer (`/prayer-times`) | أداة |
| search | noindex أصلاً |
| knowledge-graph | **قيد الإعداد** · noindex |

`content-counts.json`: books 173 · scholars 135 · rulings 147 · courses 63 · qa 0 · quizQuestions 0.

## السجلات الناقصة / pending

1. **147 حكم** `pending_review` — خارج sitemap والنشر العام (بوابة `isPubliclyPublishedRuling` → 404).
2. **162 كتاباً** بلا `external_url` — noindex + خارج sitemap + «قيد الإضافة».
3. **~70 عالماً** بـ `era=العلماء الكبار` بلا `roleType` صريح — مراجعة بشرية (low؛ لا auto-fix جماعي).
4. مسائل فقهية `general_reasoning` غير العامة — توثيق مصدر قبل النشر.

## صفحات أصبحت noindex / خرجت من sitemap (هذا الموج)

| الصفحة | السبب المثبت |
|---|---|
| `/rulings` | صفر أحكام عامة مع ادّعاء «موسوعة» في SEO |
| `/knowledge-graph` | واجهة تعتمد بيانات حية وقد تعرض «لا توجد بيانات» مع فهرسة |
| (سابقاً) كتب بلا مصدر | 162 صفحة |

## الروابط المكسورة

- لا أحكام pending في sitemap.
- روابط sitemap للمكتبة/العلماء تطابق الكتالوج بعد الإصلاحات السابقة.
- `/qa` تحويل صحيح إلى `/quiz`.
- `/fatwa` ملغى كقسم مستقل (تحويلات) — ليس سجلاً يتيماً مفهرساً.

## الأرقام غير المطابقة

- واجهة التنقل تعتمد `content-counts.json` (حقيقية).
- ادعاء «950 سؤالاً» أُزيل سابقاً من updates.
- أرقام 117/96/108 التسويقية **ليست** في UI الحالي — إن ظهرت في Google فقط: *ظهر في الفهرسة ولم يثبت في الكود الحالي*.

## القرآن والحديث والأنبياء

- **لا تعديل لنص الآيات.**
- ذو الكفل: النبذة كانت حذرة؛ **العنوان** كان يجزم بـ«عليه السلام» → صُحّح إلى «ذكر قرآني (دون جزم…)».
- الحديث الصحيح: يعتمد ملفات البخاري/مسلم المحلية؛ الصفحات hubs وليست قائمة فارغة بلا مصدر في prerender.

## محتوى يحتاج مراجعة شرعية بشرية

1. اعتماد ونشر الأحكام الـ147 بعد مراجعة.
2. ضبط مصادر القراءة لـ162 كتاباً.
3. تصنيف `roleType` لعلماء «العلماء الكبار» المتبقين.
4. توثيق مسائل المجمع غير `official_verified`.

## الإصلاحات في هذا الموج

- `/rulings` و`/knowledge-graph`: noindex + خارج sitemap + نص «قيد الإعداد» (SEO + SPA).
- عنوان ذو الكفل بدون جزم نبوي في العنوان.
- `scripts/audit-full-site-data.ts` + `audit:full-site-data`.
- توسيع `audit:strict-evidence` لفحص hub الأحكام وخريطة المعرفة.

## نتائج البوابات

- `audit:full-site-data`: critical=0
- `audit:data-completeness`: critical=0
- `audit:strict-evidence`: نجاح
- `typecheck` / `lint` / `build`: تُشغَّل عند الإغلاق
