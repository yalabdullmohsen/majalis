-- ═══════════════════════════════════════════════════════════════════════════
-- learning_path_adab_v1.sql
--
-- سياق: مسار "adab" (الآداب) أحد المسارات `status='draft'` الفارغة تمامًا
-- (placeholder صريح "قيد الإعداد" — يُحذف عمداً قبل الإدراج، نفس نمط
-- uloom-quran/akhlaq).
--
-- تمييز متعمَّد عن مسار "akhlaq" المُنجَز في نفس الجلسة (كلاهما تصنيف
-- "آداب" في library-catalog.ts، لتفادي التكرار وضع تعريف تشغيلي واضح):
--   • "أخلاق" = صفات نفسية عامة ثابتة في النفس (الصدق، الصبر، الإخلاص) —
--     غُطِّيت عبر تهذيب الأخلاق/رياض الصالحين/أدب الدنيا والدين.
--   • "آداب" (هذا المسار) = سلوكيات وأحكام تفصيلية في مواقف محددة
--     (التعامل مع الوالدين، الجار، الضيف، السلام) — عبر كتابين غير
--     مستخدَمين في akhlaq: "الأدب المفرد" للبخاري (مجموع حديثي مخصَّص
--     للآداب الموقفية بعينها) و"مدارج السالكين" لابن القيم (آداب السلوك
--     إلى الله عبر مفهوم "المنازل" الروحية).
--
-- البنية: 3 مراحل (نفس التسمية المستقرة)، 3 مقررات، 7 عناصر تعليمية، كل
-- عنصر مربوط بكتاب حقيقي موجود مسبقاً في library-catalog.ts (لا كتب
-- جديدة): الأدب المفرد (التأسيس+البناء)، مدارج السالكين (التوسع).
--
-- التحقق العلمي (WebSearch مباشر هذه الجلسة عبر Agent فرعي، كل حقيقة
-- تحقّقت من مصدر مباشر قبل الكتابة، لا من الذاكرة):
--   • "الأدب المفرد" للبخاري: أبواب بر الوالدين (باب 1 وما بعده)، حق
--     الجار (الأبواب 55-70 تقريباً)، إكرام الضيف (الأبواب ~309-317، منها
--     باب حدّ الضيافة بثلاثة أيام رقم 311)، وآداب السلام (الأبواب
--     ~447-532، أولها "باب بدء السلام") — كل ذلك مؤكَّد عبر hadithportal.com
--     وwikisource مباشرة.
--   • حديث بر الوالدين المُستخدَم: حديث ابن مسعود رضي الله عنه "أي العمل
--     أحب إلى الله؟ ... ثم بر الوالدين" — **مُتحقَّق كحديث رقم 1 في صحيح
--     الأدب المفرد** (تصحيح الألباني)، وأصله في صحيح البخاري (حديث 2782)
--     وصحيح مسلم (حديث 85). **تعمّدت تجنّب** حديث "رضا الرب في رضا الوالد"
--     البديل رغم شهرته لأن تصحيح الألباني له غير مستقر عبر مؤلفاته
--     (صححه في مواضع، ثم نُقل تراجعه في أخرى) — اكتُشف هذا التفاوت أثناء
--     البحث المباشر، فاستُبعد الحديث المتنازَع فيه والتزم بالحديث الثابت
--     تصحيحه (تطبيقاً حرفياً لقيد "لا تُعرض معلومة غير مؤكدة كحقيقة").
--   • "مدارج السالكين" لابن القيم: مُتحقَّق أنه شرح لـ"منازل السائرين"
--     لأبي إسماعيل الأنصاري الهروي (100 مقام في 10 أقسام)، ومُتحقَّق
--     وجود ثلاث منازل بعينها بصفحات مرجعية مباشرة على الشاملة: منزلة
--     التوبة، منزلة الإخلاص، منزلة الصبر (بمراتبها الثلاث: عن المعصية/
--     على الطاعة/في البلاء).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_path_id      uuid;
  v_old_stage_id uuid;
  v_stage1_id    uuid; -- التأسيس
  v_stage2_id    uuid; -- البناء
  v_stage3_id    uuid; -- التوسع
  v_course1_id   uuid; -- آداب الأسرة
  v_course2_id   uuid; -- آداب المجتمع
  v_course3_id   uuid; -- آداب السلوك إلى الله
  v_unit1_id     uuid;
  v_unit2_id     uuid;
  v_unit3_id     uuid;
  v_i1 uuid; v_i2 uuid; v_i3 uuid; v_i4 uuid; v_i5 uuid; v_i6 uuid; v_i7 uuid;
