-- ═══════════════════════════════════════════════════════════════════════════
-- riyad_saliheen_deep_v1.sql
--
-- تعميق مقرر "رياض الصالحين" (hadith path) من عنصر واحد عام ("رياض
-- الصالحين") إلى 5 عناصر تتناول 4 أبواب مشهورة من الكتاب كلٌّ على حدة —
-- تكملة لأولوية "أهمها علميًا" (بطلب المنسّق) بعد صحيح البخاري وصحيح
-- مسلم. رياض الصالحين للإمام النووي مرجع تربوي وأخلاقي واسع الانتشار.
--
-- تجنُّب التكرار: قُورنت الأحاديث الأربعة بكل عناوين arbaeen-nawawi-seed.ts
-- (42 حديثاً) وبالثمانية عناصر المُضافة حديثاً لصحيح البخاري وصحيح مسلم
-- (نفس مسار الحديث) — لا تطابق ولا تداخل موضوعي مباشر مع أيٍّ منها.
--
-- سلامة الاستشهاد (كل حديث تحقَّق عبر WebFetch من ويكي مصدر العربية):
--   1. باب الصبر — «عجباً لأمر المؤمن، إن أمره كله له خير...» — صحيح
--      مسلم، كتاب الزهد والرقائق، عن صهيب رضي الله عنه.
--   2. باب التوبة — «لله أشد فرحاً بتوبة عبده من أحدكم سقط على بعيره
--      وقد أضلّه في أرض فلاة» — متفق عليه (البخاري ومسلم)، عن أنس بن
--      مالك رضي الله عنه (الراوي الأشهر لهذا اللفظ حسب نتائج البحث،
--      وردت أيضاً ألفاظ قريبة عن أبي هريرة وابن مسعود والنعمان بن بشير).
--   3. باب بر الوالدين — «رغم أنف، ثم رغم أنف، ثم رغم أنف: من أدرك أبويه
--      عند الكبر أحدهما أو كليهما فلم يدخل الجنة» — صحيح مسلم، كتاب البر
--      والصلة والآداب، عن أبي هريرة رضي الله عنه.
--   4. باب حسن الخلق — «أكمل المؤمنين إيماناً أحسنهم خلقاً» — رواه
--      الترمذي وأبو داود عن أبي هريرة رضي الله عنه، وصحَّحه الحاكم.
--      **ليس في الصحيحين** — ذُكر مصدره الحقيقي (الترمذي/أبو داود
--      وتصحيح الحاكم) بدل نسبته خطأً للبخاري أو مسلم، بنفس انضباط الدقة
--      في نسبة كل حديث لمصدره الفعلي المُتَّبع طوال الجلسة.
--
-- الكتاب المرجعي: "رياض الصالحين" نفسه (موجود مسبقاً في الفهرس، مؤلفه
-- الإمام النووي) — العنصر العام الموجود مسبقاً يبقى كما هو، وهذه
-- العناصر الأربعة تربط أبواباً محددة إضافية منه.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := 'd700b47a-c79b-425a-9156-e8ee1f8e3a9d';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'باب الصبر: عجباً لأمر المؤمن'
  ) THEN
    RAISE NOTICE 'عناصر رياض الصالحين المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'باب الصبر: عجباً لأمر المؤمن', 'حديث صهيب رضي الله عنه: «عجباً لأمر المؤمن، إن أمره كله له خير، وليس ذلك لأحد إلا للمؤمن: إن أصابته سراء شكر فكان خيراً له، وإن أصابته ضراء صبر فكان خيراً له» — صحيح مسلم، كتاب الزهد والرقائق.', 1, 10, 20, true, 'manual_confirm', null, 2, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'باب التوبة: فرح الله بتوبة عبده', 'حديث «لله أشد فرحاً بتوبة عبده من أحدكم سقط على بعيره وقد أضلّه في أرض فلاة» — متفق عليه (البخاري ومسلم)، عن أنس بن مالك رضي الله عنه.', 1, 10, 20, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'باب بر الوالدين: رغم أنف من أدركهما فلم يدخل الجنة', 'حديث أبي هريرة رضي الله عنه: «رغم أنف، ثم رغم أنف، ثم رغم أنف: من أدرك أبويه عند الكبر، أحدهما أو كليهما، فلم يدخل الجنة» — صحيح مسلم، كتاب البر والصلة والآداب.', 1, 10, 20, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'باب حسن الخلق: أكمل المؤمنين إيماناً أحسنهم خلقاً', 'حديث أبي هريرة رضي الله عنه: «أكمل المؤمنين إيماناً أحسنهم خلقاً» — رواه الترمذي وأبو داود، وصحَّحه الحاكم (ليس في الصحيحين).', 1, 10, 20, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'رياض الصالحين', 'الإمام النووي', 'أساسية إلزامية', 'باب الصبر', 'المتن الأصلي للمقرر، يكمّل العنصر العام المرتبط بكامل الكتاب', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'رياض الصالحين', 'الإمام النووي', 'أساسية إلزامية', 'باب التوبة', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'رياض الصالحين', 'الإمام النووي', 'أساسية إلزامية', 'باب بر الوالدين', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'رياض الصالحين', 'الإمام النووي', 'أساسية إلزامية', 'باب حسن الخلق', 'المتن الأصلي للمقرر', 'library-catalog.ts');

  -- إعادة توازن الوزن: العنصر الوحيد الموجود كان weight=100 (وحيد في الوحدة)،
  -- الآن 5 عناصر فيُعاد توازنها إلى 20 لكل عنصر (تجمع 100 كالسابق).
  UPDATE learning_items SET weight = 20 WHERE unit_id = v_unit_id AND title = 'رياض الصالحين';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'hadith';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر رياض الصالحين + 4 صفوف course_books';
END $$;
