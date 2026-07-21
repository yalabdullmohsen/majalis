-- ═══════════════════════════════════════════════════════════════════════════
-- learning_path_akhlaq_v1.sql
--
-- سياق: مسار "akhlaq" (الأخلاق) أحد المسارات `status='draft'` الفارغة
-- تمامًا (placeholder صريح "قيد الإعداد" ← مقرر "محتوى قيد المراجعة
-- العلمية" — يُحذف هذا الملف عمداً قبل الإدراج، بنفس نمط uloom-quran).
--
-- ملاحظة معمارية: يوجد بالفعل صفحة مرجعية مستقلة عالية الجودة `/akhlaq`
-- (src/views/AkhlaqPage.tsx، 1328 سطراً، عشرات الفضائل مصنَّفة: مع الله/
-- مع النفس/مع الناس/في الأسرة/في المجتمع) — لا تعارض معها (مرجع تصفّح
-- مقابل مسار متدرّج بتتبّع تقدّم)، ولم يُستخدَم محتواها هنا مباشرة (بل
-- كُتب محتوى مستقل مربوط بكتب حقيقية، اتساقاً مع نمط aqeedah/uloom-quran).
--
-- البنية: 3 مراحل (نفس التسمية المستقرة: التأسيس/البناء/التوسع)، 3
-- مقررات، 9 عناصر تعليمية، كل عنصر مربوط بكتاب حقيقي عبر course_books —
-- الكتب الثلاثة (تهذيب الأخلاق، رياض الصالحين، أدب الدنيا والدين) كلها
-- موجودة مسبقاً في src/lib/library-catalog.ts (لا كتب جديدة).
--
-- التحقق العلمي (WebSearch مباشر هذه الجلسة لكل بند قبل كتابته):
--   • "تهذيب الأخلاق" لابن مسكويه (ت 421هـ): موضوعاته الفعلية — النفس،
--     الأخلاق والآداب، الخير والسعادة، الفضائل، المحبة والصداقة — تحقّقتُ
--     عبر عدة مصادر متطابقة (منها مؤسسة هنداوي).
--   • "أدب الدنيا والدين" للماوردي: أبوابه الخمسة المؤكَّدة — فضل العقل
--     وذم الهوى، أدب العلم، أدب الدين، أدب الدنيا، أدب النفس — تحقّقتُ
--     عبر ويكيبيديا العربية.
--   • "رياض الصالحين" للنووي: ترتيب أبوابه الأولى المؤكَّد — الإخلاص،
--     التوبة، الصبر، الصدق، المراقبة، التقوى، اليقين والتوكل، الاستقامة
--     — تحقّقتُ عبر نتائج بحث متعددة متطابقة.
--   • حديث «إنما الأعمال بالنيات»: تأكّدتُ أنه الحديث الأول الذي يفتتح
--     به البخاري صحيحه (كتاب بدء الوحي)، وأخرجه مسلم أيضاً برقم 1907 —
--     تحقّق عبر WebSearch مباشر (ورد أنه "الحديث الأول الذي يُورده
--     البخاري" في أكثر من مصدر متطابق؛ لم أعتمد رقماً تسلسلياً وحيداً
--     للبخاري لتضارب أرقام الطبعات، اكتفيتُ بالوصف المؤكَّد "أول حديث").
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_path_id      uuid;
  v_old_stage_id uuid;
  v_stage1_id    uuid; -- التأسيس
  v_stage2_id    uuid; -- البناء
  v_stage3_id    uuid; -- التوسع
  v_course1_id   uuid; -- أصول الأخلاق الإسلامية
  v_course2_id   uuid; -- الأخلاق في السنة النبوية
  v_course3_id   uuid; -- التوازن بين الدين والدنيا
  v_unit1_id     uuid;
  v_unit2_id     uuid;
  v_unit3_id     uuid;
  v_i1 uuid; v_i2 uuid; v_i3 uuid; v_i4 uuid; v_i5 uuid;
  v_i6 uuid; v_i7 uuid; v_i8 uuid; v_i9 uuid;
BEGIN
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'akhlaq';
  IF v_path_id IS NULL THEN
    RAISE EXCEPTION 'مسار akhlaq غير موجود';
  END IF;

  IF EXISTS (SELECT 1 FROM courses WHERE slug = 'usul-akhlaq-islamiyya') THEN
    RAISE NOTICE 'akhlaq مُنجَز مسبقاً — لا شيء يُنفَّذ';
    RETURN;
  END IF;

  SELECT id INTO v_old_stage_id FROM path_stages
    WHERE path_id = v_path_id AND slug = 'pending-content';
  IF v_old_stage_id IS NOT NULL THEN
    DELETE FROM path_stages WHERE id = v_old_stage_id;
  END IF;

  -- ── المرحلة 1: التأسيس ────────────────────────────────────────────────
  INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
  VALUES (gen_random_uuid(), v_path_id, 'foundations', 'التأسيس',
    'المدخل النظري لعلم الأخلاق: النفس ومنازلها، والفضائل وطريق اكتسابها، عبر "تهذيب الأخلاق" لابن مسكويه — أول من نظّم علم الأخلاق الإسلامي في إطار فلسفي متكامل.',
    1, 'published')
  RETURNING id INTO v_stage1_id;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage1_id, 'usul-akhlaq-islamiyya', 'أصول الأخلاق الإسلامية',
    'قراءة موجَّهة في مباحث "تهذيب الأخلاق" لابن مسكويه: معرفة النفس، والفضائل، والمحبة والصداقة.',
    'فهم العلاقة بين معرفة النفس وتهذيب الخُلُق، والتمييز بين الفضيلة وأسبابها، ومعرفة منزلة المحبة والصداقة في بناء الشخصية الفاضلة.',
    'foundational', 1, 70,
    '["معرفة معنى الخُلُق وأثر معرفة النفس في تهذيبه","التمييز بين الفضيلة ومقابلها من الرذائل","معرفة منزلة المحبة والصداقة الصالحة في الإسلام"]'::jsonb,
    'published')
  RETURNING id INTO v_course1_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course1_id, 'الدروس', 1) RETURNING id INTO v_unit1_id;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit1_id, 'book', 'النفس وأثرها في الخُلُق',
    'من مباحث "تهذيب الأخلاق": الخُلُق حال للنفس داعية لأفعالها من غير فكر ولا رويّة، وينقسم إلى ما هو طبيعي (غريزي) وما هو مكتسب بالعادة والتدريب — وهذا الثاني هو محل التهذيب والتربية الذي يعنى به الكتاب.',
    1, 34, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit1_id, 'book', 'الفضائل وطريق اكتسابها',
    'من مباحث "تهذيب الأخلاق": الفضيلة وسط بين رذيلتي الإفراط والتفريط، وطريق اكتسابها العلم بحقيقتها أولاً ثم المجاهدة والتدرّب عليها عملاً حتى تصير مَلَكة راسخة في النفس، لا تكلّفاً عارضاً.',
    1, 33, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit1_id, 'book', 'المحبة والصداقة',
    'من مباحث "تهذيب الأخلاق": منزلة المحبة الصالحة والصداقة القائمة على الفضيلة لا المنفعة العابرة أو اللذة الزائلة، وأثرها في تكامل الفرد داخل مجتمعه.',
    1, 33, true, 'manual_confirm', 100, 3, 'published', true) RETURNING id INTO v_i3;

  -- ── المرحلة 2: البناء ─────────────────────────────────────────────────
  INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
  VALUES (gen_random_uuid(), v_path_id, 'building', 'البناء',
    'الأخلاق كما وردت في السنة النبوية الصحيحة، عبر أوائل أبواب "رياض الصالحين" للنووي — أشهر مجموع حديثي في الأخلاق والآداب وأكثرها تداولاً.',
    2, 'published')
  RETURNING id INTO v_stage2_id;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage2_id, 'akhlaq-sunnah', 'الأخلاق في السنة النبوية',
    'قراءة موجَّهة في أوائل أبواب "رياض الصالحين" للنووي: الإخلاص، والصبر، والصدق — بأدلتها الحديثية الصحيحة.',
    'معرفة حديث «إنما الأعمال بالنيات» ومكانته، والتمييز بين مراتب الصبر الثلاث، ومعرفة فضل الصدق وخطر الكذب.',
    'intermediate', 1, 70,
    '["معرفة حديث الإخلاص ومكانته الافتتاحية في السنة","التمييز بين مراتب الصبر (على الطاعة، عن المعصية، على الأقدار)","معرفة فضل الصدق في القول والعمل وخطر الكذب"]'::jsonb,
    'published')
  RETURNING id INTO v_course2_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course2_id, 'الدروس', 1) RETURNING id INTO v_unit2_id;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit2_id, 'book', 'الإخلاص وإحضار النية',
    'الباب الأول من "رياض الصالحين". قال ﷺ: «إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى» — وهو أول حديث افتتح به الإمام البخاري صحيحه (كتاب بدء الوحي)، وأخرجه الإمام مسلم أيضاً في صحيحه (كتاب الإمارة، حديث رقم 1907). جعله العلماء بمثابة الخطبة لكل مصنَّف علمي لعظم شأنه: مدار قبول الأعمال كلها على النية.',
    1, 34, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i4;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit2_id, 'book', 'الصبر',
    'من أوائل أبواب "رياض الصالحين" (يأتي بعد باب الإخلاص وباب التوبة). الصبر ثلاث مراتب عند أهل العلم: الصبر على الطاعة حتى تُؤدَّى، والصبر عن المعصية حتى تُترَك، والصبر على أقدار الله المؤلمة حتى تُرضى النفس بها.',
    1, 33, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i5;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit2_id, 'book', 'الصدق',
    'من أوائل أبواب "رياض الصالحين" (يأتي بعد باب الصبر). الصدق مطابقة القول للواقع في كل الأحوال، وهو خُلُق يهدي إلى البر والجنة، بخلاف الكذب الذي يهدي إلى الفجور والنار كما جاءت بذلك الأحاديث الصحيحة.',
    1, 33, true, 'manual_confirm', 100, 3, 'published', true) RETURNING id INTO v_i6;

  -- ── المرحلة 3: التوسع ─────────────────────────────────────────────────
  INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
  VALUES (gen_random_uuid(), v_path_id, 'advanced', 'التوسع',
    'التوازن بين إصلاح الدين والدنيا معاً، عبر "أدب الدنيا والدين" للماوردي — أوسع كتاب جمع بين آيات القرآن والحديث النبوي وحكم الحكماء في هذا الباب.',
    3, 'published')
  RETURNING id INTO v_stage3_id;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage3_id, 'tawazun-din-dunya', 'التوازن بين الدين والدنيا',
    'قراءة موجَّهة في أبواب مختارة من "أدب الدنيا والدين" للماوردي: فضل العقل، وأدب العلم، وأدب الدين.',
    'معرفة منزلة العقل وخطر اتباع الهوى، ومعرفة آداب طلب العلم عند الماوردي، ومعرفة أن صلاح الدنيا لا يتحقق إلا بصلاح الدين.',
    'advanced', 1, 70,
    '["معرفة فضل العقل ومنزلته وذم اتباع الهوى","معرفة آداب طالب العلم عند الماوردي","فهم أن صلاح الدنيا وصلاح الدين متلازمان لا متعارضان"]'::jsonb,
    'published')
  RETURNING id INTO v_course3_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course3_id, 'الدروس', 1) RETURNING id INTO v_unit3_id;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit3_id, 'book', 'فضل العقل وذم الهوى',
    'الباب الأول من "أدب الدنيا والدين": العقل مناط التكليف وأصل التمييز بين الحق والباطل، والهوى ميل النفس إلى ما تشتهي بلا ضابط شرعي ولا عقلي؛ اتباعه يُعمي عن الحق ويُصمّ عن سماع الحجة.',
    1, 34, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i7;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit3_id, 'book', 'أدب العلم',
    'الباب الثاني من "أدب الدنيا والدين": آداب طالب العلم ومعلمه، وفضل العلم على المال، وأن ثمرة العلم هي العمل به لا مجرد جمعه وحفظه.',
    1, 33, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i8;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit3_id, 'book', 'أدب الدين وصلاح الدنيا به',
    'من الباب الثالث ("أدب الدين") في "أدب الدنيا والدين": يقرر الماوردي أن صلاح أمر الدنيا (المعاش والمعاملات والسياسة) لا يتحقق استقراره إلا بصلاح الدين، فالدين أصل تنتظم به شؤون الدنيا لا نقيض لها.',
    1, 33, true, 'manual_confirm', 100, 3, 'published', true) RETURNING id INTO v_i9;

  -- ── الربط بالكتب الحقيقية الموجودة مسبقاً في مكتبة المنصة ───────────
  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_i1, 'تهذيب الأخلاق', 'أبو علي أحمد بن محمد بن يعقوب مسكويه', 'أساسية إلزامية', 'مبحث النفس والخُلُق', 'أول من نظّم علم الأخلاق الإسلامي في إطار فلسفي متكامل — موجود في مكتبة المنصة (/library/book-tahdhib-al-akhlaq)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i2, 'تهذيب الأخلاق', 'أبو علي أحمد بن محمد بن يعقوب مسكويه', 'أساسية إلزامية', 'مبحث الفضائل', 'أول من نظّم علم الأخلاق الإسلامي في إطار فلسفي متكامل — موجود في مكتبة المنصة (/library/book-tahdhib-al-akhlaq)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i3, 'تهذيب الأخلاق', 'أبو علي أحمد بن محمد بن يعقوب مسكويه', 'أساسية إلزامية', 'مبحث المحبة والصداقة', 'أول من نظّم علم الأخلاق الإسلامي في إطار فلسفي متكامل — موجود في مكتبة المنصة (/library/book-tahdhib-al-akhlaq)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i4, 'رياض الصالحين', 'الإمام يحيى بن شرف النووي', 'أساسية إلزامية', 'باب الإخلاص وإحضار النية (الباب الأول)', 'أشهر مجموع حديثي في الأخلاق والآداب وأكثرها تداولاً — موجود في مكتبة المنصة (/library/book-riyadh)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i5, 'رياض الصالحين', 'الإمام يحيى بن شرف النووي', 'أساسية إلزامية', 'باب الصبر', 'أشهر مجموع حديثي في الأخلاق والآداب وأكثرها تداولاً — موجود في مكتبة المنصة (/library/book-riyadh)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i6, 'رياض الصالحين', 'الإمام يحيى بن شرف النووي', 'أساسية إلزامية', 'باب الصدق', 'أشهر مجموع حديثي في الأخلاق والآداب وأكثرها تداولاً — موجود في مكتبة المنصة (/library/book-riyadh)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i7, 'أدب الدنيا والدين', 'أبو الحسن علي بن محمد الماوردي', 'مادة مساندة', 'الباب الأول: فضل العقل وذم الهوى', 'أوسع كتاب جمع آيات القرآن والحديث وحكم الحكماء في التوازن بين الدين والدنيا — موجود في مكتبة المنصة (/library/book-adab-dunya-din)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i8, 'أدب الدنيا والدين', 'أبو الحسن علي بن محمد الماوردي', 'مادة مساندة', 'الباب الثاني: أدب العلم', 'أوسع كتاب جمع آيات القرآن والحديث وحكم الحكماء في التوازن بين الدين والدنيا — موجود في مكتبة المنصة (/library/book-adab-dunya-din)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i9, 'أدب الدنيا والدين', 'أبو الحسن علي بن محمد الماوردي', 'مادة مساندة', 'الباب الثالث: أدب الدين', 'أوسع كتاب جمع آيات القرآن والحديث وحكم الحكماء في التوازن بين الدين والدنيا — موجود في مكتبة المنصة (/library/book-adab-dunya-din)', 'مكتبة المجلس العلمي');

  UPDATE learning_paths SET status = 'published', total_sessions = 9, updated_at = now()
  WHERE id = v_path_id;

  RAISE NOTICE 'akhlaq: path_id=%, stages=[%,%,%], courses=[%,%,%]',
    v_path_id, v_stage1_id, v_stage2_id, v_stage3_id, v_course1_id, v_course2_id, v_course3_id;
END $$;
