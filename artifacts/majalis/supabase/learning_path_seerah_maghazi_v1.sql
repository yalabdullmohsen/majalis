-- ═══════════════════════════════════════════════════════════════════════════
-- learning_path_seerah_maghazi_v1.sql
--
-- سياق: Phase 3 — باب سيرة إضافي بنفس نمط "مصطلح الحديث"/"أقسام التوحيد
-- الثلاثة" (تفصيل موضوع-فموضوع داخل مسار موجود فعلاً لكنه ضحل). مسار
-- `seerah` كان له مرحلتان فقط ("التأسيس"، "التوسع") بعنصر تعليمي واحد لكل
-- منهما ("السيرة النبوية"، "السيرة النبوية المعمقة") بلا أي `course_books`
-- مربوط إطلاقاً (تحقّقتُ مباشرة: كلا العنصرين `book_title = null`) رغم
-- `total_sessions=30`.
--
-- هذا الملف يضيف مرحلة ثالثة "الغزوات الكبرى" (sort_order=3، بعد
-- "التوسع") بمقرر "الغزوات الكبرى في السيرة النبوية" — 4 عناصر تعليمية
-- لأبرز أربع غزوات، كل عنصر مربوط عبر course_books بـ"الرحيق المختوم"
-- للمباركفوري (`book-raheeq`، موجود مسبقاً في library-catalog.ts، حائز
-- جائزة رابطة العالم الإسلامي الأولى في السيرة النبوية).
--
-- التحقق العلمي (WebSearch مباشر هذه الجلسة قبل الكتابة):
--   • تحقّقتُ أن الغزوات الأربع فصول مستقلة فعلاً في فهرس الرحيق المختوم
--     (لا افتراض): "غزوة بدر الكبرى" (shamela.ws/book/9820/181)، "غزوة
--     أحد" (shamela.ws/book/9820/220)، "غزوة الأحزاب" (shamela.ws/
--     book/9820/271، وتُعرف أيضاً بغزوة الخندق)، "غزوة فتح مكة"
--     (shamela.ws/book/9820/355) — كلها عناوين فصول فعلية في الكتاب.
--   • كل الآيات مستخرَجة حرفياً من الملفات المحلية public/data/quran/
--     surah-*.json: آل عمران:123 (بدر)، آل عمران:165 (أحد)، الأحزاب:9
--     (الخندق/الأحزاب)، النصر:1-3 (فتح مكة — سورة النصر مرتبطة تاريخياً
--     بفتح مكة في التفسير المأثور، لا سورة الفتح رقم 48 التي نزلت بعد
--     صلح الحديبية قبل الفتح بوقت، تمييز تحقَّق منه قبل الكتابة لتفادي
--     خلط شائع بين السورتين).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_path_id    uuid;
  v_stage_id   uuid;
  v_course_id  uuid;
  v_unit_id    uuid;
  v_i1 uuid; v_i2 uuid; v_i3 uuid; v_i4 uuid;
