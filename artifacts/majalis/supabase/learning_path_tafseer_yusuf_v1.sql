-- ═══════════════════════════════════════════════════════════════════════════
-- learning_path_tafseer_yusuf_v1.sql
--
-- سياق: Phase 3 — باب تفسيري إضافي بنفس نمط "الغزوات الكبرى"/"أقسام
-- التوحيد الثلاثة" (تفصيل موضوع-فموضوع داخل مسار موجود فعلاً لكنه ضحل).
-- مسار `tafseer` له مرحلة "تفسير سور مختارة" (sort_order=2) بمقررين
-- (tafsir-kahf، tafsir-nahl) — **تحقّقتُ مباشرة أن كليهما بلا أي
-- course_books مربوط إطلاقاً** (book_title=null لكل عناصرهما) رغم
-- total_sessions=35.
--
-- هذا الملف يضيف مقرراً ثالثاً "تفسير سورة يوسف" داخل نفس المرحلة
-- الموجودة "تفسير سور مختارة" (sort_order=3 ضمنها) — أول مقرر تفسيري في
-- هذا المسار يُربط فعلياً بكتاب حقيقي عبر course_books: تفسير ابن كثير
-- (`book-tafsir-ibnkathir`، موجود مسبقاً في المكتبة)، لكونه التفسير
-- الأشهر في السرد القصصي وأنسبها لسورة يوسف ذات البناء القصصي المتصل.
--
-- البنية: 4 عناصر تتبع البناء الدرامي المتصل لقصة يوسف عليه السلام كما
-- هو مقرَّر في كتب التفسير (رؤياه وحسد إخوته ← فتنة امرأة العزيز ←
-- محنة السجن وتأويل الرؤى ← اللقاء وعفوه عن إخوته)، تحقّقتُ عبر
-- WebSearch أن تفسير ابن كثير يغطي هذه الأقسام الأربعة فعلاً قبل الكتابة.
--
-- التحقق العلمي: كل الآيات مستخرَجة حرفياً من public/data/quran/
-- surah-012.json (لا من الذاكرة): يوسف:4 (الرؤيا)، يوسف:18 (كذب
-- الإخوة)، يوسف:24 (برهان ربه)، يوسف:33 (السجن أحب إلي)، يوسف:92 (لا
-- تثريب عليكم اليوم).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_path_id    uuid;
  v_stage_id   uuid;
  v_course_id  uuid;
  v_unit_id    uuid;
  v_i1 uuid; v_i2 uuid; v_i3 uuid; v_i4 uuid;
