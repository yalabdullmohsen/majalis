-- ═══════════════════════════════════════════════════════════════════════════
-- learning_path_tawheed_aqsam_v1.sql
--
-- سياق: Phase 3 — باب عقدي إضافي بنمط "مصطلح الحديث" (تفصيل موضوع-فموضوع
-- داخل مسار موجود فعلاً لكنه ضحل). مسار `tawheed` كان له مرحلة واحدة
-- فقط ("كتاب التوحيد بعمق") بعنصر تعليمي واحد ("شرح كتاب التوحيد" مربوط
-- بكتاب التوحيد لمحمد بن عبد الوهاب) رغم `total_sessions=16`.
--
-- هذا الملف يضيف مرحلة "التأسيس" جديدة **قبل** المرحلة الموجودة (أُعيد
-- ترقيمها sort_order 1←2) بمقرر "أقسام التوحيد الثلاثة" — الأساس
-- النظري الذي يجب فهمه قبل الخوض في تفاصيل كتاب التوحيد نفسه (كتاب ابن
-- عبد الوهاب منظَّم بأبواب لنواقض/مخالفات التوحيد لا بعرض نظري منهجي
-- للأقسام الثلاثة؛ العقيدة الواسطية لابن تيمية هي النص الذي يُنظِّم هذا
-- التقسيم نظرياً بوضوح — كتاب مختلف، غرض تعليمي مختلف، لا تكرار).
--
-- التحقق العلمي (WebSearch مباشر هذه الجلسة قبل الكتابة):
--   • أقسام التوحيد الثلاثة (الربوبية/الألوهية/الأسماء والصفات) وتعريف
--     كل قسم — مؤكَّد عبر دار الإفتاء المصرية وislamweb وموقع ابن باز
--     ومصادر متعددة متطابقة، بما فيها أن الأقسام الثلاثة متلازمة لا
--     يُستغنى ببعضها عن بعض.
--   • كل الآيات مستخرَجة حرفياً من الملفات المحلية: الفاتحة:2 (لا
--     الفاتحة:1 كما ورد بصياغة فضفاضة في بعض نتائج البحث — تحقّقتُ من
--     رقم الآية الدقيق مباشرة من الملف، البسملة تُعَدّ آية 1 في نظام
--     الترقيم المعتمَد هنا فتكون "الحمد لله رب العالمين" آية 2)، النحل:36،
--     الأعراف:180.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_path_id    uuid;
  v_stage_id   uuid;
  v_course_id  uuid;
  v_unit_id    uuid;
  v_i1 uuid; v_i2 uuid; v_i3 uuid;
