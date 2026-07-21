-- ═══════════════════════════════════════════════════════════════════════════
-- nawaqid_islam_deep_v1.sql
--
-- تعميق مقرر "نواقض الإسلام ومدخل العقيدة" (aqeedah path، وحدة
-- `d6e667c3...`) من عنصرين (محاضرة عامة + اختبار عن الأصول الثلاثة) إلى
-- 6 عناصر بإضافة 4 عناصر تُفصِّل نواقض الإسلام العشرة الفعلية لمحمد بن
-- عبد الوهاب مجمَّعة موضوعياً — تكملة قائمة الـ14 مقرراً السطحياً
-- المتبقية بعد إغلاق أولوية "أهمها علميًا" (بطلب المنسّق).
--
-- سلامة الاستشهاد: القائمة الكاملة للنواقض العشرة تحقَّقت حرفياً عبر
-- WebFetch من نص رسالة "نواقض الإسلام" نفسها على ويكي مصدر العربية
-- (لا من الذاكرة)، ثم جُمِّعت في 4 عناصر موضوعية مترابطة:
--   1. الشرك في العبادة والاستعانة بالوسائط والسحر — النواقض 1، 2، 7:
--      الشرك في عبادة الله (كالذبح لغير الله)، اتخاذ وسائط بين العبد
--      والله (دعاؤهم وطلب شفاعتهم والتوكل عليهم)، والسحر (كالصرف
--      والعطف).
--   2. عدم تكفير المشركين وتفضيل غير حكم النبي ﷺ — الناقضان 3، 4: من لم
--      يُكفِّر المشركين أو شكَّ في كفرهم أو صحَّح مذهبهم، ومن اعتقد أن
--      غير هدي النبي ﷺ أحسن من هديه أو أن حكم غيره أحسن من حكمه.
--   3. بغض دين الرسول ﷺ أو الاستهزاء به — الناقضان 5، 6: من أبغض شيئاً
--      مما جاء به الرسول ﷺ ولو عمل به، ومن استهزأ بشيء من دين الرسول ﷺ
--      أو ثوابه أو عقابه.
--   4. معاونة المشركين واعتقاد جواز الخروج عن الشريعة والإعراض عن الدين
--      — النواقض 8، 9، 10: مظاهرة المشركين ومعاونتهم على المسلمين،
--      اعتقاد أن أحداً يسعه الخروج عن شريعة محمد ﷺ، والإعراض عن دين
--      الله تعلُّماً وعملاً بالكلية.
--
-- الكتاب المرجعي: "ثلاثة الأصول" (موجود مسبقاً في الفهرس)، بنفس نمط
-- الربط المُتَّبع مسبقاً للعنصر العام الموجود في هذه الوحدة نفسها —
-- رسالة "نواقض الإسلام" القصيرة لا مدخل مستقل لها في الفهرس، فرُبطت
-- بنفس المرجع المُستخدَم للعنصر السابق.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := 'd6e667c3-117f-4e24-98e3-c3d14da0aec2';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'الشرك في العبادة واتخاذ الوسائط والسحر'
  ) THEN
    RAISE NOTICE 'عناصر نواقض الإسلام المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'الشرك في العبادة واتخاذ الوسائط والسحر', 'ثلاثة من نواقض الإسلام العشرة: الشرك في عبادة الله تعالى (كالذبح لغير الله)، واتخاذ وسائط بين العبد وربه يدعوهم ويطلب شفاعتهم ويتوكل عليهم، والسحر (ومنه الصرف والعطف) — تعلُّمه وتعليمه.', 1, 15, 15, true, 'manual_confirm', null, 2, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'عدم تكفير المشركين وتفضيل غير حكم النبي ﷺ', 'ناقضان من نواقض الإسلام: من لم يُكفِّر المشركين أو شكَّ في كفرهم أو صحَّح مذهبهم، ومن اعتقد أن غير هدي النبي ﷺ أكمل من هديه أو أن حكم غيره أحسن من حكمه.', 1, 15, 15, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'بغض دين الرسول ﷺ أو الاستهزاء به', 'ناقضان من نواقض الإسلام: من أبغض شيئاً مما جاء به الرسول ﷺ ولو عمل به، ومن استهزأ بشيء من دين الرسول ﷺ أو ثوابه أو عقابه.', 1, 15, 15, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'معاونة المشركين والخروج عن الشريعة والإعراض عن الدين', 'ثلاثة من نواقض الإسلام: مظاهرة المشركين ومعاونتهم على المسلمين، واعتقاد أن أحداً يسعه الخروج عن شريعة محمد ﷺ، والإعراض عن دين الله تعلُّماً وعملاً بالكلية.', 1, 15, 15, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'ثلاثة الأصول', 'محمد بن عبد الوهاب', 'أساسية إلزامية', 'نواقض الإسلام 1، 2، 7', 'رسالة نواقض الإسلام القصيرة لا مدخل مستقل لها في الفهرس، رُبطت بنفس مرجع العنصر العام في هذه الوحدة', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'ثلاثة الأصول', 'محمد بن عبد الوهاب', 'أساسية إلزامية', 'نواقض الإسلام 3، 4', 'المرجع نفسه', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'ثلاثة الأصول', 'محمد بن عبد الوهاب', 'أساسية إلزامية', 'نواقض الإسلام 5، 6', 'المرجع نفسه', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'ثلاثة الأصول', 'محمد بن عبد الوهاب', 'أساسية إلزامية', 'نواقض الإسلام 8، 9، 10', 'المرجع نفسه', 'library-catalog.ts');

  -- إعادة توازن الوزن: العنصران الموجودان (60+0=60) — العنصر التقييمي وزنه 0
  -- أصلاً (اختبار لا يُحتسَب ضمن وزن المحتوى)، فيُخفَّض العنصر العام من 60
  -- إلى 40 ليُفسح مجالاً للأربعة الجديدة (4×15=60)، فيصبح المجموع 100.
  UPDATE learning_items SET weight = 40 WHERE unit_id = v_unit_id AND title = 'نواقض الإسلام — د. عثمان الخميس';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'aqeedah';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر نواقض الإسلام + 4 صفوف course_books';
END $$;