BEGIN
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'tafseer';
  IF v_path_id IS NULL THEN RAISE EXCEPTION 'مسار tafseer غير موجود'; END IF;

  SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'surahs';
  IF v_stage_id IS NULL THEN RAISE EXCEPTION 'مرحلة surahs غير موجودة داخل tafseer'; END IF;

  IF EXISTS (SELECT 1 FROM courses WHERE slug = 'tafsir-yusuf') THEN
    RAISE NOTICE 'مُنجَز مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage_id, 'tafsir-yusuf', 'تفسير سورة يوسف',
    'قراءة موجَّهة في سورة يوسف عبر تفسير ابن كثير، تتبُّع البناء القصصي المتصل من الرؤيا إلى اللقاء والعفو.',
    'معرفة الأحداث الكبرى لقصة يوسف عليه السلام بترتيبها، مع دليلها القرآني والعبرة المستفادة من كل مرحلة.',
    'intermediate', 3, 70,
    '["معرفة رؤيا يوسف وسبب حسد إخوته له","معرفة قصة فتنة امرأة العزيز وعصمة يوسف","معرفة محنة السجن وتأويل يوسف للرؤى","معرفة قصة اللقاء بإخوته وعفوه عنهم"]'::jsonb,
    'published')
  RETURNING id INTO v_course_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'رؤيا يوسف وحسد إخوته',
    'رأى يوسف عليه السلام في منامه أحد عشر كوكباً والشمس والقمر ساجدين له، فحذَّره أبوه يعقوب من قصِّها على إخوته خشية كيدهم. حسده إخوته لمكانته عند أبيه، فأجمعوا على إلقائه في الجُبِّ ثم جاءوا أباهم بقميصه ملطخاً بدم كذب زاعمين أن الذئب أكله. قال تعالى: ﴿إِذْ قَالَ يُوسُفُ لِأَبِيهِ يَٰٓأَبَتِ إِنِّى رَأَيْتُ أَحَدَ عَشَرَ كَوْكَبًا وَٱلشَّمْسَ وَٱلْقَمَرَ رَأَيْتُهُمْ لِى سَٰجِدِينَ﴾ (سورة يوسف: 4). وقال تعالى في كذب الإخوة: ﴿وَجَآءُو عَلَىٰ قَمِيصِهِۦ بِدَمٍ كَذِبٍ ۚ قَالَ بَلْ سَوَّلَتْ لَكُمْ أَنفُسُكُمْ أَمْرًا ۖ فَصَبْرٌ جَمِيلٌ﴾ (سورة يوسف: 18).',
    1, 25, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'فتنة امرأة العزيز',
    'بيع يوسف بثمن بخس في مصر، فاشتراه عزيز مصر وأكرم مثواه. لما بلغ أشُدَّه راودته امرأة العزيز عن نفسه وهمَّت به، لكن الله عصمه فرأى برهان ربه فامتنع، وهي قصة تُظهر عصمة الأنبياء عن الفواحش رغم توفر أسبابها. قال تعالى: ﴿وَلَقَدْ هَمَّتْ بِهِۦ وَهَمَّ بِهَا لَوْلَآ أَن رَّءَا بُرْهَٰنَ رَبِّهِۦ ۚ كَذَٰلِكَ لِنَصْرِفَ عَنْهُ ٱلسُّوٓءَ وَٱلْفَحْشَآءَ ۚ إِنَّهُۥ مِنْ عِبَادِنَا ٱلْمُخْلَصِينَ﴾ (سورة يوسف: 24).',
    1, 25, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'محنة السجن وتأويل الرؤى',
    'آثر يوسف السجن على معصية ربه، فسُجن سنين، وفي السجن أوَّل رؤيا صاحبيه، ثم رؤيا الملك (البقرات السبع السمان والعجاف)، فتبيَّن للملك براءته وعلمه فأخرجه وولاه على خزائن الأرض. قال تعالى على لسان يوسف: ﴿قَالَ رَبِّ ٱلسِّجْنُ أَحَبُّ إِلَىَّ مِمَّا يَدْعُونَنِىٓ إِلَيْهِ وَإِلَّا تَصْرِفْ عَنِّى كَيْدَهُنَّ أَصْبُ إِلَيْهِنَّ وَأَكُن مِّنَ ٱلْجَٰهِلِينَ﴾ (سورة يوسف: 33).',
    1, 25, true, 'manual_confirm', 100, 3, 'published', true) RETURNING id INTO v_i3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'اللقاء والعفو عن الإخوة',
    'اضطرت المجاعة إخوة يوسف للقدوم إلى مصر طلباً للميرة، فعرفهم يوسف ولم يعرفوه، حتى دبَّر إبقاء أخيه بنيامين عنده، فبلغ الأمر يعقوب فازداد حزنه حتى ابيضَّت عيناه من الحزن، ثم كان اللقاء الكبير حين عرَّف يوسف نفسه لإخوته وعفا عنهم عفواً كاملاً بلا تثريب ولا تأنيب. قال تعالى: ﴿قَالَ لَا تَثْرِيبَ عَلَيْكُمُ ٱلْيَوْمَ يَغْفِرُ ٱللَّهُ لَكُمْ وَهُوَ أَرْحَمُ ٱلرَّٰحِمِينَ﴾ (سورة يوسف: 92).',
    1, 25, true, 'manual_confirm', 100, 4, 'published', true) RETURNING id INTO v_i4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_i1, 'تفسير ابن كثير', 'الإمام ابن كثير', 'أساسية إلزامية', 'تفسير سورة يوسف — الآيات 1 إلى 18 (الرؤيا وحسد الإخوة)', 'التفسير الأشهر في السرد القصصي، أنسب لسورة يوسف ذات البناء القصصي المتصل. موجود في مكتبة المنصة (/library/book-tafsir-ibnkathir)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i2, 'تفسير ابن كثير', 'الإمام ابن كثير', 'أساسية إلزامية', 'تفسير سورة يوسف — الآيات 21 إلى 34 (فتنة امرأة العزيز)', 'موجود في مكتبة المنصة (/library/book-tafsir-ibnkathir)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i3, 'تفسير ابن كثير', 'الإمام ابن كثير', 'أساسية إلزامية', 'تفسير سورة يوسف — الآيات 35 إلى 57 (السجن وتأويل الرؤى)', 'موجود في مكتبة المنصة (/library/book-tafsir-ibnkathir)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i4, 'تفسير ابن كثير', 'الإمام ابن كثير', 'أساسية إلزامية', 'تفسير سورة يوسف — الآيات 88 إلى 101 (اللقاء والعفو)', 'موجود في مكتبة المنصة (/library/book-tafsir-ibnkathir)', 'مكتبة المجلس العلمي');

  UPDATE learning_paths SET total_sessions = total_sessions + 4, updated_at = now() WHERE id = v_path_id;

  RAISE NOTICE 'tafseer yusuf: stage_id=%, course_id=%', v_stage_id, v_course_id;
END $$;
