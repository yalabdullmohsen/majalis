-- ═══════════════════════════════════════════════════════════════════════════
-- learning_path_uloom_quran_v1.sql
--
-- سياق: مسار "uloom-quran" (علوم القرآن) أحد سبعة مسارات `status='draft'`
-- بلا محتوى إطلاقاً (راجع learning_paths_draft_empty_v1.sql للقرار المعماري
-- الذي أخفاها من /learning/paths دون حذف). له مرحلة placeholder وحيدة
-- "قيد الإعداد" (pending-content) بمقرر وحيد "محتوى قيد المراجعة العلمية"
-- بوصف صريح "لم تُضَف بعد دروس أو كتب حقيقية معتمدة لهذا المقرر" — يُحذف
-- هذا الملف الـplaceholder (CASCADE يحذف مقرره تلقائياً) ويستبدله بثلاث
-- مراحل حقيقية، لأن إبقاءه بجوار محتوى حقيقي يصبح تصريحاً كاذباً.
--
-- اختيار هذا المسار تحديداً (من السبعة الفارغين) لأنه الوحيد بمطابقة 1:1
-- تامة بين اسم المسار وتصنيف حقيقي جاهز في src/lib/library-catalog.ts
-- ("علوم القرآن" — 4 كتب) + كتاب خامس وثيق الصلة من تصنيف "آداب"
-- ("التبيان في آداب حملة القرآن" للنووي، مقدَّم منطقياً على الثلاثة الباقية
-- لأنه عن آداب حامل القرآن لا تقنيات العلم ذاته).
--
-- البنية: 3 مراحل (نفس تسمية aqeedah/usool-fiqh: التأسيس/البناء/التوسع)،
-- 3 مقررات، 11 عنصراً تعليمياً — كل عنصر مربوط بكتاب حقيقي عبر course_books.
--
-- التحقق العلمي (WebSearch مباشر هذه الجلسة لكل بند قبل كتابته، لا من
-- الذاكرة):
--   • أبواب "التبيان" العشرة للنووي: تحقّقت عبر ويكيبيديا العربية ونتائج
--     بحث متعددة متطابقة (فضيلة التلاوة، ترجيح القراءة، إكرام أهل القرآن،
--     آداب المعلم والمتعلم، آداب حامله، آداب القراءة [معظم الكتاب]، آداب
--     الناس جميعاً، آيات مستحبة، كتابة القرآن، ضبط الأسماء).
--   • "الإتقان" للسيوطي: 80 نوعاً، من أشهرها أسباب النزول والمكي والمدني
--     والناسخ والمنسوخ — تحقّقتُ عبر ويكيبيديا العربية.
--   • "البرهان" للزركشي: 47 نوعاً تشمل أسباب النزول، القراءات، إعجاز
--     القرآن، الناسخ والمنسوخ، إعراب القرآن، المتشابه، فواتح السور،
--     المكي والمدني — تحقّقتُ عبر ويكيبيديا العربية.
--   • "مناهل العرفان" للزرقاني: مباحثه تشمل نزول القرآن، أسباب النزول،
--     الأحرف السبعة، المكي والمدني، جمع القرآن، ترتيب الآي والسور، كتابة
--     القرآن ورسمه، القراءات، الترجمة، النسخ، المحكم والمتشابه، إعجاز
--     القرآن — تحقّقتُ عبر نتائج بحث متعددة متطابقة.
--   • حديث «خيركم من تعلم القرآن وعلمه»: صحيح البخاري، حديث رقم 5027 —
--     تحقّقتُ عبر WebSearch (bukhari.lna.io + islamweb + hadithportal
--     متطابقة).
--   • حديث «أُنزل القرآن على سبعة أحرف»: صحيح البخاري (فضائل القرآن، من
--     أرقامه 4992/5060/5061) وصحيح مسلم (صلاة المسافرين، 818) — متواتر
--     كما نصّ القاسم بن سلّام.
--   • كل الآيات القرآنية استُخرجت حرفياً من public/data/quran/surah-*.json
--     (لا من الذاكرة إطلاقاً): البقرة:106، آل عمران:7، الإسراء:88، الحجر:9.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_path_id       uuid;
  v_old_stage_id  uuid;
  v_stage1_id     uuid; -- التأسيس
  v_stage2_id     uuid; -- البناء
  v_stage3_id     uuid; -- التوسع
  v_course1_id    uuid; -- آداب حامل القرآن
  v_course2_id    uuid; -- المدخل إلى علوم القرآن
  v_course3_id    uuid; -- علوم القرآن المتقدمة
  v_unit1_id      uuid;
  v_unit2_id      uuid;
  v_unit3_id      uuid;
  v_i1 uuid; v_i2 uuid; v_i3 uuid; v_i4 uuid; v_i5 uuid;
  v_i6 uuid; v_i7 uuid; v_i8 uuid; v_i9 uuid; v_i10 uuid; v_i11 uuid;
