-- ═══════════════════════════════════════════════════════════════════════════
-- tarbiyah_afat_nafs_deep_v1.sql
--
-- تعميق مقرر "آفات النفس" (tarbiyah path، وحدة `a9d37169...`) من عنصرين
-- (آفة الغضب وعلاجها، آفة الشح وعلاجه — عامّان، وزن 50/50) إلى 4 عناصر
-- بإضافة آفتين جديدتين لم يُغطِّهما العنصران الموجودان — تكملة قائمة
-- المقررات السطحية المكتشَفة حديثاً في مساري آداب/تربية (بطلب المنسّق).
--
-- سلامة الاستشهاد (كل حديث تحقَّق عبر WebFetch من ويكي مصدر العربية):
--   1. آفة الحسد — «إياكم والحسد فإن الحسد يأكل الحسنات كما تأكل النار
--      الحطب» — رواه أبو داود، كتاب الأدب، عن أبي هريرة رضي الله عنه.
--      لم يُقدَّم تصحيح قاطع للحديث لعدم توفره صراحة في نتائج البحث
--      (اكتُفي بذكر المصدر: سنن أبي داود، دون ادّعاء درجة غير مؤكَّدة).
--   2. آفة الكِبر — «لا يدخل الجنة من كان في قلبه مثقال ذرة من كِبر»،
--      وتعريف الكِبر: «بطر الحق وغمط الناس» (أي: جحد الحق ودفعه،
--      واحتقار الناس وازدراؤهم) — صحيح مسلم، عن عبدالله بن مسعود رضي
--      الله عنه.
--
-- الكتاب المرجعي: "إحياء علوم الدين" (نفس مرجع العنصرين الموجودين
-- مسبقاً، للإمام الغزالي).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := 'a9d37169-1d0b-4be9-92d1-d1d02b6a963a';
  v_item1 uuid;
  v_item2 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'آفة الحسد وعلاجها'
  ) THEN
    RAISE NOTICE 'عناصر آفات النفس المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'آفة الحسد وعلاجها', 'حديث أبي هريرة رضي الله عنه: «إياكم والحسد فإن الحسد يأكل الحسنات كما تأكل النار الحطب» — رواه أبو داود؛ الحسد يُذهب أثر الطاعات كما تذهب النار الحطب.', 1, 12, 25, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'آفة الكِبر وعلاجها', 'حديث عبدالله بن مسعود رضي الله عنه: «لا يدخل الجنة من كان في قلبه مثقال ذرة من كِبر» — صحيح مسلم؛ وفسَّر النبي ﷺ الكِبر بأنه «بطر الحق وغمط الناس» (جحد الحق ودفعه، واحتقار الناس وازدراؤهم).', 1, 12, 25, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'إحياء علوم الدين', 'الإمام الغزالي', 'أساسية إلزامية', 'آفة الحسد', 'المرجع الأصلي للمقرر، يكمّل العنصرين الموجودين', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'إحياء علوم الدين', 'الإمام الغزالي', 'أساسية إلزامية', 'آفة الكِبر', 'المرجع الأصلي للمقرر', 'library-catalog.ts');

  UPDATE learning_items SET weight = 25 WHERE unit_id = v_unit_id AND title IN ('آفة الغضب وعلاجها', 'آفة الشح وعلاجه');

  UPDATE learning_paths SET total_sessions = total_sessions + 2 WHERE slug = 'tarbiyah';

  RAISE NOTICE 'أُدخل عنصران جديدان لمقرر آفات النفس + صفَّا course_books';
END $$;