BEGIN
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'adab';
  IF v_path_id IS NULL THEN
    RAISE EXCEPTION 'مسار adab غير موجود';
  END IF;

  IF EXISTS (SELECT 1 FROM courses WHERE slug = 'adab-al-usrah') THEN
    RAISE NOTICE 'adab مُنجَز مسبقاً — لا شيء يُنفَّذ';
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
    'آداب الأسرة كما وردت في "الأدب المفرد" للبخاري: بر الوالدين وحق الجار — أول دائرتين تجب فيهما مراعاة الآداب الشرعية بعد حق الله.',
    1, 'published')
  RETURNING id INTO v_stage1_id;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage1_id, 'adab-al-usrah', 'آداب الأسرة',
    'قراءة موجَّهة في أبواب من "الأدب المفرد" للبخاري: بر الوالدين وحق الجار.',
    'معرفة فضل بر الوالدين ومنزلته بعد التوحيد، ومعرفة حقوق الجار وحدودها.',
    'foundational', 1, 70,
    '["معرفة منزلة بر الوالدين في ترتيب الأعمال الفاضلة","معرفة حقوق الجار وأنواعها","التمييز بين آداب الأسرة (سلوكيات موقفية) وأخلاق الصدق والصبر العامة (مسار akhlaq)"]'::jsonb,
    'published')
  RETURNING id INTO v_course1_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course1_id, 'الدروس', 1) RETURNING id INTO v_unit1_id;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit1_id, 'book', 'بر الوالدين',
    'من أوائل أبواب "الأدب المفرد" للبخاري. عن ابن مسعود رضي الله عنه قال: سألت النبي ﷺ أي العمل أحب إلى الله؟ قال: «الصلاة على وقتها» قلت: ثم أي؟ قال: «ثم بر الوالدين» قلت: ثم أي؟ قال: «ثم الجهاد في سبيل الله» — رواه البخاري في صحيحه (حديث 2782) ومسلم في صحيحه (حديث 85)، وهو الحديث الأول في «صحيح الأدب المفرد» بتصحيح الألباني. يُظهر الحديث ترتيب بر الوالدين في المنزلة الثانية بعد الصلاة، قبل الجهاد في سبيل الله.',
    1, 50, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit1_id, 'book', 'حق الجار',
    'من أبواب "الأدب المفرد" للبخاري (تُعنى بها نحو 15 باباً متتالياً في الكتاب، منها "باب الوصاة بالجار"): الوصية بالجار ومراعاة حقه، ولو كان بعيداً في النسب أو الدين، وأن حسن الجوار من علامات كمال الإيمان.',
    1, 50, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i2;

  -- ── المرحلة 2: البناء ─────────────────────────────────────────────────
  INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
  VALUES (gen_random_uuid(), v_path_id, 'building', 'البناء',
    'آداب المجتمع الأوسع: إكرام الضيف وآداب السلام، عبر أبواب أخرى من "الأدب المفرد" للبخاري.',
    2, 'published')
  RETURNING id INTO v_stage2_id;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage2_id, 'adab-al-mujtama', 'آداب المجتمع',
    'قراءة موجَّهة في أبواب إكرام الضيف وآداب السلام من "الأدب المفرد" للبخاري.',
    'معرفة حدّ الضيافة الشرعي وآدابها، ومعرفة آداب إلقاء السلام ورده.',
    'intermediate', 1, 70,
    '["معرفة حدّ الضيافة الشرعي (ثلاثة أيام) وما زاد عنها","معرفة آداب إلقاء السلام ورده وبدء التحية"]'::jsonb,
    'published')
  RETURNING id INTO v_course2_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course2_id, 'الدروس', 1) RETURNING id INTO v_unit2_id;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit2_id, 'book', 'إكرام الضيف',
    'من أبواب "الأدب المفرد" للبخاري المخصَّصة لإكرام الضيف (نحو 9 أبواب متتالية في الكتاب، منها باب مخصَّص لحدّ الضيافة): إكرام الضيف واجب على المضيف ثلاثة أيام، وما زاد عن ذلك فهو من كرم النفس وسخائها لا من الواجب المحدود.',
    1, 50, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit2_id, 'book', 'آداب السلام',
    'قسم واسع من "الأدب المفرد" للبخاري مخصَّص لآداب السلام (يفتتحه "باب بدء السلام")، يشمل ما يزيد على ثمانين باباً في أحكام إلقاء السلام ورده بين مختلف الفئات (الصغير للكبير، الراكب للماشي، القليل للكثير) وأحكامه مع غير المسلمين.',
    1, 50, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i4;

  -- ── المرحلة 3: التوسع ─────────────────────────────────────────────────
  INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
  VALUES (gen_random_uuid(), v_path_id, 'advanced', 'التوسع',
    'آداب السلوك إلى الله عبر مفهوم "المنازل" الروحية في "مدارج السالكين" لابن القيم — شرح موسّع لـ"منازل السائرين" لأبي إسماعيل الأنصاري الهروي.',
    3, 'published')
  RETURNING id INTO v_stage3_id;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage3_id, 'adab-suluk-ilallah', 'آداب السلوك إلى الله',
    'قراءة موجَّهة في ثلاث منازل من منازل السالكين عند ابن القيم: التوبة، والإخلاص، والصبر.',
    'معرفة مفهوم "المنزلة" عند أهل السلوك، ومعرفة حقيقة التوبة والإخلاص، والتمييز بين مراتب الصبر الثلاث.',
    'advanced', 1, 70,
    '["معرفة معنى المنزلة الروحية عند ابن القيم وأهل السلوك","معرفة حقيقة منزلة التوبة ومنزلة الإخلاص","التمييز بين مراتب الصبر الثلاث: عن المعصية، وعلى الطاعة، وفي البلاء"]'::jsonb,
    'published')
  RETURNING id INTO v_course3_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course3_id, 'الدروس', 1) RETURNING id INTO v_unit3_id;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit3_id, 'book', 'منزلة التوبة',
    'أول المنازل التي يتناولها ابن القيم في "مدارج السالكين" شرحاً على "منازل السائرين" للهروي (100 مقام موزَّعة على 10 أقسام). التوبة عند أهل السلوك هي أول منزلة ينزلها العبد في طريقه إلى الله، وهي لازمة له من أول السير إلى آخره لا تنقطع بمنزلة واحدة تُجاوَز.',
    1, 34, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i5;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit3_id, 'book', 'منزلة الإخلاص',
    'من منازل "مدارج السالكين" لابن القيم: الإخلاص إفراد الله بالقصد في العبادة والطاعة، وتصفيتها عن كل شائبة للنفس أو الخلق، وهو منزلة تتفاوت فيها درجات السالكين تفاوتاً عظيماً بحسب صفاء نياتهم.',
    1, 33, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i6;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit3_id, 'book', 'منزلة الصبر',
    'من منازل "مدارج السالكين" لابن القيم: يُقسِّم ابن القيم الصبر إلى ثلاث مراتب: الصبر عن المعصية (حبس النفس عنها)، والصبر على الطاعة (المداومة عليها)، والصبر في البلاء (عدم التسخط منه) — وأعلاها الصبر على الطاعة عند كثير من أهل العلم.',
    1, 33, true, 'manual_confirm', 100, 3, 'published', true) RETURNING id INTO v_i7;

  -- ── الربط بالكتب الحقيقية الموجودة مسبقاً في مكتبة المنصة ───────────
  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_i1, 'الأدب المفرد', 'الإمام محمد بن إسماعيل البخاري', 'أساسية إلزامية', 'أبواب بر الوالدين (من الباب الأول)', 'مجموع حديثي مخصَّص للآداب الموقفية التفصيلية بخلاف مسار الأخلاق العام — موجود في مكتبة المنصة (/library/book-adab-al-mufrad)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i2, 'الأدب المفرد', 'الإمام محمد بن إسماعيل البخاري', 'أساسية إلزامية', 'أبواب حق الجار (نحو 15 باباً)', 'مجموع حديثي مخصَّص للآداب الموقفية التفصيلية — موجود في مكتبة المنصة (/library/book-adab-al-mufrad)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i3, 'الأدب المفرد', 'الإمام محمد بن إسماعيل البخاري', 'أساسية إلزامية', 'أبواب إكرام الضيف (نحو 9 أبواب)', 'مجموع حديثي مخصَّص للآداب الموقفية التفصيلية — موجود في مكتبة المنصة (/library/book-adab-al-mufrad)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i4, 'الأدب المفرد', 'الإمام محمد بن إسماعيل البخاري', 'أساسية إلزامية', 'قسم آداب السلام (يفتتحه باب بدء السلام)', 'مجموع حديثي مخصَّص للآداب الموقفية التفصيلية — موجود في مكتبة المنصة (/library/book-adab-al-mufrad)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i5, 'مدارج السالكين بين منازل إياك نعبد وإياك نستعين', 'الإمام ابن قيم الجوزية', 'مادة مساندة', 'منزلة التوبة', 'شرح موسّع لمنازل السائرين للهروي، غير مستخدَم في مسار الأخلاق — موجود في مكتبة المنصة (/library/book-madarij)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i6, 'مدارج السالكين بين منازل إياك نعبد وإياك نستعين', 'الإمام ابن قيم الجوزية', 'مادة مساندة', 'منزلة الإخلاص', 'شرح موسّع لمنازل السائرين للهروي — موجود في مكتبة المنصة (/library/book-madarij)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i7, 'مدارج السالكين بين منازل إياك نعبد وإياك نستعين', 'الإمام ابن قيم الجوزية', 'مادة مساندة', 'منزلة الصبر', 'شرح موسّع لمنازل السائرين للهروي — موجود في مكتبة المنصة (/library/book-madarij)', 'مكتبة المجلس العلمي');

  UPDATE learning_paths SET status = 'published', total_sessions = 7, updated_at = now()
  WHERE id = v_path_id;

  RAISE NOTICE 'adab: path_id=%, stages=[%,%,%], courses=[%,%,%]',
    v_path_id, v_stage1_id, v_stage2_id, v_stage3_id, v_course1_id, v_course2_id, v_course3_id;
END $$;