BEGIN
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'uloom-quran';
  IF v_path_id IS NULL THEN
    RAISE EXCEPTION 'مسار uloom-quran غير موجود';
  END IF;

  IF EXISTS (SELECT 1 FROM courses WHERE slug = 'adab-hamil-quran') THEN
    RAISE NOTICE 'uloom-quran مُنجَز مسبقاً — لا شيء يُنفَّذ';
    RETURN;
  END IF;

  -- حذف الـplaceholder الصريح (CASCADE يحذف مقرره "محتوى قيد المراجعة" تلقائياً)
  SELECT id INTO v_old_stage_id FROM path_stages
    WHERE path_id = v_path_id AND slug = 'pending-content';
  IF v_old_stage_id IS NOT NULL THEN
    DELETE FROM path_stages WHERE id = v_old_stage_id;
  END IF;

  -- ── المرحلة 1: التأسيس ────────────────────────────────────────────────
  INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
  VALUES (gen_random_uuid(), v_path_id, 'foundations', 'التأسيس',
    'آداب حامل القرآن قبل الخوض في تقنيات العلم — لا تُطلَب علوم القرآن قبل آداب صاحبه، عبر متن "التبيان في آداب حملة القرآن" للإمام النووي.',
    1, 'published')
  RETURNING id INTO v_stage1_id;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage1_id, 'adab-hamil-quran', 'آداب حامل القرآن',
    'قراءة موجَّهة في أبواب مختارة من "التبيان في آداب حملة القرآن" للنووي: فضل التلاوة، آداب الحامل، وآداب القراءة.',
    'استحضار فضل القرآن وحامله، ومعرفة الآداب الشرعية الواجبة والمستحبة عند حمل القرآن وتلاوته.',
    'foundational', 1, 70,
    '["معرفة فضل تلاوة القرآن وتعلّمه وتعليمه بدليله","التمييز بين آداب حامل القرآن وآداب القراءة العامة","تطبيق آداب القراءة الأساسية (الطهارة، الاستعاذة، الترتيل)"]'::jsonb,
    'published')
  RETURNING id INTO v_course1_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course1_id, 'الدروس', 1) RETURNING id INTO v_unit1_id;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit1_id, 'book', 'فضل تلاوة القرآن وحملته',
    'الباب الأول من "التبيان": فضل تلاوة القرآن وتعلّمه وتعليمه. قال ﷺ: «خيركم من تعلم القرآن وعلمه» — رواه الإمام البخاري في صحيحه، كتاب فضائل القرآن، حديث رقم 5027، من حديث عثمان بن عفان رضي الله عنه.',
    1, 34, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit1_id, 'book', 'آداب حامل القرآن',
    'الباب الخامس من "التبيان": ما يجب على حامل القرآن (الحافظ له) من مراعاة حرمته، وحُسن الخُلق، وتنزيه نفسه عما لا يليق بحامل كتاب الله، وتقديم مصالح القرآن على غيرها.',
    1, 33, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit1_id, 'book', 'آداب القراءة',
    'الباب السادس من "التبيان" وهو معظم الكتاب ومقصوده: آداب القراءة من طهارة، واستقبال القبلة، والاستعاذة والبسملة، والترتيل، وتدبّر المعنى، وتحسين الصوت.',
    1, 33, true, 'manual_confirm', 100, 3, 'published', true) RETURNING id INTO v_i3;

  -- ── المرحلة 2: البناء ─────────────────────────────────────────────────
  INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
  VALUES (gen_random_uuid(), v_path_id, 'building', 'البناء',
    'المدخل إلى أشهر مباحث علوم القرآن الأساسية عبر "الإتقان في علوم القرآن" للسيوطي — أشمل الكتب التقليدية وأكثرها تداولاً في هذا الفن.',
    2, 'published')
  RETURNING id INTO v_stage2_id;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage2_id, 'madkhal-uloom-quran', 'المدخل إلى علوم القرآن',
    'قراءة موجَّهة في أشهر أنواع "الإتقان في علوم القرآن" للسيوطي (من أصل 80 نوعاً جمعها الكتاب): المكي والمدني، أسباب النزول، الناسخ والمنسوخ، وجمع القرآن.',
    'التمييز بين المكي والمدني وأثره في الاستنباط، ومعرفة معنى أسباب النزول وفائدته، وضوابط الناسخ والمنسوخ، ومعرفة تاريخ جمع القرآن.',
    'intermediate', 1, 70,
    '["التمييز بين خصائص السور المكية والمدنية","معرفة معنى أسباب النزول وأثره في فهم الآية","ضوابط القول بالنسخ في القرآن وعدم التوسّع فيه","معرفة مراحل جمع القرآن الثلاث (أبو بكر، عثمان)"]'::jsonb,
    'published')
  RETURNING id INTO v_course2_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course2_id, 'الدروس', 1) RETURNING id INTO v_unit2_id;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit2_id, 'book', 'المكي والمدني',
    'من أوائل أنواع "الإتقان": معرفة ما نزل بمكة وما نزل بالمدينة، وضوابط أهل العلم في التمييز بينهما (المكان قبل الهجرة/بعدها لا مكان النزول الجغرافي وحده)، وأثر ذلك في تفسير خصائص الأسلوب (السور المكية غالباً في العقيدة والتوحيد، المدنية غالباً في الأحكام والتشريع).',
    1, 26, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i4;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit2_id, 'book', 'أسباب النزول',
    'من أنواع "الإتقان": معرفة الحادثة أو السؤال الذي نزلت الآية بسببه، وفائدته في فهم مراد الآية وحكمة التشريع، مع التنبيه على قاعدة أهل العلم: "العبرة بعموم اللفظ لا بخصوص السبب".',
    1, 25, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i5;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit2_id, 'book', 'الناسخ والمنسوخ',
    'من أنواع "الإتقان": ضوابط نسخ حكم آية بآية لاحقة، مع التزام منهج المحققين في تضييق دائرة النسخ المُدَّعى (كثير مما عُدَّ نسخاً هو تخصيص أو تقييد لا نسخ حقيقي). قال تعالى: ﴿مَا نَنسَخْ مِنْ ءَايَةٍ أَوْ نُنسِهَا نَأْتِ بِخَيْرٍ مِّنْهَآ أَوْ مِثْلِهَآ﴾ (سورة البقرة: 106).',
    1, 25, true, 'manual_confirm', 100, 3, 'published', true) RETURNING id INTO v_i6;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit2_id, 'book', 'جمع القرآن وترتيبه',
    'من أنواع "الإتقان": مراحل جمع القرآن الثلاث — الجمع في عهد النبي ﷺ (كتابة متفرقة وحفظ في الصدور)، جمعه في مصحف واحد في عهد أبي بكر الصديق رضي الله عنه بعد استحرّ القتل بالقرّاء في وقعة اليمامة، ثم نسخه في عهد عثمان بن عفان رضي الله عنه على حرف واحد ﴿لسان قريش﴾ وإرساله للأمصار لجمع الأمة على مصحف واحد.',
    1, 24, true, 'manual_confirm', 100, 4, 'published', true) RETURNING id INTO v_i7;

  -- ── المرحلة 3: التوسع ─────────────────────────────────────────────────
  INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
  VALUES (gen_random_uuid(), v_path_id, 'advanced', 'التوسع',
    'مباحث متقدمة عبر كتابين جامعين: "البرهان في علوم القرآن" للزركشي (47 نوعاً) و"مناهل العرفان في علوم القرآن" للزرقاني (المعالجة المنهجية الحديثة).',
    3, 'published')
  RETURNING id INTO v_stage3_id;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage3_id, 'uloom-quran-mutaqaddima', 'علوم القرآن المتقدمة',
    'قراءة موجَّهة في مباحث متقدمة من "البرهان" للزركشي و"مناهل العرفان" للزرقاني: القراءات، إعجاز القرآن، المحكم والمتشابه، ورسم المصحف.',
    'معرفة معنى القراءات القرآنية وضوابط صحتها، والإحاطة بأوجه إعجاز القرآن، والتمييز بين المحكم والمتشابه، ومعرفة أصل الرسم العثماني.',
    'advanced', 1, 70,
    '["معنى القراءات القرآنية وشروط قبولها الثلاثة عند المحققين","أوجه إعجاز القرآن (البياني والتشريعي والعلمي والغيبي)","معنى المحكم والمتشابه والموقف الشرعي من كل منهما","نشأة الرسم العثماني وسبب عدم تقييده بقواعد الإملاء اللاحقة"]'::jsonb,
    'published')
  RETURNING id INTO v_course3_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course3_id, 'الدروس', 1) RETURNING id INTO v_unit3_id;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit3_id, 'book', 'القراءات القرآنية',
    'من مباحث "مناهل العرفان": معنى القراءات المتواترة العشر، وأصلها في قول النبي ﷺ: «إن هذا القرآن أُنزل على سبعة أحرف فاقرؤوا ما تيسّر منه» — رواه البخاري في فضائل القرآن ومسلم في صلاة المسافرين (حديث رقم 818)، وهو حديث متواتر كما قرّر القاسم بن سلّام. وشروط قبول القراءة عند المحققين: صحة السند، وموافقة الرسم العثماني ولو احتمالاً، وموافقة وجه صحيح في العربية.',
    1, 26, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i8;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit3_id, 'book', 'إعجاز القرآن',
    'من مباحث "البرهان": أوجه إعجاز القرآن — البياني (بلاغته وفصاحته التي عجز عنها فصحاء العرب)، والتشريعي (كمال أحكامه)، والغيبي (إخباره بأمور مستقبلة وماضية غائبة). قال تعالى تحدّياً: ﴿قُل لَّئِنِ ٱجْتَمَعَتِ ٱلْإِنسُ وَٱلْجِنُّ عَلَىٰ أَن يَأْتُوا۟ بِمِثْلِ هَٰذَا ٱلْقُرْءَانِ لَا يَأْتُونَ بِمِثْلِهِۦ وَلَوْ كَانَ بَعْضُهُم لِبَعْضٍ ظَهِيرًا﴾ (سورة الإسراء: 88).',
    1, 25, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i9;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit3_id, 'book', 'المحكم والمتشابه',
    'من مباحث "البرهان": المحكم ما اتضح معناه ولا يحتمل إلا وجهاً واحداً، والمتشابه ما خفي معناه أو احتمل أوجهاً. قال تعالى: ﴿هُوَ ٱلَّذِىٓ أَنزَلَ عَلَيْكَ ٱلْكِتَٰبَ مِنْهُ ءَايَٰتٌ مُّحْكَمَٰتٌ هُنَّ أُمُّ ٱلْكِتَٰبِ وَأُخَرُ مُتَشَٰبِهَٰتٌ ۖ فَأَمَّا ٱلَّذِينَ فِى قُلُوبِهِمْ زَيْغٌ فَيَتَّبِعُونَ مَا تَشَٰبَهَ مِنْهُ ٱبْتِغَآءَ ٱلْفِتْنَةِ وَٱبْتِغَآءَ تَأْوِيلِهِۦ ۗ وَمَا يَعْلَمُ تَأْوِيلَهُۥٓ إِلَّا ٱللَّهُ ۗ وَٱلرَّٰسِخُونَ فِى ٱلْعِلْمِ يَقُولُونَ ءَامَنَّا بِهِۦ كُلٌّ مِّنْ عِندِ رَبِّنَا﴾ (سورة آل عمران: 7) — والموقف الشرعي السليم هو الإيمان بالمتشابه ورده إلى المحكم، لا اتباعه ابتغاء الفتنة كما وصف الله من في قلبه زيغ.',
    1, 25, true, 'manual_confirm', 100, 3, 'published', true) RETURNING id INTO v_i10;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit3_id, 'book', 'رسم المصحف وحفظه',
    'من مباحث "مناهل العرفان": الرسم العثماني (طريقة كتابة المصحف الذي نسخه عثمان بن عفان رضي الله عنه) واتفاق جمهور العلماء على وجوب التزامه في طباعة المصاحف ولو خالف قواعد الإملاء المتأخرة، لضمان تواتر النقل. وحفظ الله لكتابه: ﴿إِنَّا نَحْنُ نَزَّلْنَا ٱلذِّكْرَ وَإِنَّا لَهُۥ لَحَٰفِظُونَ﴾ (سورة الحجر: 9).',
    1, 24, true, 'manual_confirm', 100, 4, 'published', true) RETURNING id INTO v_i11;

  -- ── الربط بالكتب الحقيقية في مكتبة المنصة ───────────────────────────
  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_i1, 'التبيان في آداب حملة القرآن', 'الإمام يحيى بن شرف النووي', 'أساسية إلزامية', 'الباب الأول', 'المتن التأسيسي القياسي في آداب حامل القرآن، عشرة أبواب — موجود في مكتبة المنصة (/library/book-tibyan)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i2, 'التبيان في آداب حملة القرآن', 'الإمام يحيى بن شرف النووي', 'أساسية إلزامية', 'الباب الخامس', 'المتن التأسيسي القياسي في آداب حامل القرآن — موجود في مكتبة المنصة (/library/book-tibyan)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i3, 'التبيان في آداب حملة القرآن', 'الإمام يحيى بن شرف النووي', 'أساسية إلزامية', 'الباب السادس (معظم الكتاب)', 'المتن التأسيسي القياسي في آداب حامل القرآن — موجود في مكتبة المنصة (/library/book-tibyan)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i4, 'الإتقان في علوم القرآن', 'الإمام جلال الدين السيوطي', 'أساسية إلزامية', 'من الأنواع الثمانين — نوع المكي والمدني', 'أشمل الكتب التقليدية في علوم القرآن وأكثرها تداولاً — موجود في مكتبة المنصة (/library/book-itqan)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i5, 'الإتقان في علوم القرآن', 'الإمام جلال الدين السيوطي', 'أساسية إلزامية', 'من الأنواع الثمانين — نوع أسباب النزول', 'أشمل الكتب التقليدية في علوم القرآن وأكثرها تداولاً — موجود في مكتبة المنصة (/library/book-itqan)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i6, 'الإتقان في علوم القرآن', 'الإمام جلال الدين السيوطي', 'أساسية إلزامية', 'من الأنواع الثمانين — نوع الناسخ والمنسوخ', 'أشمل الكتب التقليدية في علوم القرآن وأكثرها تداولاً — موجود في مكتبة المنصة (/library/book-itqan)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i7, 'الإتقان في علوم القرآن', 'الإمام جلال الدين السيوطي', 'أساسية إلزامية', 'من الأنواع الثمانين — نوع جمع القرآن', 'أشمل الكتب التقليدية في علوم القرآن وأكثرها تداولاً — موجود في مكتبة المنصة (/library/book-itqan)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i8, 'مناهل العرفان في علوم القرآن', 'الشيخ محمد عبد العظيم الزرقاني', 'مادة مساندة', 'مبحث القراءات والقراء', 'معالجة منهجية حديثة وشاملة، من أهم ما كُتب في هذا الموضوع — موجود في مكتبة المنصة (/library/book-manahil-al-irfan)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i9, 'البرهان في علوم القرآن', 'الإمام بدر الدين الزركشي', 'مادة مساندة', 'من الأنواع السبعة والأربعين — نوع إعجاز القرآن', 'من أجمع الكتب التي صُنِّفت في علوم القرآن، جمع فيه الزركشي ما كان مفرَّقاً في مصنفات مستقلة — موجود في مكتبة المنصة (/library/book-burhan)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i10, 'البرهان في علوم القرآن', 'الإمام بدر الدين الزركشي', 'مادة مساندة', 'من الأنواع السبعة والأربعين — نوع علم المتشابه', 'من أجمع الكتب التي صُنِّفت في علوم القرآن — موجود في مكتبة المنصة (/library/book-burhan)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i11, 'مناهل العرفان في علوم القرآن', 'الشيخ محمد عبد العظيم الزرقاني', 'مادة مساندة', 'مبحث كتابة القرآن ورسمه', 'معالجة منهجية حديثة وشاملة — موجود في مكتبة المنصة (/library/book-manahil-al-irfan)', 'مكتبة المجلس العلمي');

  UPDATE learning_paths SET status = 'published', total_sessions = 11, updated_at = now()
  WHERE id = v_path_id;

  RAISE NOTICE 'uloom-quran: path_id=%, stages=[%,%,%], courses=[%,%,%]',
    v_path_id, v_stage1_id, v_stage2_id, v_stage3_id, v_course1_id, v_course2_id, v_course3_id;
END $$;
