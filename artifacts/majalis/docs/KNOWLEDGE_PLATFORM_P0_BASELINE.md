# منصة المعرفة — خط أساس P0

تاريخ التوثيق: 2026-09-12  
الفرع: `cursor/knowledge-platform-p0`  
البيئة المطلوبة للقياس الحقيقي: Release/Profile على جهاز حقيقي.

## حالة القياس

كل المقاييس أدناه **NOT MEASURED** في هذه الجولة (لا جهاز مادي ولا Instruments/Perfetto متصل في بيئة الوكيل).

| مقياس | القيمة | طريقة القياس المطلوبة |
|------|--------|------------------------|
| زمن فتح الصفحة الرئيسية | NOT MEASURED | PerformanceNavigationTiming / Instruments |
| عدد طلبات الصفحة الرئيسية | NOT MEASURED | Network panel / HAR |
| زمن أول محتوى مفيد | NOT MEASURED | LCP / custom mark |
| زمن البحث → أول نتيجة | NOT MEASURED | Signpost حول `runKnowledgeSearch` |
| دقة فتح النتائج | NOT MEASURED | اختبارات E2E يدوية + بوابة resolver |
| عدد السجلات القابلة للبحث | NOT MEASURED | حجم فهرس البحث الموحّد الحالي |
| حجم البيانات المحلية | NOT MEASURED | Application → IndexedDB/Storage |
| زمن استعادة التقدّم | NOT MEASURED | mark حول `buildProgressSnapshot` |
| عدد العلاقات المعرفية | NOT MEASURED | P2 — غير مُنفَّذ |
| نسبة المحتوى ذي المصادر | NOT MEASURED | تدقيق محتوى منفصل |
| الذاكرة / أداء القوائم | NOT MEASURED | Memory profiler |
| العمل دون اتصال | NOT MEASURED | اختبار ميداني Airplane Mode |

**قاعدة:** أي رقم يُذكر لاحقًا دون مصدر قياس يُرفض.

## ما نُفّذ في P0 (قابل للتحقق في CI)

1. نموذج كيان محتوى موحّد (`CONTENT_ENTITY_KINDS` + حالات تحقق).
2. Content Resolver يفتح المسارات عبر `content-href` دون اختلاق نصوص شرعية.
3. Activity/Progress محلي مع تعطيل تخصيص ومسح.
4. بحث موحّد يغلف `runAppSearch` ويثري النتائج بالـResolver.
5. مركزا `/progress` و`/offline`.
6. مسح مفاتيح KP عند حذف/مسح بيانات الحساب.
7. بوابة `knowledge-platform-p0-gate`.

## خارج النطاق (متعمد)

- Recommendation Engine المتقدم (P1)
- Experience Home الذكية (P1)
- Knowledge Graph والعلاقات المنشورة (P2)
- Source-Grounded Smart Assistant (P2)

## تأكيدات سلامة

- لا تعديل لنص القرآن أو التشكيل أو الرسم.
- لا إنشاء آية/حديث/فتوى آليًا.
- العلاقات `proposed`/`pending_review` لا تُعرض كحقائق للمستخدم.
- التخصيص محلي وقابل للتعطيل والمسح.