BEGIN
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'tawheed';
  IF v_path_id IS NULL THEN RAISE EXCEPTION 'مسار tawheed غير موجود'; END IF;

  IF EXISTS (SELECT 1 FROM courses WHERE slug = 'tawheed-aqsam-thalatha') THEN
    RAISE NOTICE 'مُنجَز مسبقاً — تخطّي';
    RETURN;
  END IF;

  -- إفساح مكان لمرحلة "التأسيس" الجديدة قبل "كتاب التوحيد بعمق" الموجودة
  UPDATE path_stages SET sort_order = 2 WHERE path_id = v_path_id AND slug = 'kitab-tawheed-deep';

  INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
  VALUES (gen_random_uuid(), v_path_id, 'foundations', 'التأسيس',
    'الأساس النظري لعلم التوحيد: أقسامه الثلاثة (الربوبية، والألوهية، والأسماء والصفات) عبر "العقيدة الواسطية" لابن تيمية — النص الذي يُنظِّم هذا التقسيم بوضوح منهجي قبل الخوض في تفاصيل كتاب التوحيد.',
    1, 'published')
  RETURNING id INTO v_stage_id;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage_id, 'tawheed-aqsam-thalatha', 'أقسام التوحيد الثلاثة',
    'قراءة موجَّهة في الأقسام الثلاثة للتوحيد كما نظّمها ابن تيمية في العقيدة الواسطية: الربوبية، والألوهية، والأسماء والصفات.',
    'معرفة تعريف كل قسم من أقسام التوحيد الثلاثة بدليله، ومعرفة العلاقة التلازمية بينها.',
    'foundational', 1, 70,
    '["معرفة تعريف توحيد الربوبية بدليله القرآني","معرفة تعريف توحيد الألوهية بدليله القرآني","معرفة تعريف توحيد الأسماء والصفات بدليله القرآني","معرفة أن الأقسام الثلاثة متلازمة لا يكمل التوحيد إلا باجتماعها"]'::jsonb,
    'published')
  RETURNING id INTO v_course_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'توحيد الربوبية',
    'إفراد الله سبحانه بأفعاله: الخلق، والتدبير، والملك، والهيمنة على الكون — فلا خالق ولا مدبِّر لشؤون الخلق إلا هو. قال تعالى: ﴿ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ﴾ (سورة الفاتحة: 2)، أي مالكهم ومدبِّر شؤونهم. هذا القسم أقرّ به عامة المشركين قديماً، ولذلك وحده لا يُدخل صاحبه في الإسلام حتى يقترن بتوحيد الألوهية.',
    1, 34, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'توحيد الألوهية',
    'إفراد الله سبحانه بالعبادة على اختلاف أنواعها: الصلاة، والصوم، والدعاء، والنذر، والذبح، والاستعانة، وغيرها — فلا يُصرَف شيء منها لغيره سبحانه. قال تعالى: ﴿وَلَقَدْ بَعَثْنَا فِى كُلِّ أُمَّةٍ رَّسُولًا أَنِ ٱعْبُدُوا۟ ٱللَّهَ وَٱجْتَنِبُوا۟ ٱلطَّٰغُوتَ﴾ (سورة النحل: 36). هذا القسم هو محور دعوة جميع الرسل، وهو الذي خالف فيه المشركون رغم إقرارهم بتوحيد الربوبية.',
    1, 33, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'توحيد الأسماء والصفات',
    'إثبات ما أثبته الله لنفسه في كتابه أو أثبته له رسوله ﷺ في سنته الصحيحة من أسماء وصفات، على الوجه اللائق بجلاله سبحانه، من غير تحريف لمعناها ولا تعطيل لها ولا تكييف لكيفيتها ولا تمثيل بصفات المخلوقين. قال تعالى: ﴿وَلِلَّهِ ٱلْأَسْمَآءُ ٱلْحُسْنَىٰ فَٱدْعُوهُ بِهَا وَذَرُوا۟ ٱلَّذِينَ يُلْحِدُونَ فِىٓ أَسْمَٰٓئِهِۦ﴾ (سورة الأعراف: 180). الأقسام الثلاثة متلازمة متكافلة، ولا يكمل توحيد العبد إلا باجتماعها كلها.',
    1, 33, true, 'manual_confirm', 100, 3, 'published', true) RETURNING id INTO v_i3;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_i1, 'العقيدة الواسطية', 'شيخ الإسلام ابن تيمية', 'أساسية إلزامية', 'مبحث توحيد الربوبية', 'النص الذي يُنظِّم أقسام التوحيد الثلاثة نظرياً بوضوح منهجي، بخلاف كتاب التوحيد المنظَّم بأبواب النواقض العملية — لا تكرار محتوى، غرض تعليمي مختلف. موجود في مكتبة المنصة (/library/book-wasitiyyah)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i2, 'العقيدة الواسطية', 'شيخ الإسلام ابن تيمية', 'أساسية إلزامية', 'مبحث توحيد الألوهية', 'موجود في مكتبة المنصة (/library/book-wasitiyyah)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i3, 'العقيدة الواسطية', 'شيخ الإسلام ابن تيمية', 'أساسية إلزامية', 'مبحث توحيد الأسماء والصفات', 'موجود في مكتبة المنصة (/library/book-wasitiyyah)', 'مكتبة المجلس العلمي');

  UPDATE learning_paths SET total_sessions = total_sessions + 3, updated_at = now() WHERE id = v_path_id;

  RAISE NOTICE 'tawheed foundations: stage_id=%, course_id=%', v_stage_id, v_course_id;
END $$;
