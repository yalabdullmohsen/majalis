-- ═══════════════════════════════════════════════════════════════════════════
-- kitab_tawhid_complete_deep_v1.sql
--
-- تعميق مقرر "كتاب التوحيد كاملًا" (tawheed path، وحدة `3f9bf5cb...`) من
-- عنصر واحد عام إلى 5 عناصر — تكملة قائمة المقررات السطحية المتبقية
-- (بطلب المنسّق). ملاحظة: هذا مقرر منفصل تماماً عن مقرر "كتاب التوحيد"
-- في مسار العقيدة (aqeedah path) المُعمَّق سابقاً هذه الجلسة
-- (kitab_tawhid_deep_v1.sql) — نفس الكتاب لكن في مسار تعليمي مختلف
-- (tawheed)، فاختيرت 4 أبواب مختلفة تماماً عن الأربعة المُستخدَمة هناك
-- (تفسير التوحيد والشهادة، دخول الجنة بلا حساب، الخوف من الشرك، الذبح
-- لغير الله) لتفادي التكرار حتى عبر مسارين مختلفين لنفس الكتاب:
--
-- سلامة الاستشهاد (كل نص تحقَّق عبر WebFetch، والآية القرآنية تحقَّقت
-- مباشرة من الملفات المحلية):
--   1. باب من الشرك: إتيان الكهان والعرافين وتصديقهم — «من أتى كاهناً
--      أو عرافاً فصدَّقه بما يقول فقد كفر بما أُنزل على محمد ﷺ» — رواه
--      أحمد وأصحاب السنن.
--   2. باب من الشرك: التبرك بشجر أو حجر — قصة «ذات أنواط» يوم حنين:
--      طلب بعض الصحابة من النبي ﷺ شجرة يتبركون بها كما كان للمشركين،
--      فقال: «الله أكبر! قلتم والذي نفسي بيده كما قال قوم موسى لموسى:
--      اجعل لنا إلهاً كما لهم آلهة» — سنن الترمذي.
--   3. باب قول الله تعالى: وما قدروا الله حق قدره — الآية كاملة (الزمر:
--      67) تحقَّقت حرفياً من public/data/quran/surah-039.json.
--   4. النذر عبادة لا تصرف لغير الله — حديث عائشة رضي الله عنها: «من
--      نذر أن يطيع الله فليطعه، ومن نذر أن يعصيه فلا يعصه» — صحيح
--      البخاري، كتاب الأيمان والنذور.
--
-- الكتاب المرجعي: "كتاب التوحيد" نفسه (نفس مرجع العنصر العام الموجود
-- مسبقاً في هذه الوحدة) — العنصر العام يبقى كما هو، وهذه العناصر
-- الأربعة تربط أبواباً محددة إضافية منه (مختلفة عن دفعة aqeedah path).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := '3f9bf5cb-26d9-46ec-b5be-cc3cbae93f00';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'باب من الشرك: إتيان الكهان والعرافين وتصديقهم'
  ) THEN
    RAISE NOTICE 'عناصر كتاب التوحيد كاملًا المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'باب من الشرك: إتيان الكهان والعرافين وتصديقهم', 'تحريم الذهاب للكهان والعرافين وادّعاء علم الغيب: «من أتى كاهناً أو عرافاً فصدَّقه بما يقول فقد كفر بما أُنزل على محمد ﷺ» — رواه أحمد وأصحاب السنن.', 1, 15, 20, true, 'manual_confirm', null, 2, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'باب من الشرك: التبرك بشجر أو حجر', 'قصة «ذات أنواط» يوم حنين: طلب بعض الصحابة حديثي العهد بالإسلام من النبي ﷺ شجرة يتبركون بها كما كان للمشركين، فقال: «الله أكبر! قلتم والذي نفسي بيده كما قال قوم موسى لموسى: اجعل لنا إلهاً كما لهم آلهة» — سنن الترمذي.', 1, 15, 20, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'باب قول الله تعالى: وما قدروا الله حق قدره', 'الآية كاملة (الزمر: 67): «وما قدروا الله حق قدره والأرض جميعاً قبضته يوم القيامة والسماوات مطويات بيمينه، سبحانه وتعالى عما يشركون» — في تعظيم الله وتنزيهه عن الشرك.', 1, 12, 20, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'النذر عبادة لا تصرف لغير الله', 'حديث عائشة رضي الله عنها: «من نذر أن يطيع الله فليطعه، ومن نذر أن يعصيه فلا يعصه» — صحيح البخاري؛ النذر عبادة، فلا يجوز صرفه لغير الله كالنذر لقبر أو ولي.', 1, 12, 20, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'كتاب التوحيد', 'الإمام محمد بن عبد الوهاب', 'أساسية إلزامية', 'باب إتيان الكهان والعرافين', 'المتن الأصلي للمقرر، يكمّل العنصر العام المرتبط بكامل الكتاب', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'كتاب التوحيد', 'الإمام محمد بن عبد الوهاب', 'أساسية إلزامية', 'باب التبرك بشجر أو حجر', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'كتاب التوحيد', 'الإمام محمد بن عبد الوهاب', 'أساسية إلزامية', 'باب وما قدروا الله حق قدره', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'كتاب التوحيد', 'الإمام محمد بن عبد الوهاب', 'أساسية إلزامية', 'باب النذر لغير الله', 'المتن الأصلي للمقرر', 'library-catalog.ts');

  -- إعادة توازن الوزن: العنصر الوحيد الموجود كان weight=100 (وحيد في الوحدة)،
  -- الآن 5 عناصر فيُعاد توازنها إلى 20 لكل عنصر (تجمع 100 كالسابق).
  UPDATE learning_items SET weight = 20 WHERE unit_id = v_unit_id AND title = 'شرح كتاب التوحيد';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'tawheed';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر كتاب التوحيد كاملًا + 4 صفوف course_books';
END $$;
