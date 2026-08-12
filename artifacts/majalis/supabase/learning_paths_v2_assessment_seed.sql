-- ═══════════════════════════════════════════════════════════════════════════
-- تقييم تجريبي واحد لإثبات مسار الأداء الآمن كاملًا (API + واجهة + شهادة)
-- ═══════════════════════════════════════════════════════════════════════════
-- 5 أسئلة أساسية جدًا عن "الأصول الثلاثة" — أشهر متن تأسيسي في العقيدة
-- (المسائل الثلاث التي يجب على كل مسلم معرفتها: معرفة الله، معرفة دينه
-- الإسلام بالأدلة، معرفة نبيه محمد ﷺ)، وهي معلومات أساسية متفق عليها
-- بإجماع لا خلاف فيه، لا نازلة فقهية ولا مسألة خلافية.
--
-- بموجب القاعدة الأولى الصريحة (لا محتوى شرعي مولَّد يُعرض كمعتمد): كل سؤال
-- يُدرَج بحالة is_approved = false (القيمة الافتراضية في المخطط أصلًا) —
-- لن يظهر لأي مستخدم نهائي أو يُحتسَب في أي تقييم حتى تُراجَع وتُعتمَد صراحةً
-- من مراجع بشري. هذا الملف لا يغيّر الحالة الافتراضية لأي سؤال.
--
-- العنصر أُضيف اختياريًا (is_required = false) لمقرر "نواقض الإسلام ومدخل
-- العقيدة" الموجود فعلاً ضمن مسار العقيدة — لا يُغيّر شرط اجتياز ذلك المقرر
-- (يبقى بلا اختبار إلزامي كما كان)، فقط يضيف تمرين مراجعة اختياري.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_course_id UUID;
  v_unit_id UUID;
  v_assessment_id UUID;
  v_item_id UUID;
BEGIN
  SELECT c.id INTO v_course_id
  FROM courses c
  JOIN path_stages ps ON ps.id = c.stage_id
  JOIN learning_paths lp ON lp.id = ps.path_id
  WHERE lp.slug = 'aqeedah' AND c.slug = 'nawaqid-islam';

  IF v_course_id IS NULL THEN
    RAISE NOTICE 'مقرر nawaqid-islam غير موجود — تخطّي زرع التقييم التجريبي';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM assessments WHERE scope_type = 'course' AND course_id = v_course_id) THEN
    RAISE NOTICE 'يوجد تقييم مسبقًا لهذا المقرر — تخطّي (idempotent)';
    RETURN;
  END IF;

  INSERT INTO assessments (scope_type, course_id, title, pass_percentage, max_attempts, status)
  VALUES ('course', v_course_id, 'اختبر نفسك: الأصول الثلاثة', 70, NULL, 'published')
  RETURNING id INTO v_assessment_id;

  INSERT INTO assessment_questions (assessment_id, question_type, question_text, options, correct_answer, explanation, explanation_source, points, sort_order, source_bank, is_approved) VALUES
  (v_assessment_id, 'mcq', 'ما هي المسائل الثلاث التي أوجب الله على كل مسلم معرفتها والعمل بها كما ورد في متن الأصول الثلاثة؟',
    '["معرفة الله ومعرفة دينه ومعرفة نبيه محمد ﷺ","معرفة القرآن والسنة والإجماع","معرفة أركان الإسلام الخمسة","معرفة أركان الإيمان الستة"]'::jsonb,
    '{"value":"معرفة الله ومعرفة دينه ومعرفة نبيه محمد ﷺ"}'::jsonb,
    'هذا هو صريح مطلع متن الأصول الثلاثة للشيخ محمد بن عبد الوهاب.', 'الأصول الثلاثة', 1, 1, 'new', false),
  (v_assessment_id, 'true_false', 'التوحيد عند أهل السنة والجماعة ثلاثة أقسام: توحيد الربوبية، وتوحيد الألوهية، وتوحيد الأسماء والصفات.',
    '["صحيح","خطأ"]'::jsonb, '{"value":"صحيح"}'::jsonb,
    'هذا تقسيم مشهور متفق عليه عند أهل السنة، مذكور في متون العقيدة التأسيسية.', 'كتب العقيدة التأسيسية', 1, 2, 'new', false),
  (v_assessment_id, 'mcq', 'من مؤلف متن "الأصول الثلاثة"؟',
    '["الإمام النووي","محمد بن عبد الوهاب","ابن تيمية","ابن حجر العسقلاني"]'::jsonb,
    '{"value":"محمد بن عبد الوهاب"}'::jsonb,
    'الأصول الثلاثة من مؤلفات الشيخ محمد بن عبد الوهاب رحمه الله.', 'الأصول الثلاثة', 1, 3, 'new', false),
  (v_assessment_id, 'mcq', 'أعظم ما أمر الله به هو التوحيد، وأعظم ما نهى عنه هو:',
    '["الكذب","الشرك","الغيبة","الظلم"]'::jsonb,
    '{"value":"الشرك"}'::jsonb,
    'وهذا مضمون ما استُدل به في مطلع الأصول الثلاثة من قوله تعالى: وَاعْبُدُوا اللَّهَ وَلَا تُشْرِكُوا بِهِ شَيْئًا.', 'الأصول الثلاثة', 1, 4, 'new', false),
  (v_assessment_id, 'true_false', 'معرفة النبي محمد ﷺ من المسائل الثلاث تشمل معرفة نسبه وأنه رسول الله إلى جميع الخلق.',
    '["صحيح","خطأ"]'::jsonb, '{"value":"صحيح"}'::jsonb,
    'مطابق لما ورد في متن الأصول الثلاثة عند بيان المسألة الثالثة.', 'الأصول الثلاثة', 1, 5, 'new', false);

  -- عنصر تعلم اختياري (غير إلزامي) يربط هذا التقييم بالمقرر — لا يُغيّر شرط الاجتياز
  SELECT id INTO v_unit_id FROM course_units WHERE course_id = v_course_id ORDER BY sort_order LIMIT 1;
  IF v_unit_id IS NOT NULL THEN
    INSERT INTO learning_items (unit_id, item_type, title, session_estimate, weight, is_required, completion_method, assessment_id, sort_order, status)
    VALUES (v_unit_id, 'assessment', 'اختبر نفسك: الأصول الثلاثة', 1, 0, false, 'assessment_pass', v_assessment_id, 99, 'published')
    RETURNING id INTO v_item_id;
  END IF;

  RAISE NOTICE 'زُرع تقييم تجريبي % بعنصر تعلم % — 5 أسئلة بحالة is_approved=false (تحتاج مراجعة بشرية قبل ظهورها لمستخدم نهائي)', v_assessment_id, v_item_id;
END $$;