BEGIN
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'seerah';
  IF v_path_id IS NULL THEN RAISE EXCEPTION 'مسار seerah غير موجود'; END IF;

  IF EXISTS (SELECT 1 FROM courses WHERE slug = 'seerah-maghazi-kubra') THEN
    RAISE NOTICE 'مُنجَز مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
  VALUES (gen_random_uuid(), v_path_id, 'maghazi', 'الغزوات الكبرى',
    'قراءة موجَّهة في أبرز أربع غزوات في السيرة النبوية عبر "الرحيق المختوم" للمباركفوري: بدر الكبرى، وأحد، والأحزاب (الخندق)، وفتح مكة.',
    3, 'published')
  RETURNING id INTO v_stage_id;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage_id, 'seerah-maghazi-kubra', 'الغزوات الكبرى في السيرة النبوية',
    'قراءة موجَّهة في أربع غزوات مفصلية من غزوات النبي ﷺ كما فصَّلها المباركفوري في الرحيق المختوم.',
    'معرفة سياق وأحداث ونتائج كل غزوة من الغزوات الأربع الكبرى، مع دليلها القرآني.',
    'intermediate', 3, 70,
    '["معرفة سياق وأحداث غزوة بدر الكبرى ودليلها القرآني","معرفة سياق وأحداث غزوة أحد والعبرة المستفادة منها","معرفة خطة الدفاع في غزوة الأحزاب (الخندق) ودليلها القرآني","معرفة أحداث فتح مكة وربطها بسورة النصر"]'::jsonb,
    'published')
  RETURNING id INTO v_course_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'غزوة بدر الكبرى',
    'أول معركة فاصلة بين المسلمين والمشركين، السنة الثانية للهجرة، خرج فيها النبي ﷺ في نحو ثلاثمائة وبضعة عشر رجلاً لاعتراض قافلة قريش، فانتهى الأمر بمعركة كبرى انتصر فيها المسلمون رغم قلة عددهم وعتادهم. قال تعالى: ﴿وَلَقَدْ نَصَرَكُمُ ٱللَّهُ بِبَدْرٍ وَأَنتُمْ أَذِلَّةٌ فَٱتَّقُوا۟ ٱللَّهَ لَعَلَّكُمْ تَشْكُرُونَ﴾ (سورة آل عمران: 123).',
    1, 25, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'غزوة أحد',
    'السنة الثالثة للهجرة، خرجت قريش لأخذ ثأر بدر، وكانت البداية لصالح المسلمين ثم انقلبت الدائرة حين خالف الرماة أمر النبي ﷺ بالثبات على الجبل طمعاً في الغنيمة، فاستُدرَك المسلمون وأصيبوا. قال تعالى معاتباً: ﴿أَوَلَمَّآ أَصَٰبَتْكُم مُّصِيبَةٌ قَدْ أَصَبْتُم مِّثْلَيْهَا قُلْتُمْ أَنَّىٰ هَٰذَا قُلْ هُوَ مِنْ عِندِ أَنفُسِكُمْ﴾ (سورة آل عمران: 165).',
    1, 25, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'غزوة الأحزاب (الخندق)',
    'السنة الخامسة للهجرة، تحالفت قريش وغطفان واليهود ضد المدينة، فاقترح سلمان الفارسي رضي الله عنه حفر خندق حول الجهة المكشوفة من المدينة — خطة لم تعرفها العرب من قبل — فعجز الأحزاب عن اقتحامها بعد حصار دام نحو ثلاثة أسابيع، ثم أرسل الله ريحاً شديدة بددت جموعهم. قال تعالى: ﴿يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱذْكُرُوا۟ نِعْمَةَ ٱللَّهِ عَلَيْكُمْ إِذْ جَآءَتْكُمْ جُنُودٌ فَأَرْسَلْنَا عَلَيْهِمْ رِيحًا وَجُنُودًا لَّمْ تَرَوْهَا﴾ (سورة الأحزاب: 9).',
    1, 25, true, 'manual_confirm', 100, 3, 'published', true) RETURNING id INTO v_i3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'فتح مكة',
    'السنة الثامنة للهجرة، دخل النبي ﷺ مكة فاتحاً بعد نقض قريش لعهد الحديبية، بجيش من عشرة آلاف مقاتل، ودخلها بلا قتال يُذكر، وعفا عن أهلها عفواً عاماً رغم ما فعلوه به وبأصحابه من قبل، ودخل الناس في دين الله أفواجاً. قال تعالى: ﴿إِذَا جَآءَ نَصْرُ ٱللَّهِ وَٱلْفَتْحُ * وَرَأَيْتَ ٱلنَّاسَ يَدْخُلُونَ فِى دِينِ ٱللَّهِ أَفْوَاجًا * فَسَبِّحْ بِحَمْدِ رَبِّكَ وَٱسْتَغْفِرْهُ إِنَّهُۥ كَانَ تَوَّابًۢا﴾ (سورة النصر: 1-3).',
    1, 25, true, 'manual_confirm', 100, 4, 'published', true) RETURNING id INTO v_i4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_i1, 'الرحيق المختوم', 'الشيخ صفي الرحمن المباركفوري', 'أساسية إلزامية', 'فصل غزوة بدر الكبرى', 'حائز جائزة رابطة العالم الإسلامي الأولى في السيرة النبوية، أسلوب سلس محقق. موجود في مكتبة المنصة (/library/book-raheeq)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i2, 'الرحيق المختوم', 'الشيخ صفي الرحمن المباركفوري', 'أساسية إلزامية', 'فصل غزوة أحد', 'موجود في مكتبة المنصة (/library/book-raheeq)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i3, 'الرحيق المختوم', 'الشيخ صفي الرحمن المباركفوري', 'أساسية إلزامية', 'فصل غزوة الأحزاب', 'موجود في مكتبة المنصة (/library/book-raheeq)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i4, 'الرحيق المختوم', 'الشيخ صفي الرحمن المباركفوري', 'أساسية إلزامية', 'فصل غزوة فتح مكة', 'موجود في مكتبة المنصة (/library/book-raheeq)', 'مكتبة المجلس العلمي');

  UPDATE learning_paths SET total_sessions = total_sessions + 4, updated_at = now() WHERE id = v_path_id;

  RAISE NOTICE 'seerah maghazi: stage_id=%, course_id=%', v_stage_id, v_course_id;
END $$;
