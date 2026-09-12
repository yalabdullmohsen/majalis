# تجربة متقدمة — خط أساس P0 (موثوقية)

تاريخ: 2026-09-12  
الفرع: `cursor/advanced-experience-p0`  
العلامة: سُنّة

## نطاق P0 المنفَّذ

1. Unified Sync Engine (local-first، delta، idempotent، سياسات تعارض حسب النوع).
2. عزل الحساب عند الخروج + نطاق guest/user.
3. دمج ضيف→حساب مع علامة pending واتحاد غير هدّام.
4. خريطة Deep Links آمنة (منع staging/open-redirect).
5. خطط استعادة موحّدة (transient/file/sync/index/assistant/secondary_ui).
6. ترحيل مخطط مزامنة v1 idempotent.
7. بوابة `advanced-experience-p0-gate`.

## خارج النطاق (متعمد — P1+)

- ملاحظات/فواصل/مجموعات واجهة كاملة
- Continue Center / مشغّل / Offline Center المتقدم
- لوحة إدارة البلاغات / TestFlight كامل

## قياس الجهاز

جميع مقاييس الأداء على جهاز حقيقي: **NOT MEASURED** في هذه الجولة.

## سلامة شرعية

لا تعديل لنص القرآن/الحديث؛ المزامنة بيانات مستخدم فقط.
