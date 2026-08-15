# تقرير نهائي — جودة واكتمال البيانات (Majlisilm)

التاريخ: 2026-08-15  
الفرع: `cursor/data-completeness-audit-20260815`  
القاعدة: لا تعديل إلا بدليل في الكود/البيانات/`dist`؛ إشارة الفهرسة alone لا تكفي.

## أعداد السجلات (مصدر الحقيقة الحالي)

| النوع | العدد | ملاحظات |
|---|---:|---|
| كتب المكتبة | **173** | منها **11** بـ `external_url`، و**162** بلا مصدر قراءة |
| علماء | **135** | كلها `verificationStatus=reviewed` |
| فتاوى/عناصر مجمع منشورة موثّقة | **4** | عبر `isVerifiedPublicItem` |
| مسائل فقهية عامة | **33** | عبر `isPublicIssue` من أصل 64 بذرة |
| أحكام الموسوعة | **147** | **0** عامة (`isPubliclyPublishedRuling`) · **147** `pending_review` |
| QA seed | **0** | المسار `/qa` → تحويل إلى `/quiz` |
| أسئلة الاختبار (DEMO) | **0** | Proxy فارغ؛ العدّاد من `content-counts.json` |

`content-counts.json` (مولَّد): books 173 · scholars 135 · rulings 147 · courses 63 · qa 0 · quizQuestions 0.

## 1) حالات المراجعة والنشر

- الحقل الفعلي في الأحكام: `status` / `verification_status` (لا يوجد `reviewStatus` في المخطط الحالي).
- **147** حكماً `pending_review` — **ليست** في `sitemap`، ولا تُولَّد صفحات SEO عامة (بوابة `loadEncyclopediaRulingsForSeo` + `isPubliclyPublishedRuling`).
- الوصول عبر SPA لغير المنشور → `unpublished` / HTTP 404 (`rulings-resolver.ts`).
- `/rulings/ruling-child-custody`: غير موجود في sitemap؛ غير مؤهل للنشر العام.
- **لا حاجة لتعديل سجلات الأحكام** — الحوكمة موجودة. أي ظهور في Google دون سجل منشور = إشارة فهرسة فقط؛ لم يُثبت تسرّب من الكود/الـdist.

## 2) المجمع الفقهي

العناصر العامة الأربعة (`items-encrypted-digital-currencies`، `items-smart-contracts`، `items-cultured-meat`، `items-gmo-animal-foods`):

- لها ملخص + نص حكم + `source_url` رسمي (IIFA).
- **ليست** صفحات عنوان+سطر واحد — **لا تُجعل noindex**.
- `/fiqh-council/issues`: فهرس فيه **33** مسألة عامة في prerender (ليس فارغاً).

## 3) صفحات فارغة / شبه فارغة

| مسار | الحكم |
|---|---|
| `/qa` | تحويل إلى `/quiz`؛ غير في sitemap |
| `/topics` | مواضيع حقيقية في البيانات |
| `/fiqh-council/issues` | 33 مسألة عامة |
| أحكام `/rulings/*` التفصيلية | غير منشورة للعامة (404 / خارج sitemap) |

## 4) اتساق الأعداد

- الواجهة الرئيسية/التنقل تعتمد `content-counts.json` (أعداد حقيقية) — **لا** أرقام 117/96/108 ثابتة في UI الحالي.
- **إصلاح مثبت:** إعلان `update-quiz-950` كان يدّعي «950 سؤالاً» بينما `quizQuestions=0` — أُزيل الرقم التسويقي من `updates-seed.ts` و`updates-ios-fallback.mjs`.

## 5) العلماء والتصنيفات

- أُضيفت الحقول الاختيارية `roleType` و`cautionLevel` مع دوال اشتقاق للعرض.
- ضبط صريح + تنبيه عرض لـ: القرضاوي، الغزالي، ابن خلدون، ابن رشد، ابن عاشور، الفوزان.
- ابن خلدون/ابن رشد: لم يُحذفا؛ صارا بتصنيف أدق و`not_primary_reference` / سياق.
- ~70 عالماً ما زالوا بـ `era=العلماء الكبار` بلا `roleType` صريح → **مراجعة بشرية** (severity=low في audit؛ لا auto-fix جماعي).

## 6) تكرار النبذة

- في prerender (مثل `/scholars/qaradawi`): فقرة bio واحدة في الجسم؛ meta مقصوص من نفس النص — **ليس تكراراً مزدوجاً في body**. لا تعديل إضافي.

## 7) الأزهر

- حُيّد ذكر أزهري ترويجي في سيرة القرضاوي (صياغة تعليم محايدة) وفي سيرة الفوزان («مشايخ زائرين» بدل «منتدبين من الأزهر» + إزالة «صار مرجعاً» كصيغة مركزية).
- لا حذف جماعي لكل ذكر تاريخي.

## 8) الروابط والسجلات

- لا أحكام pending في sitemap.
- بعد الإصلاح: كتب بلا مصدر **خارج** sitemap و`robots=noindex`.
- روابط sitemap للمكتبة/العلماء تطابق الكتالوج/البيانات (فحص السكربت).

## 9) سكربت الاكتمال

- `scripts/audit-data-completeness.ts`
- `pnpm run audit:data-completeness`
- كذلك: `audit:strict-evidence`، و`audit:data-quality` (السكربت القديم)

## 10) ما أصبح noindex / خارج sitemap

- **162** صفحة كتاب بلا `external_url`: `noindex, follow` + خارج sitemap + تنبيه «قيد الإضافة» في الواجهة وprerender.
- الأحكام `pending_review`: كانت أصلاً خارج الفهرسة العامة (لم تُغيَّر السجلات).

## الصفحات التي تحتاج مراجعة شرعية بشرية

1. **147** حكم موسوعة `pending_review` — لا تُنشر حتى `verification_status=approved` بمصدر ومراجع.
2. علماء بـ `era=العلماء الكبار` دون `roleType` صريح (~70) — تصنيف أدق بشري.
3. كتب بلا مصدر قراءة (162) — إضافة `external_url` موثوق ثم إعادة الفهرسة.
4. بذور مسائل فقهية `general_reasoning` غير العامة (31) — توثيق مصدر رسمي قبل العرض العام.

## نتائج البوابات (محلي)

- `audit:data-completeness`: critical=0
- `audit:strict-evidence`: نجاح
- `audit:data-quality`: يفشل بسبب **4** تكرارات أذكار قديمة في نفس التصنيف (سابقاً؛ خارج نطاق هذا الإصلاح)

## قرارات هندسية

1. لا اختراع `reviewStatus` جديد — استخدام الحقول الموجودة.
2. لا noindex لعناصر المجمع الأربعة الموثّقة.
3. لا حذف علماء مختلف فيهم؛ ضبط العرض والحذر فقط.
4. إيقاف حقن مسارات العلماء في `seo-routes.json` من `sync-seo-data.ts` لمنع تكرار المسار مع حلقة `generate-seo`.
