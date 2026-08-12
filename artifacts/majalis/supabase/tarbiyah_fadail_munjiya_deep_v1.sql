-- ═══════════════════════════════════════════════════════════════════════════
-- tarbiyah_fadail_munjiya_deep_v1.sql
--
-- تعميق مقرر "الفضائل المنجية" (tarbiyah path، وحدة `0185b970...`) من
-- عنصرين (الصبر ومنزلته المنجية، التوبة والخوف من الله — عامّان، وزن
-- 50/50) إلى 4 عناصر بإضافة فضيلتين منجيتين جديدتين — تكملة قائمة
-- المقررات السطحية المكتشَفة حديثاً (بطلب المنسّق).
--
-- تجنُّب التكرار: تحقَّق أن الحديثين المختارين غير مستخدَمين سابقاً —
-- استُبعد حديث "ازهد في الدنيا يحبك الله" لأنه بالضبط حديث الأربعين
-- النووية رقم 31 (arbaeen-nawawi-seed.ts) المُستخدَم سابقاً هذه الجلسة،
-- فاختير حسن الظن بالله والتوكل بدلاً منه.
--
-- سلامة الاستشهاد (كل حديث تحقَّق عبر WebFetch من ويكي مصدر العربية):
--   1. حسن الظن بالله — حديث قدسي: «أنا عند ظن عبدي بي، وأنا معه إذا
--      ذكرني» — متفق عليه، عن أبي هريرة رضي الله عنه.
--   2. التوكل على الله — «لو أنكم تتوكلون على الله حق توكله لرزقكم كما
--      يرزق الطير، تغدو خماصاً وتروح بطاناً» — رواه الترمذي، عن عمر بن
--      الخطاب رضي الله عنه.
--
-- الكتاب المرجعي: "إحياء علوم الدين" (نفس مرجع العنصرين الموجودين
-- مسبقاً، للإمام الغزالي).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := '0185b970-0448-4b94-aabc-2ffa0a9b665a';
  v_item1 uuid;
  v_item2 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'حسن الظن بالله'
  ) THEN
    RAISE NOTICE 'عناصر الفضائل المنجية المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'حسن الظن بالله', 'حديث قدسي عن أبي هريرة رضي الله عنه: «قال الله عز وجل: أنا عند ظن عبدي بي، وأنا معه إذا ذكرني» — متفق عليه.', 1, 10, 25, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'التوكل على الله', 'حديث عمر بن الخطاب رضي الله عنه: «لو أنكم تتوكلون على الله حق توكله لرزقكم كما يرزق الطير، تغدو خماصاً وتروح بطاناً» — رواه الترمذي.', 1, 10, 25, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'إحياء علوم الدين', 'الإمام الغزالي', 'أساسية إلزامية', 'حسن الظن بالله', 'المرجع الأصلي للمقرر، يكمّل العنصرين الموجودين', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'إحياء علوم الدين', 'الإمام الغزالي', 'أساسية إلزامية', 'التوكل على الله', 'المرجع الأصلي للمقرر', 'library-catalog.ts');

  UPDATE learning_items SET weight = 25 WHERE unit_id = v_unit_id AND title IN ('الصبر ومنزلته المنجية', 'التوبة والخوف من الله');

  UPDATE learning_paths SET total_sessions = total_sessions + 2 WHERE slug = 'tarbiyah';

  RAISE NOTICE 'أُدخل عنصران جديدان لمقرر الفضائل المنجية + صفَّا course_books';
END $$;
