-- توسيع فحص "[object Object]" (بطلب المنسِّق) عبر كل الجداول: مسح
-- منهجي شامل لكل عمود نصي (1381 عموداً عبر 273 جدولاً، عبر استعلامات
-- UNION ALL مجمَّعة) — النتيجة: نظافة كاملة في كل مكان تقريباً (fawaid،
-- sharia_rulings، islamic_stories، books، sheikhs، lessons،
-- arbaeen_love_of_allah، week_day_facts، tg_extracted_lessons،
-- annual_courses، fiqh_council_issues، universities، qa_questions،
-- learning_items، quiz-seed.ts، library-catalog.ts، scholars-data.ts —
-- صفر تكرار للنمط)، **باستثناء جدولين مرتبطين مباشرة بنفس دفعة
-- الاستيراد الفاشلة "hadith-akp-*" المُصلَحة سابقاً في
-- verified_hadith_items**:
--
-- 1) `content_production_staging` (1 صف، external_key=
--    hadith-akp-8833bbbb...): **اكتشاف مهم للسبب الجذري** — هذا الصف
--    محفوظ بالفعل بـstatus='review' (لم يُنشَر قط) ومعه
--    validation_errors صريحة من نظام التحقق الآلي نفسه: "missing_text"
--    (الحقل text مطلوب)، "low_quality_score" (0)، "insufficient_arabic".
--    أي أن **بوابة التحقق في مسار content_production_staging عملت
--    بشكل صحيح وأوقفت النشر** لهذا الصف تحديداً. الخلل الحقيقي إذن:
--    يبدو أن هناك **مسار استيراد مباشر ثانٍ منفصل** استهدف
--    verified_hadith_items مباشرة بلا بوابة التحقق نفسها، فمرَّرت
--    السبعة صفوف الفاسدة كـ'verified' مباشرة — فجوة معمارية تستحق
--    تسجيلاً للمالك (لا إصلاح كود هنا، فقط توثيق ونظافة بيانات).
--    الإصلاح: status='rejected' (قيمة صالحة ضمن CHECK الموجود) بدل
--    تركه معلَّقاً 'review' إلى الأبد رغم وضوح فساده.
--
-- 2) `search_index` (5 صفوف، content_id يطابق 5 من السبعة hadith-akp-*
--    المرفوضة بالفعل): جدول فهرسة/بحث مُشتَق (تستهلكه
--    lib/api-handlers/search.js وlib/rag/retrieval.mjs — **ميزة بحث
--    حية**)، وليس مصدر حقيقة. بما أن مصدره الأصلي في
--    verified_hadith_items أصبح rejected+محذوفاً ناعماً، هذه صفوف
--    فهرسة يتيمة لمحتوى لم يعد موجوداً — حُذفت فعلياً (لا soft-delete،
--    جدول فهرسة مشتق بلا قيمة أرشيفية).
DO $$
BEGIN
  UPDATE content_production_staging
  SET status = 'rejected', updated_at = now()
  WHERE external_key LIKE 'hadith-akp-%' AND body = '[object Object]';

  DELETE FROM search_index
  WHERE content_id LIKE 'hadith-akp-%' AND body_text = '[object Object]';
END $$;
