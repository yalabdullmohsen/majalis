-- ═══════════════════════════════════════════════════════════════════════════
-- learning_path_arabic_nahw_v1.sql
--
-- سياق: "arabic" و"nahw" مساران منفصلان `status='draft'` فارغان تمامًا
-- (كلاهما placeholder "قيد الإعداد" — يُحذفان قبل الإدراج). قرار سريع
-- (كما طُلب صراحةً من المنسّق: "قرار بسيط، لا تُطِل التفكير فيه"):
-- **مساران منفصلان لا مسار واحد**، لأن أوصافهما المخزَّنة أصلاً مختلفة
-- فعليًا («أساسيات اللغة العربية للطالب العلمي» لـarabic — عام واسع؛
-- «قواعد النحو العربي» لـnahw — نحو تخصصي محدَّد)، ولأن المكتبة تحوي
-- كتباً كافية لتغطية كليهما بمحتوى غير متداخل:
--   • nahw = تسلسل نحو/صرف صرف تقليدي: الآجرومية (تأسيس) ← مراح الأرواح
--     في الصرف (بناء) ← ألفية ابن مالك (توسّع، نحو+صرف متقدّم).
--   • arabic = مسح أوسع لعلوم اللغة: جامع الدروس العربية (نحو عام حديث
--     التنظيم، تأسيس) ← أسرار البلاغة للجرجاني (بلاغة، بناء) ← المعجم
--     الوسيط (معجم/فهم الألفاظ، توسّع).
-- لا تداخل في الكتب المستخدَمة بين المسارين.
--
-- التحقق العلمي (WebSearch مباشر هذه الجلسة قبل الكتابة):
--   • الآجرومية: تبدأ بـ"الكلام وأقسامه" (اسم/فعل/حرف) ثم الإعراب —
--     مؤكَّد عبر ويكيبيديا العربية ومصادر متعددة متطابقة.
--   • ألفية ابن مالك: 988 بيتاً على بحر الرجز، قسمان (نحوي وصرفي)، رتّب
--     ابن مالك أصول النحو قبل فروعه؛ الأبواب الصرفية المؤكَّدة: التأنيث،
--     المقصور والممدود، جمع التكسير، التصغير، النسب — مؤكَّد عبر نتائج
--     بحث متعددة متطابقة (moodoo3، ويكيبيديا).
--   • مراح الأرواح: تأليف أحمد بن علي بن مسعود أبي الفضائل حسام الدين
--     (ت 700هـ تقريباً)، متن أساسي يُعلِّم التعليلات الصرفية — مؤكَّد.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_path_id      uuid;
  v_old_stage_id uuid;
  v_stage1_id    uuid;
  v_stage2_id    uuid;
  v_stage3_id    uuid;
  v_course_id    uuid;
  v_unit_id      uuid;
  v_i1 uuid; v_i2 uuid; v_i3 uuid;
