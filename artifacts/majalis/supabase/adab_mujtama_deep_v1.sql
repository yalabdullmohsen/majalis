-- ═══════════════════════════════════════════════════════════════════════════
-- adab_mujtama_deep_v1.sql
--
-- تعميق مقرر "آداب المجتمع" (adab path، وحدة `dca26054...`) من عنصرين
-- (إكرام الضيف، آداب السلام — عامّان، وزن 50/50) إلى 4 عناصر بإضافة
-- أدبين اجتماعيين جديدين — تكملة قائمة المقررات السطحية المكتشَفة
-- حديثاً (بطلب المنسّق).
--
-- سلامة الاستشهاد (كل حديث تحقَّق عبر WebFetch من ويكي مصدر العربية):
--   1. حق الجار — «ما زال جبريل يوصيني بالجار حتى ظننت أنه سيورثه» —
--      متفق عليه (البخاري ومسلم)، عن عبدالله بن عمر رضي الله عنهما.
--   2. آداب المجلس: السلام عند الدخول والانصراف — «إذا انتهى أحدكم إلى
--      المجلس فليسلم، فإذا أراد أن يقوم فليسلم، فليست الأولى بأحق من
--      الآخرة» — رواه أبو داود، عن أبي هريرة رضي الله عنه.
--
-- الكتاب المرجعي: "الأدب المفرد" (نفس مرجع العنصرين الموجودين مسبقاً،
-- للإمام البخاري).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := 'dca26054-1323-4fcf-b0a8-3f41d4fdbda8';
  v_item1 uuid;
  v_item2 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'حق الجار'
  ) THEN
    RAISE NOTICE 'عناصر آداب المجتمع المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'حق الجار', 'حديث ابن عمر رضي الله عنهما: «ما زال جبريل يوصيني بالجار حتى ظننت أنه سيورثه» — متفق عليه؛ دلالة على عِظَم حق الجار في الإسلام.', 1, 10, 25, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'آداب المجلس: السلام عند الدخول والانصراف', 'حديث أبي هريرة رضي الله عنه: «إذا انتهى أحدكم إلى المجلس فليسلم، فإذا أراد أن يقوم فليسلم، فليست الأولى بأحق من الآخرة» — رواه أبو داود.', 1, 10, 25, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'الأدب المفرد', 'الإمام محمد بن إسماعيل البخاري', 'أساسية إلزامية', 'حق الجار', 'المرجع الأصلي للمقرر، يكمّل العنصرين الموجودين', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'الأدب المفرد', 'الإمام محمد بن إسماعيل البخاري', 'أساسية إلزامية', 'آداب المجلس', 'المرجع الأصلي للمقرر', 'library-catalog.ts');

  UPDATE learning_items SET weight = 25 WHERE unit_id = v_unit_id AND title IN ('إكرام الضيف', 'آداب السلام');

  UPDATE learning_paths SET total_sessions = total_sessions + 2 WHERE slug = 'adab';

  RAISE NOTICE 'أُدخل عنصران جديدان لمقرر آداب المجتمع + صفَّا course_books';
END $$;
