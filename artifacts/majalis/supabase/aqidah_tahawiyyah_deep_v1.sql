-- ═══════════════════════════════════════════════════════════════════════════
-- aqidah_tahawiyyah_deep_v1.sql
--
-- تعميق مقرر "العقيدة الطحاوية" (aqeedah path، وحدة `b8fcae81...`) من
-- عنصر واحد عام ("العقيدة الطحاوية") إلى 5 عناصر تتناول 4 مباحث حقيقية
-- من متن الإمام الطحاوي نفسه كلٌّ على حدة — تكملة أولوية "أهمها علميًا"
-- (بطلب المنسّق) بعد صحيح البخاري ومسلم ورياض الصالحين والواسطية.
--
-- تجنُّب التكرار: قُورنت المباحث الأربعة بالعناصر المُضافة حديثاً لكل
-- من "كتاب التوحيد" و"العقيدة الواسطية" (نفس مسار العقيدة) — لا تطابق:
-- الطحاوية تتناول هنا خلق القرآن، وعدم تكفير أهل القبلة، والمعراج،
-- ورؤية أهل الجنة لله — مباحث مختلفة تماماً عن مباحث الواسطية (أسماء
-- وصفات/قدر/صحابة/يوم آخر) وكتاب التوحيد (تفسير التوحيد/شرك).
--
-- سلامة الاستشهاد (كل نص تحقَّق حرفياً عبر WebFetch من متن الطحاوية
-- نفسه على ويكي مصدر العربية):
--   1. القرآن كلام الله غير مخلوق — النص الحرفي: «وإن القرآن كلام
--      الله، منه بدا بلا كيفية قولا، وأنزله على رسوله وحيا... ليس
--      بمخلوق ككلام البرية» — من أبرز مواضع الطحاوية تاريخياً (رد على
--      محنة خلق القرآن المعتزلية).
--   2. عدم تكفير أهل القبلة بالذنوب — النص الحرفي: «ولا نكفر أحداً من
--      أهل القبلة بذنب ما لم يستحله» — موقف وسط بين إرجاء المرجئة
--      وتكفير الخوارج بالكبائر.
--   3. الإسراء والمعراج حق — النص الحرفي: «والمعراج حق، وقد أسرى
--      بالنبي ﷺ، وعرج بشخصه في اليقظة إلى السماء».
--   4. رؤية أهل الجنة لله تعالى — النص الحرفي: «والرؤية حق لأهل الجنة
--      بغير إحاطة ولا كيفية، كما نطق به كتاب ربنا».
--
-- الكتاب المرجعي: "العقيدة الطحاوية" نفسها (المتن، موجودة مسبقاً في
-- الفهرس، مؤلفها الإمام أبو جعفر الطحاوي) — العنصر العام الموجود مسبقاً
-- يبقى كما هو، وهذه العناصر الأربعة تربط مباحث محددة إضافية منها.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := 'b8fcae81-71c1-458c-89ce-543a95ca0ceb';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'القرآن كلام الله غير مخلوق'
  ) THEN
    RAISE NOTICE 'عناصر العقيدة الطحاوية المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'القرآن كلام الله غير مخلوق', 'النص الحرفي: «وإن القرآن كلام الله، منه بدا بلا كيفية قولا، وأنزله على رسوله وحيا... ليس بمخلوق ككلام البرية» — من أبرز مواضع الطحاوية تاريخياً، ردًّا على محنة خلق القرآن التي تبنّتها المعتزلة.', 1, 15, 20, true, 'manual_confirm', null, 2, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'عدم تكفير أهل القبلة بالذنوب', 'النص الحرفي: «ولا نكفر أحداً من أهل القبلة بذنب ما لم يستحله» — موقف وسط بين إرجاء المرجئة (الإيمان قول بلا عمل) وتكفير الخوارج للمسلم بالكبيرة.', 1, 15, 20, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'الإسراء والمعراج حق', 'النص الحرفي: «والمعراج حق، وقد أسرى بالنبي ﷺ، وعرج بشخصه في اليقظة إلى السماء» — تقرير أن الإسراء والمعراج وقعا بالجسد والروح معاً في حالة اليقظة، لا مناماً.', 1, 15, 20, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'رؤية أهل الجنة لله تعالى', 'النص الحرفي: «والرؤية حق لأهل الجنة بغير إحاطة ولا كيفية، كما نطق به كتاب ربنا» — إثبات رؤية المؤمنين لربهم في الجنة دون إدراك كامل (إحاطة) أو معرفة الكيفية.', 1, 15, 20, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'العقيدة الطحاوية', 'الإمام أبو جعفر الطحاوي', 'أساسية إلزامية', 'القرآن كلام الله غير مخلوق', 'المتن الأصلي للمقرر، يكمّل العنصر العام المرتبط بكامل المتن', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'العقيدة الطحاوية', 'الإمام أبو جعفر الطحاوي', 'أساسية إلزامية', 'عدم تكفير أهل القبلة', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'العقيدة الطحاوية', 'الإمام أبو جعفر الطحاوي', 'أساسية إلزامية', 'الإسراء والمعراج', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'العقيدة الطحاوية', 'الإمام أبو جعفر الطحاوي', 'أساسية إلزامية', 'رؤية أهل الجنة لله', 'المتن الأصلي للمقرر', 'library-catalog.ts');

  -- إعادة توازن الوزن: العنصر الوحيد الموجود كان weight=100 (وحيد في الوحدة)،
  -- الآن 5 عناصر فيُعاد توازنها إلى 20 لكل عنصر (تجمع 100 كالسابق).
  UPDATE learning_items SET weight = 20 WHERE unit_id = v_unit_id AND title = 'العقيدة الطحاوية' AND item_type = 'lesson';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'aqeedah';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر العقيدة الطحاوية + 4 صفوف course_books';
END $$;