BEGIN
  -- ═══════════ مسار nahw (النحو) — تسلسل نحو/صرف تقليدي ═══════════════
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'nahw';
  IF v_path_id IS NULL THEN
    RAISE EXCEPTION 'مسار nahw غير موجود';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM courses WHERE slug = 'nahw-ajrumiyyah') THEN
    SELECT id INTO v_old_stage_id FROM path_stages
      WHERE path_id = v_path_id AND slug = 'pending-content';
    IF v_old_stage_id IS NOT NULL THEN
      DELETE FROM path_stages WHERE id = v_old_stage_id;
    END IF;

    -- التأسيس: الآجرومية
    INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
    VALUES (gen_random_uuid(), v_path_id, 'foundations', 'التأسيس',
      'المدخل الأول لعلم النحو عبر "متن الآجرومية" لابن آجروم الصنهاجي — أشهر متن مبتدئ في هذا الفن، مدرَّس في جُلّ المعاهد الشرعية.',
      1, 'published')
    RETURNING id INTO v_stage1_id;

    INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
    VALUES (gen_random_uuid(), v_stage1_id, 'nahw-ajrumiyyah', 'المدخل إلى النحو — متن الآجرومية',
      'قراءة موجَّهة في متن الآجرومية: الكلام وأقسامه الثلاثة، والإعراب.',
      'معرفة أقسام الكلام الثلاثة (اسم، فعل، حرف)، ومعنى الإعراب وأثره في تغيير أواخر الكلم.',
      'foundational', 1, 70,
      '["معرفة أقسام الكلام الثلاثة وعلامات كل قسم","معرفة معنى الإعراب وأنه تغيير لأواخر الكلم لفظاً أو تقديراً"]'::jsonb,
      'published')
    RETURNING id INTO v_course_id;

    INSERT INTO course_units (id, course_id, title, sort_order)
    VALUES (gen_random_uuid(), v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;

    INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
    VALUES (gen_random_uuid(), v_unit_id, 'book', 'الكلام وأقسامه الثلاثة',
      'افتتاحية متن الآجرومية: الكلام هو اللفظ المركَّب المفيد بالوضع، وأقسامه ثلاثة: اسم، وفعل، وحرف جاء لمعنى — وهذا التقسيم الثلاثي هو الأساس الذي تُبنى عليه كل أبواب النحو اللاحقة.',
      1, 50, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i1;

    INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
    VALUES (gen_random_uuid(), v_unit_id, 'book', 'الإعراب وأثره في المعنى',
      'من متن الآجرومية: الإعراب تغيير أواخر الكلم لاختلاف العوامل الداخلة عليها، لفظاً (كالحركات الظاهرة) أو تقديراً (حين يمنع مانع من ظهورها). هذا التغيير هو ما يميّز المعاني في الجملة العربية رغم تشابه ألفاظها أحياناً.',
      1, 50, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i2;

    -- البناء: مراح الأرواح
    INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
    VALUES (gen_random_uuid(), v_path_id, 'building', 'البناء',
      'علم الصرف كخطوة موازية للنحو، عبر متن "مراح الأرواح" لأحمد بن علي بن مسعود — من أشهر المتون التعليمية في هذا الفن.',
      2, 'published')
    RETURNING id INTO v_stage2_id;

    DECLARE
      v_c2_id uuid;
      v_u2_id uuid;
      v_i3b   uuid;
    BEGIN
      INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
      VALUES (gen_random_uuid(), v_stage2_id, 'nahw-sarf-marah', 'المدخل إلى الصرف — مراح الأرواح',
        'قراءة موجَّهة في مقدمة متن "مراح الأرواح" في علم الصرف.',
        'معرفة موضوع علم الصرف وأثره في تصريف الأفعال والأسماء العربية.',
        'intermediate', 1, 70,
        '["معرفة موضوع علم الصرف وفائدته موازياً لعلم النحو","التمييز بين علمي النحو (أواخر الكلم) والصرف (بنية الكلمة)"]'::jsonb,
        'published')
      RETURNING id INTO v_c2_id;

      INSERT INTO course_units (id, course_id, title, sort_order)
      VALUES (gen_random_uuid(), v_c2_id, 'الدروس', 1) RETURNING id INTO v_u2_id;

      INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
      VALUES (gen_random_uuid(), v_u2_id, 'book', 'موضوع علم الصرف والتعليلات الصرفية',
        'مقدمة متن "مراح الأرواح": علم الصرف يبحث في بنية الكلمة العربية وتصريفها (كتحويل الفعل الماضي إلى مضارع أو أمر، والاسم المفرد إلى مثنى أو جمع)، بخلاف النحو الذي يبحث في أواخر الكلم من حيث الإعراب. يمتاز هذا المتن بتعليم الطالب "التعليلات الصرفية" — أي بيان سبب كل تحويل لا حفظه فقط.',
        1, 100, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i3b;

      INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
      VALUES (gen_random_uuid(), v_i3b, 'متن مراح الأرواح في علم الصرف', 'أحمد بن علي بن مسعود', 'أساسية إلزامية', 'المقدمة وموضوع علم الصرف', 'من أشهر المتون التعليمية في الصرف، يُدرَّس عادة بعد الآجرومية مباشرة — موجود في مكتبة المنصة (/library/book-sarf-mutah)', 'مكتبة المجلس العلمي');
    END;

    -- التوسع: ألفية ابن مالك
    INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
    VALUES (gen_random_uuid(), v_path_id, 'advanced', 'التوسع',
      'النحو والصرف المتقدّم عبر "ألفية ابن مالك" — أشهر منظومة نحوية عربية، 988 بيتاً جمعت أصول الفنّين وفروعهما.',
      3, 'published')
    RETURNING id INTO v_stage3_id;

    DECLARE
      v_c3_id uuid;
      v_u3_id uuid;
      v_i4 uuid; v_i5 uuid;
    BEGIN
      INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
      VALUES (gen_random_uuid(), v_stage3_id, 'nahw-alfiyyah', 'النحو والصرف المتقدّم — ألفية ابن مالك',
        'قراءة موجَّهة في منهج ألفية ابن مالك وأبوابها الصرفية المختارة.',
        'معرفة منهج ابن مالك في تقديم أصول النحو على فروعه، ومعرفة أبرز الأبواب الصرفية في الألفية.',
        'advanced', 1, 70,
        '["معرفة منهج ابن مالك في ترتيب الألفية (الأصول قبل الفروع)","معرفة أبرز الأبواب الصرفية: التأنيث، المقصور والممدود، جمع التكسير، التصغير، النسب"]'::jsonb,
        'published')
      RETURNING id INTO v_c3_id;

      INSERT INTO course_units (id, course_id, title, sort_order)
      VALUES (gen_random_uuid(), v_c3_id, 'الدروس', 1) RETURNING id INTO v_u3_id;

      INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
      VALUES (gen_random_uuid(), v_u3_id, 'book', 'منهج ابن مالك في ترتيب الألفية',
        'ألفية ابن مالك 988 بيتاً على بحر الرجز، قسّمها ناظمها إلى قسمين: نحوي وصرفي. ابتكر ابن مالك ترتيباً لم يُسبَق إليه: قدَّم أصول النحو (الأحكام الإفرادية) على فروعه (الأحكام التركيبية)، مع استشهاد متدرِّج يبدأ بالقرآن الكريم، ثم الحديث الشريف، ثم أشعار العرب.',
        1, 50, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i4;

      INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
      VALUES (gen_random_uuid(), v_u3_id, 'book', 'الأبواب الصرفية في الألفية',
        'من القسم الصرفي في ألفية ابن مالك: التأنيث، والمقصور والممدود، وجمع التكسير، والتصغير، والنسب، والوقف، والإمالة، والتصريف، وزيادة همزة الوصل، والإبدال، والإدغام — أبواب مترابطة رتَّبها ابن مالك بتناسب دقيق بين موضوعاتها.',
        1, 50, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i5;

      INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
      VALUES
        (gen_random_uuid(), v_i4, 'ألفية ابن مالك في النحو والصرف', 'ابن مالك الأندلسي', 'أساسية إلزامية', 'المقدمة ومنهج الترتيب', 'أشهر منظومة نحوية عربية على الإطلاق، المرحلة المتقدمة الطبيعية بعد الآجرومية — موجودة في مكتبة المنصة (/library/book-alfiyyah)', 'مكتبة المجلس العلمي'),
        (gen_random_uuid(), v_i5, 'ألفية ابن مالك في النحو والصرف', 'ابن مالك الأندلسي', 'أساسية إلزامية', 'الأبواب الصرفية', 'أشهر منظومة نحوية عربية على الإطلاق — موجودة في مكتبة المنصة (/library/book-alfiyyah)', 'مكتبة المجلس العلمي');
    END;

    INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
    VALUES
      (gen_random_uuid(), v_i1, 'متن الآجرومية في النحو', 'ابن آجروم الصنهاجي', 'أساسية إلزامية', 'باب الكلام وأقسامه', 'أشهر متن مبتدئ في النحو، مدرَّس في جُلّ المعاهد الشرعية — موجود في مكتبة المنصة (/library/book-ajrumiyyah)', 'مكتبة المجلس العلمي'),
      (gen_random_uuid(), v_i2, 'متن الآجرومية في النحو', 'ابن آجروم الصنهاجي', 'أساسية إلزامية', 'باب الإعراب', 'أشهر متن مبتدئ في النحو — موجود في مكتبة المنصة (/library/book-ajrumiyyah)', 'مكتبة المجلس العلمي');

    UPDATE learning_paths SET status = 'published', total_sessions = 5, updated_at = now()
    WHERE id = v_path_id;

    RAISE NOTICE 'nahw: path_id=%, stages=[%,%,%]', v_path_id, v_stage1_id, v_stage2_id, v_stage3_id;
  ELSE
    RAISE NOTICE 'nahw مُنجَز مسبقاً — تخطّي';
  END IF;

  -- ═══════════ مسار arabic (اللغة العربية) — مسح أوسع لعلوم اللغة ═════
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'arabic';
  IF v_path_id IS NULL THEN
    RAISE EXCEPTION 'مسار arabic غير موجود';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM courses WHERE slug = 'arabic-durus-nahwiyya') THEN
    SELECT id INTO v_old_stage_id FROM path_stages
      WHERE path_id = v_path_id AND slug = 'pending-content';
    IF v_old_stage_id IS NOT NULL THEN
      DELETE FROM path_stages WHERE id = v_old_stage_id;
    END IF;

    INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
    VALUES (gen_random_uuid(), v_path_id, 'foundations', 'التأسيس',
      'مسح عام لقواعد اللغة العربية عبر "جامع الدروس العربية" للغلاييني — موسوعة نحوية وصرفية حديثة التنظيم، من أكثر الكتب استخداماً في تعليم النحو في العالم العربي.',
      1, 'published')
    RETURNING id INTO v_stage1_id;

    INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
    VALUES (gen_random_uuid(), v_stage1_id, 'arabic-durus-nahwiyya', 'مسح عام لقواعد العربية',
      'قراءة موجَّهة في مقدمة "جامع الدروس العربية" للغلاييني — نظرة عامة منظَّمة لقواعد اللغة العربية.',
      'التمييز بين هذا المسار (مسح عام واسع للغة) ومسار "النحو" المتخصص (تسلسل الآجرومية←الألفية).',
      'foundational', 1, 70,
      '["معرفة الفرق بين مسار مسح اللغة العام والتخصص النحوي الدقيق","الإلمام بمنهج الغلاييني في تنظيم قواعد العربية حديثاً"]'::jsonb,
      'published')
    RETURNING id INTO v_course_id;

    INSERT INTO course_units (id, course_id, title, sort_order)
    VALUES (gen_random_uuid(), v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;

    INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
    VALUES (gen_random_uuid(), v_unit_id, 'book', 'مدخل إلى جامع الدروس العربية',
      '"جامع الدروس العربية" للشيخ مصطفى الغلاييني: موسوعة نحوية وصرفية شاملة في 3 أجزاء، تجمع قواعد اللغة العربية في عرض منظَّم واضح يناسب الدارس المعاصر، بخلاف المتون التقليدية المنظومة كالآجرومية والألفية — لذلك يُعدّ مدخلاً تكميلياً لا بديلاً عن المسار النحوي التخصصي.',
      1, 100, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i1;

    INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
    VALUES (gen_random_uuid(), v_i1, 'جامع الدروس العربية', 'الشيخ مصطفى الغلاييني', 'أساسية إلزامية', 'المقدمة والمنهج العام', 'من أكثر الكتب استخداماً في تعليم قواعد العربية في العالم العربي — موجود في مكتبة المنصة (/library/book-al-durus-nahwiyya)', 'مكتبة المجلس العلمي');

    -- البناء: أسرار البلاغة
    INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
    VALUES (gen_random_uuid(), v_path_id, 'building', 'البناء',
      'علم البلاغة عبر "أسرار البلاغة" لعبد القاهر الجرجاني — الكتاب المؤسِّس لعلمي البيان والمعاني في التراث العربي.',
      2, 'published')
    RETURNING id INTO v_stage2_id;

    DECLARE
      v_c2_id uuid;
      v_u2_id uuid;
      v_i2b   uuid;
    BEGIN
      INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
      VALUES (gen_random_uuid(), v_stage2_id, 'arabic-asrar-balagha', 'مدخل إلى البلاغة',
        'قراءة موجَّهة في "أسرار البلاغة" للجرجاني: التشبيه والاستعارة والكناية.',
        'معرفة أدوات البلاغة الثلاث الأساسية (التشبيه، الاستعارة، الكناية) وأثرها في فهم إعجاز القرآن البياني.',
        'intermediate', 1, 70,
        '["معرفة معنى التشبيه والاستعارة والكناية عند الجرجاني","ربط أدوات البلاغة بفهم وجه الإعجاز البياني في القرآن الكريم"]'::jsonb,
        'published')
      RETURNING id INTO v_c2_id;

      INSERT INTO course_units (id, course_id, title, sort_order)
      VALUES (gen_random_uuid(), v_c2_id, 'الدروس', 1) RETURNING id INTO v_u2_id;

      INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
      VALUES (gen_random_uuid(), v_u2_id, 'book', 'التشبيه والاستعارة والكناية',
        '"أسرار البلاغة" للإمام عبد القاهر الجرجاني: الكتاب الثاني له في علم البلاغة (بعد "دلائل الإعجاز")، يتناول التشبيه والاستعارة والكناية وأسرارها البيانية، وهو أساس ما بُني عليه لاحقاً علما البيان والمعاني في التراث البلاغي العربي، مع ربط دائم بأثر هذه الأدوات في فهم وجه الإعجاز البياني للقرآن الكريم.',
        1, 100, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i2b;

      INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
      VALUES (gen_random_uuid(), v_i2b, 'أسرار البلاغة', 'الإمام عبد القاهر الجرجاني', 'أساسية إلزامية', 'مباحث التشبيه والاستعارة والكناية', 'الكتاب المؤسِّس لعلمي البيان والمعاني في التراث العربي — موجود في مكتبة المنصة (/library/book-asrar-balagha-jurjani)', 'مكتبة المجلس العلمي');
    END;

    -- التوسع: المعجم الوسيط
    INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
    VALUES (gen_random_uuid(), v_path_id, 'advanced', 'التوسع',
      'مهارة استخدام المعجم العربي عبر "المعجم الوسيط" الصادر عن مجمع اللغة العربية بالقاهرة — المرجع المعتمد لفهم الألفاظ الفصيحة.',
      3, 'published')
    RETURNING id INTO v_stage3_id;

    DECLARE
      v_c3_id uuid;
      v_u3_id uuid;
      v_i3c   uuid;
    BEGIN
      INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
      VALUES (gen_random_uuid(), v_stage3_id, 'arabic-mujam-wasit', 'مهارة استخدام المعجم العربي',
        'قراءة موجَّهة في "المعجم الوسيط" — طريقة البحث عن الألفاظ وفهم دلالاتها.',
        'إتقان طريقة البحث عن الكلمة في المعجم العربي عبر جذرها الثلاثي أو الرباعي، وفهم فائدة ذلك في فهم القرآن والحديث.',
        'advanced', 1, 70,
        '["إتقان طريقة استخراج الجذر اللغوي للكلمة قبل البحث عنها في المعجم","معرفة أثر إتقان المعجم في فهم ألفاظ القرآن والحديث الفصيحة"]'::jsonb,
        'published')
      RETURNING id INTO v_c3_id;

      INSERT INTO course_units (id, course_id, title, sort_order)
      VALUES (gen_random_uuid(), v_c3_id, 'الدروس', 1) RETURNING id INTO v_u3_id;

      INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
      VALUES (gen_random_uuid(), v_u3_id, 'book', 'استخراج الجذر واستخدام المعجم',
        '"المعجم الوسيط" الصادر عن مجمع اللغة العربية بالقاهرة: معجم معتمد يجمع الألفاظ الفصيحة القديمة والحديثة مع تعريفاتها، مرجع أساسي لفهم مفردات القرآن والحديث. مهارة البحث فيه تبدأ بردّ الكلمة إلى جذرها الثلاثي أو الرباعي المجرَّد قبل البحث عنه أبجدياً.',
        1, 100, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i3c;

      INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
      VALUES (gen_random_uuid(), v_i3c, 'المعجم الوسيط', 'مجمع اللغة العربية بالقاهرة', 'أساسية إلزامية', 'مقدمة المعجم وطريقة استخدامه', 'المعجم المعتمد الصادر عن مجمع اللغة العربية بالقاهرة — موجود في مكتبة المنصة (/library/book-mujam-wasit-arabic)', 'مكتبة المجلس العلمي');
    END;

    UPDATE learning_paths SET status = 'published', total_sessions = 3, updated_at = now()
    WHERE id = v_path_id;

    RAISE NOTICE 'arabic: path_id=%, stages=[%,%,%]', v_path_id, v_stage1_id, v_stage2_id, v_stage3_id;
  ELSE
    RAISE NOTICE 'arabic مُنجَز مسبقاً — تخطّي';
  END IF;
END $$;
