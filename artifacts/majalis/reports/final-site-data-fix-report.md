# التقرير النهائي — تدقيق بيانات الموقع (Evidence-Gated)

تاريخ: 2026-08-15 (محدّث بعد فحص الويب الأخير)  
الأساس: فرع `cursor/final-evidence-audit-20260815` + تقرير ما قبل الإصلاح `reports/pre-fix-evidence-audit.md`

## 1) ملخص القرار

| السؤال | الجواب |
|---|---|
| هل الفرع الحالي صالح للفهرسة بعد الإصلاحات المثبتة؟ | **نعم** — بعد noindex لكتب بلا مصدر + بوابة production-indexability |
| هل الإنتاج الحي (majlisilm.com) يطابق الفرع؟ | **لا بعد** — الحي ما زال يعرض «رابط القراءة» ويفهرس knowledge-graph وكتباً بلا مصدر حتى ينشر هذا الفرع |
| يحتاج مراجعة شرعية بشرية؟ | كتب `needs_source`؛ مسائل `general_reasoning`؛ أي توسع قصصي خارج الوحي |

---

## 2) فحص الويب الأخير

### أ) ادعاءات ظهرت في الفهرسة/الويب وثبتت داخل المشروع أو المخرجات المبنية

| الادعاء | الدليل | الإجراء |
|---|---|---|
| مصدر عام «رابط القراءة» على كتب في الإنتاج الحي | `curl` لـ `/library/book-qurtubi` أعاد «رابط القراءة»؛ المولّد المحلي كان يعرض «قراءة المصدر» ثم عُدّل | استبدال التسمية الافتراضية بـ«فتح المصدر» عند وجود رابط؛ وعند الغياب: `المصدر: قيد الإضافة` + **noindex** + خارج sitemap |
| كتب بلا `external_url` داخل sitemap مفهرسة | 162 كتاباً بلا رابط في `LIBRARY_CATALOG`؛ كانت في `public/sitemap.xml` قبل التوليد | `robots: noindex` و`sitemap: false` في `generate-seo.mjs` — sitemap انخفض إلى **673** عنواناً |
| `/knowledge-graph` مفهرس في الإنتاج | حي: `index, follow` + loc في sitemap | في الفرع مسبقاً: noindex + خارج sitemap + نص «قيد الإعداد» بلا دعوى «جميع العلاقات موثقة» — تُرك/أُكّد |
| تزكية «فقيه المذهب غير المنازع» / «حافظ العصر وشيخ الإسلام» مطلقة | `scholars-data.ts` (ابن قدامة / ابن حجر) | تحييد بصيغة تراجم: «اشتهر في كتب التراجم…» / «لُقّب في كتب التراجم بـ…» |

### ب) ادعاءات ظهرت في الفهرسة لكن لم تثبت في الكود الحالي للإنتاج من هذا المستودع

| الادعاء | أين بُحث | القرار |
|---|---|---|
| `info@majlisilm.com` / `yalabdullmohsen1@gmail.com` في production من هذا الفرع | `src`، data، footer، metadata، JSON-LD، seo-prerender، sitemap؛ يظهران فقط داخل سكربتات الفحص كمحظورات | **لم يثبت أثره على الإنتاج** في الشجرة الحالية — لم يُعدَّل محتوى. الرسمي: `Majlisilm.app@gmail.com` في `site.config.json` |
| صفحات كتب/فتاوى تعرض «قيد المراجعة الشرعية» مفهرسة في prerender | بحث `seo-prerender/**` — العبارة فقط في `/methodology` (توثيق المنهج) | **لم يثبت** على صفحات الكتب المفهرسة في المخرجات المبنية؛ شارة SPA وقت التشغيل ليست HTML مفهرساً — لا noindex جماعي للموقع |
| تناقض «قيد الإعداد» + «جميع العلاقات موثقة» في الكود الحالي | `KnowledgeGraphPage.tsx` + prerender | **لم يثبت** التناقض في الفرع (النص تجريبي/قيد إعداد فقط) |

### ج) ما تم تعديله

- `scripts/generate-seo.mjs`: كتب بلا مصدر → noindex + خارج sitemap؛ تسمية المصدر.
- `src/lib/library-catalog.ts` + `LibraryDetailView.tsx`: تسميات المصدر.
- `src/lib/scholars-data.ts`: تحييد عبارتين مثبتتين.
- مرايا: `scholars-seo.json` / `library-catalog.json` عبر sync الجزئي.
- `scripts/audit-production-indexability.ts` + أمر `audit:production-indexability`.
- `audit:final-content` يشمل البوابة الجديدة.
- `test/production-indexability.spec.ts` + تعزيز `audit-islamic-content.ts`.

### د) ما تُرك كما هو وسبب القرار

- ألقاب تاريخية سياقية («شيخ الإسلام ابن تيمية»، «حجة الإسلام» بتحفّظ للغزالي، سيرة ابن رشد بلا «فيلسوف الإسلام الأكبر»).
- منهجية المراجعة الشرعية في `/methodology` (مفهرسة عمداً كتوثيق).
- عدم حذف صفحات الكتب الناقصة — تبقى للاطلاع مع noindex.
- عدم لمس `seo-routes.json` عبر sync الكامل (يُدخل مسارات علماء مكررة مع حلقة SCHOLARS في المولّد).

### هـ) صفحات أصبحت noindex / أُزيلت من sitemap

- كل كتاب مكتبة بلا `external_url` (~162) بما فيها أمثلة: `/library/book-seerah-ibn-hisham`، `/library/book-qawaid-arbaa`، `/library/book-umdat`.
- `/knowledge-graph` (مسبقاً ومؤكَّد).
- كتب بمصدر حقيقي (مثل `/library/book-qurtubi`) تبقى **index** مع «فتح المصدر».

### و) يحتاج مراجعة شرعية بشرية

- إضافة مصادر قراءة موثوقة لكتب `needs_source` ثم إعادة فهرستها.
- أي توسيع لعلاقات knowledge-graph قبل رفع noindex.
- مسائل فقهية غير `reviewed`.

---

## 3) الادعاءات العامة السابقة (ملخص)

| الادعاء | الحالة |
|---|---|
| حشو الأنبياء / واجهة داخل article | لم يثبت — تُرك |
| Home fallback | العدد 0 |
| اعتماد أزهري مطلق | لم يثبت بالصيغ المحظورة |

---

## 4) نتائج الأوامر (هذه الجولة)

| الأمر | النتيجة |
|---|---|
| `audit:final-content` | OK (site-data + rendered + seo + islamic + **production-indexability**) |
| `test:production-indexability` | OK |
| `test:site-data-evidence` | OK |
| `typecheck` | OK |
| `lint` | (يُشغَّل مع الإغلاق) |
| `build` | (يُشغَّل مع الإغلاق) |
