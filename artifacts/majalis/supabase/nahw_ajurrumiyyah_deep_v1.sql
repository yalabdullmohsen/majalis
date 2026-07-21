-- ═══════════════════════════════════════════════════════════════════════════
-- nahw_ajurrumiyyah_deep_v1.sql
--
-- تعميق مقرر "المدخل إلى النحو — متن الآجرومية" (nahw path، وحدة
-- `33330646...`) من عنصرين (الكلام وأقسامه الثلاثة، الإعراب وأثره في
-- المعنى — وزن 50/50) إلى 4 عناصر بإضافة بابين جديدين — تكملة قائمة
-- المقررات السطحية المتبقية (بطلب المنسّق: "نحو/عربية وفقه matn إن
-- توفر مصدر").
--
-- سلامة الاستشهاد: متن الآجرومية متوفر كاملاً على ويكي مصدر العربية
-- (بخلاف زاد المستقنع)، فتحقَّق كل نص حرفياً عبر WebFetch من الصفحة
-- "الآجرومية في قواعد علم العربية":
--   1. علامات الاسم — «فالاسم يُعرف بالخفض، والتنوين، ودخول الألف
--      واللام، وحروف الخفض، وهي: من، وإلى، وعن، وعلى، وفي، ورُبَّ...».
--   2. علامات الفعل — «والفعل يُعرف بقد، والسين، وسوف، وتاء التأنيث
--      الساكنة».
--
-- تجنُّب التكرار: تحقَّق أن العنصرين الموجودين (الكلام وأقسامه، الإعراب)
-- يغطيان بابين مختلفين تماماً (التعريف الافتتاحي، ثم الإعراب) — علامات
-- الاسم والفعل باب ثالث منفصل لم يُغطَّ بعد، الخطوة المنطقية التالية في
-- المتن نفسه.
--
-- الكتاب المرجعي: "متن الآجرومية في النحو" (نفس مرجع العنصرين الموجودين
-- مسبقاً، لابن آجروم الصنهاجي).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := '33330646-304d-417b-b437-b287e9d92168';
  v_item1 uuid;
  v_item2 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'علامات الاسم'
  ) THEN
    RAISE NOTICE 'عناصر متن الآجرومية المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'علامات الاسم', 'من متن الآجرومية: «فالاسم يُعرف بالخفض، والتنوين، ودخول الألف واللام، وحروف الخفض، وهي: من، وإلى، وعن، وعلى، وفي، ورُبَّ...» — أربع علامات تميّز الاسم عن الفعل والحرف.', 1, 12, 25, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'علامات الفعل', 'من متن الآجرومية: «والفعل يُعرف بقد، والسين، وسوف، وتاء التأنيث الساكنة» — أربع علامات تميّز الفعل عن الاسم والحرف.', 1, 12, 25, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'متن الآجرومية في النحو', 'ابن آجروم الصنهاجي', 'أساسية إلزامية', 'علامات الاسم', 'المتن الأصلي للمقرر، يكمّل العنصرين الموجودين', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'متن الآجرومية في النحو', 'ابن آجروم الصنهاجي', 'أساسية إلزامية', 'علامات الفعل', 'المتن الأصلي للمقرر', 'library-catalog.ts');

  UPDATE learning_items SET weight = 25 WHERE unit_id = v_unit_id AND title IN ('الكلام وأقسامه الثلاثة', 'الإعراب وأثره في المعنى');

  UPDATE learning_paths SET total_sessions = total_sessions + 2 WHERE slug = 'nahw';

  RAISE NOTICE 'أُدخل عنصران جديدان لمقرر متن الآجرومية + صفَّا course_books';
END $$;
