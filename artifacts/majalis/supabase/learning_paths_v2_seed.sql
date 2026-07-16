-- ═══════════════════════════════════════════════════════════════════════════
-- زرع محتوى حقيقي لمنظومة المسارات العلمية الموحّدة
-- ═══════════════════════════════════════════════════════════════════════════
-- كل عنصر تعلم من نوع "lesson" مربوط بمعرّف حقيقي موجود فعليًا في جدول
-- lessons (28 درسًا معتمدًا) — لا محتوى وهمي. البيانات الوصفية للكتب
-- (course_books: العنوان/المؤلف/الترتيب) مصدرها بحث في مصادر موثوقة
-- (islamweb.net مركز الفتوى، binbaz.org.sa، IslamQA) توثّق ترتيب الدراسة
-- التقليدي لهذه المتون المعروفة — لا نص شرح مُولَّد، فقط عنوان/مؤلف/دور.
--
-- 7 مسارات (عقيدة، توحيد، فقه، حديث، مصطلح حديث، تفسير، سيرة) لها محتوى
-- حقيقي كامل مربوط بدروس فعلية. 8 مسارات أخرى (أصول الفقه، علوم القرآن،
-- الآداب، الأخلاق، اللغة العربية، النحو، الدعوة، التربية) لا يوجد لها بعد
-- دروس أو كتب حقيقية في المنصة — تُترَك ببنية هيكلية فقط بحالة needs_review
-- (لا تظهر للمستخدم النهائي، مرئية للمشرف فقط) بدل اختلاق محتوى.
--
-- آمن للتشغيل المتكرر: كل إدراج محروس بـ NOT EXISTS على المفتاح الطبيعي.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_path_id UUID;
  v_stage_id UUID;
  v_course_id UUID;
  v_unit_id UUID;
  v_item_id UUID;
  v_prev_course_id UUID;
BEGIN

  -- ═══ 1. العقيدة (aqeedah) ═══
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'aqeedah';
  IF v_path_id IS NOT NULL THEN
    -- المرحلة الأولى: التأسيس
    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'foundations', 'التأسيس', 'المداخل المختصرة الواجب إتقانها قبل التوسع في العقيدة', 1
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'foundations')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'foundations'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'nawaqid-islam', 'نواقض الإسلام ومدخل العقيدة', 'مدخل إلى أصول العقيدة ونواقض الإسلام العشرة', 'التمييز بين أصول التوحيد ونواقضه', 'foundational', 1,
        '["فهم أقسام التوحيد الثلاثة","معرفة نواقض الإسلام العشرة وضوابطها"]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'nawaqid-islam')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'نواقض الإسلام — د. عثمان الخميس', 'lessons', 'ffe04e69-f347-4947-8806-db7778249f6d', 6, 60, 'watch_percent', 80, 1)
        RETURNING id INTO v_item_id;
      INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name, source_url)
        VALUES
          (v_item_id, 'الأصول الثلاثة', 'محمد بن عبد الوهاب', 'أساسية إلزامية', 'كامل — متن مختصر', 'المدخل التقليدي الأول لطالب العلم في العقيدة عند جمهور المدارس السلفية المعاصرة', 'islamweb.net — مركز الفتوى', 'https://www.islamweb.net/ar/fatwa/170619/'),
          (v_item_id, 'القواعد الأربع', 'محمد بن عبد الوهاب', 'أساسية إلزامية', 'كامل — متن مختصر', 'يكمل الأصول الثلاثة في تأصيل معنى التوحيد وضده', 'islamweb.net — مركز الفتوى', 'https://www.islamweb.net/ar/fatwa/170619/'),
          (v_item_id, 'كشف الشبهات', 'محمد بن عبد الوهاب', 'أساسية إلزامية', 'كامل', 'يرد على أشهر شبهات الشرك المعاصرة بأسلوب سؤال وجواب', 'islamweb.net — مركز الفتوى', 'https://www.islamweb.net/ar/fatwa/170619/');
    END IF;
    v_prev_course_id := v_course_id;

    -- المرحلة الثانية: البناء
    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'building', 'البناء', 'كتاب التوحيد والعقيدة الواسطية — المرحلة المتوسطة', 2
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'building')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'building'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'kitab-tawheed', 'كتاب التوحيد', 'دراسة كتاب التوحيد للشيخ محمد بن عبد الوهاب بابًا بابًا', 'إتقان أبواب كتاب التوحيد وأدلتها', 'intermediate', 1,
        '["حفظ وفهم أبواب كتاب التوحيد الأساسية","معرفة الأدلة القرآنية والحديثية لكل باب"]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'kitab-tawheed')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'شرح كتاب التوحيد', 'lessons', 'ecefeb94-e257-42a3-a3ba-815c119eadf8', 12, 100, 'watch_percent', 80, 1)
        RETURNING id INTO v_item_id;
      INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name, source_url)
        VALUES (v_item_id, 'كتاب التوحيد', 'محمد بن عبد الوهاب', 'أساسية إلزامية', 'كامل', 'المتن الأشهر في تقرير توحيد الألوهية بالأدلة، يلي المختصرات التأسيسية مباشرة', 'islamweb.net — مركز الفتوى', 'https://www.islamweb.net/ar/fatwa/170619/');
      IF v_prev_course_id IS NOT NULL THEN
        INSERT INTO prerequisites (course_id, requires_course_id) VALUES (v_course_id, v_prev_course_id) ON CONFLICT DO NOTHING;
      END IF;
    END IF;
    v_prev_course_id := v_course_id;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'aqeedah-wasitiyya', 'العقيدة الواسطية', 'متن شيخ الإسلام ابن تيمية في تقرير عقيدة أهل السنة والجماعة', 'إتقان تقرير عقيدة أهل السنة في الأسماء والصفات', 'intermediate', 2,
        '["تقرير منهج أهل السنة في الأسماء والصفات","التمييز بين مذاهب الفرق في هذا الباب"]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'aqeedah-wasitiyya')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'العقيدة الواسطية', 'lessons', '7bf2a0ed-9b14-4791-a335-a47e90b248bd', 10, 100, 'watch_percent', 80, 1)
        RETURNING id INTO v_item_id;
      INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name, source_url)
        VALUES (v_item_id, 'العقيدة الواسطية', 'شيخ الإسلام ابن تيمية', 'أساسية إلزامية', 'كامل', 'ثاني الكتب المتوسطة الموصى بها بعد كتاب التوحيد في هذا المسار', 'islamweb.net — مركز الفتوى', 'https://www.islamweb.net/ar/fatwa/170619/');
      IF v_prev_course_id IS NOT NULL THEN
        INSERT INTO prerequisites (course_id, requires_course_id) VALUES (v_course_id, v_prev_course_id) ON CONFLICT DO NOTHING;
      END IF;
    END IF;
    v_prev_course_id := v_course_id;

    -- المرحلة الثالثة: التوسع
    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'advanced', 'التوسع', 'المتون المتقدمة في العقيدة', 3
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'advanced')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'advanced'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'aqeedah-tahawiyya', 'شرح الطحاوية', 'متن الإمام الطحاوي في عقيدة أهل السنة، من أوسع المتون المتقدمة تداولًا', 'إتقان متن الطحاوية وشروحه المعتمدة', 'advanced', 1,
        '["دراسة عقيدة أهل السنة بأسلوب متقدم أوسع من الواسطية"]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'aqeedah-tahawiyya')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'العقيدة الطحاوية', 'lessons', '577b60a2-deaf-4bc0-9d94-45cd2b9a8c19', 14, 100, 'watch_percent', 80, 1)
        RETURNING id INTO v_item_id;
      INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name, source_url)
        VALUES (v_item_id, 'العقيدة الطحاوية', 'أبو جعفر الطحاوي', 'أساسية إلزامية', 'كامل', 'من أوسع المتون المتقدمة تداولًا في عقيدة أهل السنة والجماعة', 'islamweb.net — مركز الفتوى', 'https://www.islamweb.net/ar/fatwa/170619/');
      IF v_prev_course_id IS NOT NULL THEN
        INSERT INTO prerequisites (course_id, requires_course_id) VALUES (v_course_id, v_prev_course_id) ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'qawaid-muthla', 'القواعد المثلى في صفات الله وأسمائه الحسنى', 'دورة تأصيلية متقدمة في قواعد باب الأسماء والصفات', 'إتقان القواعد المنهجية لفهم نصوص الأسماء والصفات', 'advanced', 2, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'qawaid-muthla')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'الدورة العلمية التأصيلية — القواعد المثلى في صفات الله وأسمائه الحسنى', 'lessons', '4d00271c-3e55-430f-aacf-0e6e1a8b00a8', 8, 100, 'watch_percent', 80, 1);
    END IF;

    UPDATE learning_paths SET
      what_you_learn = '["أصول التوحيد الثلاثة ونواقض الإسلام","أبواب كتاب التوحيد وأدلتها","عقيدة أهل السنة في الأسماء والصفات (الواسطية والطحاوية)"]'::jsonb,
      completion_requirements = '{"required_courses": true, "final_assessment": false}'::jsonb
    WHERE id = v_path_id;
  END IF;

  -- ═══ 2. التوحيد (tawheed) — مسار مستقل مركّز على كتاب التوحيد تحديدًا، بخلاف مسار العقيدة العام ═══
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'tawheed';
  IF v_path_id IS NOT NULL THEN
    UPDATE learning_paths SET description =
      'دراسة معمّقة لكتاب التوحيد للشيخ محمد بن عبد الوهاب تحديدًا — مسار مستقل عن مسار "العقيدة" العام (الذي يغطي التوحيد والواسطية والطحاوية معًا)؛ اختر هذا المسار إن أردت التركيز على كتاب التوحيد وحده بعمق أكبر.'
      WHERE id = v_path_id;

    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'kitab-tawheed-deep', 'كتاب التوحيد بعمق', 'دراسة كتاب التوحيد بابًا بابًا مع التوسع في الأدلة', 1
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'kitab-tawheed-deep')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'kitab-tawheed-deep'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'kitab-tawheed-full', 'كتاب التوحيد كاملًا', 'شرح كامل لكتاب التوحيد', 'إتقان كل أبواب كتاب التوحيد الأربعة والستين', 'intermediate', 1, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'kitab-tawheed-full')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'شرح كتاب التوحيد', 'lessons', 'ecefeb94-e257-42a3-a3ba-815c119eadf8', 16, 100, 'watch_percent', 80, 1)
        RETURNING id INTO v_item_id;
      INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name, source_url)
        VALUES (v_item_id, 'كتاب التوحيد', 'محمد بن عبد الوهاب', 'أساسية إلزامية', 'كامل — دراسة معمّقة لكل الأبواب الأربعة والستين', 'هذا المسار مخصَّص لكتاب التوحيد تحديدًا بعمق أكبر من مساره ضمن مسار العقيدة العام', 'islamweb.net — مركز الفتوى', 'https://www.islamweb.net/ar/fatwa/170619/');
    END IF;
  END IF;

  -- ═══ 3. الفقه (fiqh) ═══
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'fiqh';
  IF v_path_id IS NOT NULL THEN
    v_prev_course_id := NULL;
    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'foundations', 'التأسيس', 'فقه العبادات والمداخل العامة', 1
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'foundations')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'foundations'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'fiqh-ibadat', 'فقه العبادات', 'أحكام الطهارة والصلاة والزكاة والصيام والحج', 'إتقان أحكام العبادات اليومية الأساسية', 'foundational', 1, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'fiqh-ibadat')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'فقه العبادات', 'lessons', 'd986fb9b-03f9-4743-8fa7-5d80899812c9', 10, 60, 'watch_percent', 80, 1);
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'شرح كتاب الصلاة من إعانة الطالب', 'lessons', '5f684eff-44af-4c7e-a285-02dc1c0effd1', 8, 40, 'watch_percent', 80, 2);
    END IF;
    v_prev_course_id := v_course_id;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'minhaj-muslim', 'منهاج المسلم', 'موسوعة فقهية وعقدية وأخلاقية شاملة للمبتدئ، للشيخ أبي بكر الجزائري', 'الإلمام الشامل بآداب المسلم اليومية وأحكامه', 'foundational', 2, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'minhaj-muslim')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'منهاج المسلم', 'lessons', '0b8d71a0-656e-4d65-b2a3-cbbb50f3adeb', 10, 100, 'watch_percent', 80, 1)
        RETURNING id INTO v_item_id;
      INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name, source_url)
        VALUES (v_item_id, 'منهاج المسلم', 'أبو بكر جابر الجزائري', 'أساسية إلزامية', 'كامل', 'موسوعة شاملة مناسبة للمبتدئ تجمع العقيدة والفقه والأخلاق', 'إسلام ويب', 'https://ar.islamway.net/fatwa/70927/');
    END IF;

    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'building', 'البناء', 'متون الفقه الحنبلي التقليدية (زاد المستقنع وشروحه) وبلوغ المرام', 2
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'building')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'building'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'zad-mustaqni', 'زاد المستقنع', 'متن الحجاوي، أشهر المتون الحنبلية المعاصرة دراسةً', 'إتقان أبواب الفقه الحنبلي حسب ترتيب زاد المستقنع', 'intermediate', 1, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'zad-mustaqni')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'زاد المستقنع', 'lessons', '208ac0ba-431d-405a-a8eb-f4f20f71431a', 20, 100, 'watch_percent', 80, 1)
        RETURNING id INTO v_item_id;
      INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name, source_url)
        VALUES (v_item_id, 'زاد المستقنع', 'موسى بن أحمد الحجاوي', 'أساسية إلزامية', 'كامل', 'أشهر متون الفقه الحنبلي المعاصر دراسةً، الخطوة التالية بعد فقه العبادات الأساسي', 'منتديات الإمام الآجري / مواقع فقهية متعددة', 'https://feqhweb.com/vb/threads/11170/');
      IF v_prev_course_id IS NOT NULL THEN
        INSERT INTO prerequisites (course_id, requires_course_id) VALUES (v_course_id, v_prev_course_id) ON CONFLICT DO NOTHING;
      END IF;
    END IF;
    v_prev_course_id := v_course_id;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'talkhees-muqni', 'تلخيص مختصر المقنع', 'من متون الفقه الحنبلي التطبيقية', 'التمرّس على تطبيقات الفقه الحنبلي', 'intermediate', 2, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'talkhees-muqni')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'شرح كتاب تلخيص مختصر المقنع', 'lessons', '37f34605-424f-485c-96ed-00cd51f50ad7', 12, 100, 'watch_percent', 80, 1);
    END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'bulugh-maram', 'بلوغ المرام من أدلة الأحكام', 'أحاديث الأحكام لابن حجر العسقلاني — يربط الفقه بأدلته الحديثية مباشرة', 'ربط كل حكم فقهي بدليله الحديثي', 'intermediate', 3, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'bulugh-maram')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'الدورة العلمية التأصيلية — بلوغ المرام من أدلة الأحكام', 'lessons', '3812a87c-34a9-4c82-8d50-8ede059d6691', 18, 100, 'watch_percent', 80, 1)
        RETURNING id INTO v_item_id;
      INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name, source_url)
        VALUES (v_item_id, 'بلوغ المرام من أدلة الأحكام', 'ابن حجر العسقلاني', 'أساسية إلزامية', 'كامل', 'كتاب جيد ومعتمَد لربط الفقه بأدلته الحديثية مباشرة', 'majles.alukah.net', 'https://majles.alukah.net/showthread.php?t=95126');
    END IF;

    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'comparative', 'فقه مقارن وتخصصي', 'دراسة مذاهب فقهية أخرى وموضوعات متخصصة', 3
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'comparative')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'comparative'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'fiqh-hanafi', 'الفقه الحنفي المقارن', 'مدخل مقارن للمذهب الحنفي', 'التعرّف على أصول المذهب الحنفي ومقارنته', 'advanced', 1, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'fiqh-hanafi')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'الفقه الحنفي المقارن', 'lessons', '2a6b1214-a243-441d-bbfe-56a18023d7e7', 10, 100, 'watch_percent', 80, 1);
    END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'fiqh-shafii', 'الفقه الشافعي', 'مدخل للمذهب الشافعي', 'التعرّف على أصول المذهب الشافعي', 'advanced', 2, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'fiqh-shafii')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'الفقه الشافعي', 'lessons', 'd9e11595-f269-428f-924e-1178aed58a1f', 10, 100, 'watch_percent', 80, 1);
    END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'fiqh-women', 'فقه المرأة المسلمة', 'أحكام تختص بالمرأة المسلمة', 'الإلمام بالأحكام الفقهية الخاصة بالمرأة', 'specialist', 3, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'fiqh-women')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'فقه المرأة المسلمة', 'lessons', 'baf60e67-cd46-4538-a0f8-684edf0ddae7', 8, 100, 'watch_percent', 80, 1);
    END IF;

    UPDATE learning_paths SET
      what_you_learn = '["أحكام الطهارة والصلاة والزكاة والصيام والحج","متن زاد المستقنع وتطبيقاته","ربط الأحكام الفقهية بأدلتها من بلوغ المرام"]'::jsonb
    WHERE id = v_path_id;
  END IF;

  -- ═══ 4. الحديث (hadith) ═══
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'hadith';
  IF v_path_id IS NOT NULL THEN
    v_prev_course_id := NULL;
    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'foundations', 'التأسيس', 'الأربعون النووية — المدخل الكلاسيكي لدراسة الحديث', 1
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'foundations')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'foundations'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'arbaeen-nawawiyya', 'الأربعون النووية', 'أربعون حديثًا جامعة لقواعد الدين، للإمام النووي', 'حفظ وفهم الأربعين حديثًا النووية', 'foundational', 1, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'arbaeen-nawawiyya')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'الأربعون النووية', 'lessons', '6454dc34-d7e7-4c41-ae1c-88cc0c4713e7', 10, 100, 'watch_percent', 80, 1)
        RETURNING id INTO v_item_id;
      INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name, source_url)
        VALUES (v_item_id, 'الأربعون النووية', 'يحيى بن شرف النووي', 'أساسية إلزامية', 'كامل — 42 حديثًا', 'المدخل التقليدي الأشهر لدراسة الحديث، يجمع قواعد الدين الكبرى', 'binbaz.org.sa', 'https://binbaz.org.sa/fatwas/14078/');
    END IF;
    v_prev_course_id := v_course_id;

    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'building', 'البناء', 'رياض الصالحين والدورات التأصيلية', 2
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'building')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'building'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'riyadh-saliheen', 'رياض الصالحين', 'موسوعة أحاديث الآداب والأخلاق والرقائق للنووي', 'التوسع في أحاديث الآداب والرقائق', 'intermediate', 1, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'riyadh-saliheen')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'رياض الصالحين', 'lessons', 'e00f40d1-6e06-4ac2-afde-fe782c1bda04', 24, 100, 'watch_percent', 80, 1)
        RETURNING id INTO v_item_id;
      INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name, source_url)
        VALUES (v_item_id, 'رياض الصالحين', 'يحيى بن شرف النووي', 'أساسية إلزامية', 'كامل', 'الخطوة الطبيعية بعد الأربعين النووية لنفس المؤلف', 'binbaz.org.sa', 'https://binbaz.org.sa/fatwas/14078/');
      IF v_prev_course_id IS NOT NULL THEN
        INSERT INTO prerequisites (course_id, requires_course_id) VALUES (v_course_id, v_prev_course_id) ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'sunnah-vs-science', 'دعوى تعارض السنة مع العلم التجريبي', 'دورة تأصيلية للرد على شبهة تعارض السنة النبوية مع العلم', 'الرد على شبهات التشكيك في السنة النبوية', 'intermediate', 2, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'sunnah-vs-science')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'الدورة العلمية التأصيلية — قراءة في كتاب دعوى تعارض السنة النبوية مع العلم التجريبي', 'lessons', '14313e42-4025-4045-9599-f7d218a96c70', 8, 100, 'watch_percent', 80, 1);
    END IF;

    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'advanced', 'التوسع', 'الصحيحان — البخاري ومسلم', 3
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'advanced')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'advanced'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'sahih-bukhari', 'صحيح البخاري', 'أصح كتاب بعد كتاب الله', 'قراءة معمّقة في صحيح البخاري', 'advanced', 1, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'sahih-bukhari')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'صحيح البخاري', 'lessons', 'a3c2336a-201f-43a6-999d-d00780f6b68b', 30, 100, 'watch_percent', 80, 1);
    END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'sahih-muslim', 'صحيح مسلم', 'ثاني أصح الكتب بعد صحيح البخاري', 'قراءة معمّقة في صحيح مسلم', 'advanced', 2, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'sahih-muslim')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'قراءة كتاب صحيح مسلم', 'lessons', '5c770d7e-be7c-4043-a9bd-9937eb5902c8', 28, 70, 'watch_percent', 80, 1);
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'قراءة كتاب صحيح مسلم - الحديث 989', 'lessons', '8aa2cb01-2555-4708-9ba3-5a9db7f64645', 2, 30, 'watch_percent', 80, 2);
    END IF;

    UPDATE learning_paths SET
      what_you_learn = '["الأربعون النووية حفظًا وفهمًا","أحاديث الآداب والرقائق من رياض الصالحين","قراءة معمّقة في الصحيحين"]'::jsonb
    WHERE id = v_path_id;
  END IF;

  -- ═══ 5. مصطلح الحديث (mustalah-hadith) ═══
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'mustalah-hadith';
  IF v_path_id IS NOT NULL THEN
    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'foundations', 'التأسيس', 'مدخل مصطلح الحديث', 1
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'foundations')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'foundations'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'mustalah-intro', 'مصطلح الحديث', 'مدخل إلى أنواع الحديث ومراتب الأسانيد، عبر المنظومة البيقونية', 'ضبط أهم مصطلحات علم الحديث الأساسية', 'foundational', 1, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'mustalah-intro')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'مصطلح الحديث', 'lessons', 'aff6d9e5-1c4e-421c-a405-9dbf015bf174', 10, 100, 'watch_percent', 80, 1)
        RETURNING id INTO v_item_id;
      INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name, source_url)
        VALUES (v_item_id, 'المنظومة البيقونية', 'طه الفتحي البيقوني', 'أساسية إلزامية', 'كامل', 'من أشهر المداخل للمبتدئ في علم مصطلح الحديث', 'alaliyahacademy.com', 'https://www.alaliyahacademy.com/course/48');
    END IF;
    v_prev_course_id := v_course_id;

    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'advanced', 'التوسع', 'نخبة الفكر — المرحلة المتقدمة (قيد المراجعة العلمية)', 2
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'advanced')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'advanced'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, status, outcomes)
      SELECT v_stage_id, 'nukhbat-fikr', 'نخبة الفكر', 'متن ابن حجر العسقلاني المتقدم في مصطلح الحديث — لا يوجد بعد درس/محتوى مرتبط في المنصة، بانتظار مراجعة علمية وربط محتوى حقيقي', 'إتقان مصطلحات مصطلح الحديث المتقدمة', 'advanced', 1, 'needs_review', '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'nukhbat-fikr')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL AND v_prev_course_id IS NOT NULL THEN
      INSERT INTO prerequisites (course_id, requires_course_id) VALUES (v_course_id, v_prev_course_id) ON CONFLICT DO NOTHING;
    END IF;

    UPDATE learning_paths SET
      what_you_learn = '["أنواع الحديث ومراتب الأسانيد الأساسية عبر البيقونية"]'::jsonb
    WHERE id = v_path_id;
  END IF;

  -- ═══ 6. التفسير (tafseer) ═══
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'tafseer';
  IF v_path_id IS NOT NULL THEN
    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'foundations', 'التأسيس', 'مدخل عام إلى تفسير القرآن الكريم', 1
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'foundations')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'foundations'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'tafsir-general', 'تفسير القرآن الكريم', 'مدخل عام لمنهج التفسير', 'الإلمام بمنهج تفسير القرآن العام', 'foundational', 1, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'tafsir-general')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'تفسير القرآن الكريم', 'lessons', '3a6d1b4c-7492-4fc2-b7e3-ec9f3f2e248b', 20, 100, 'watch_percent', 80, 1);
    END IF;
    v_prev_course_id := v_course_id;

    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'surahs', 'تفسير سور مختارة', 'تفسير تطبيقي لسور مختارة', 2
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'surahs')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'surahs'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'tafsir-kahf', 'تفسير سورة الكهف', 'تفسير تطبيقي لسورة الكهف', 'إتقان تفسير سورة الكهف وفوائدها', 'intermediate', 1, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'tafsir-kahf')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'تفسير سورة الكهف', 'lessons', '51bdbef6-52e3-4d72-885f-edb4cc22149f', 6, 100, 'watch_percent', 80, 1);
      IF v_prev_course_id IS NOT NULL THEN
        INSERT INTO prerequisites (course_id, requires_course_id) VALUES (v_course_id, v_prev_course_id) ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'tafsir-nahl', 'تفسير سورة النحل', 'تفسير تطبيقي لسورة النحل', 'إتقان تفسير سورة النحل وفوائدها', 'intermediate', 2, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'tafsir-nahl')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'تفسير سورة النحل', 'lessons', '0886d9b3-a781-47f5-9657-3068314920b8', 6, 70, 'watch_percent', 80, 1);
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'تفسير سورة النحل - الآية 40 فما بعدها', 'lessons', 'b5a70f72-155e-4724-a97d-f87d8d5072cc', 3, 30, 'watch_percent', 80, 2);
    END IF;

    UPDATE learning_paths SET
      what_you_learn = '["منهج تفسير القرآن العام","تفسير تطبيقي لسورتي الكهف والنحل"]'::jsonb
    WHERE id = v_path_id;
  END IF;

  -- ═══ 7. السيرة (seerah) ═══
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'seerah';
  IF v_path_id IS NOT NULL THEN
    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'foundations', 'التأسيس', 'مدخل إلى السيرة النبوية', 1
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'foundations')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'foundations'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'seerah-intro', 'السيرة النبوية', 'مدخل عام لسيرة النبي ﷺ', 'الإلمام بأهم أحداث السيرة النبوية', 'foundational', 1, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'seerah-intro')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'السيرة النبوية', 'lessons', 'd9795c35-5342-4b79-a27c-129771ef1cb0', 14, 100, 'watch_percent', 80, 1);
    END IF;
    v_prev_course_id := v_course_id;

    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'advanced', 'التوسع', 'دراسة معمَّقة للسيرة', 2
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'advanced')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'advanced'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, outcomes)
      SELECT v_stage_id, 'seerah-deep', 'السيرة النبوية المعمقة', 'دراسة تحليلية معمّقة للسيرة النبوية', 'استخلاص الدروس والفقه من أحداث السيرة', 'advanced', 1, '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'seerah-deep')
      RETURNING id INTO v_course_id;
    IF v_course_id IS NOT NULL THEN
      INSERT INTO course_units (course_id, title, sort_order) VALUES (v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;
      INSERT INTO learning_items (unit_id, item_type, title, content_ref_table, content_ref_id, session_estimate, weight, completion_method, completion_threshold, sort_order)
        VALUES (v_unit_id, 'lesson', 'السيرة النبوية المعمقة', 'lessons', 'd8e8ae3f-64fa-4c5b-9129-731cd0fafa46', 16, 100, 'watch_percent', 80, 1);
      IF v_prev_course_id IS NOT NULL THEN
        INSERT INTO prerequisites (course_id, requires_course_id) VALUES (v_course_id, v_prev_course_id) ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    UPDATE learning_paths SET
      what_you_learn = '["أهم أحداث السيرة النبوية بالترتيب","دراسة تحليلية معمّقة لفقه السيرة"]'::jsonb
    WHERE id = v_path_id;
  END IF;

  -- ═══ المسارات الثمانية المتبقية — بنية هيكلية فقط، بلا محتوى حقيقي بعد ═══
  -- (usool-fiqh, uloom-quran, adab, akhlaq, arabic, nahw, dawah, tarbiyah)
  -- تُترَك بمرحلة واحدة ومقرر واحد بحالة needs_review (لا يظهر للمستخدم
  -- النهائي، مرئي للمشرف فقط) بدل اختلاق محتوى — يحتاج ربط دروس/كتب حقيقية
  -- لاحقًا من مصدر موثوق قبل النشر الفعلي.
  FOR v_path_id IN
    SELECT id FROM learning_paths WHERE slug IN ('usool-fiqh','uloom-quran','adab','akhlaq','arabic','nahw','dawah','tarbiyah')
  LOOP
    INSERT INTO path_stages (path_id, slug, title, description, sort_order)
      SELECT v_path_id, 'pending-content', 'قيد الإعداد', 'هذا المسار قيد المراجعة العلمية — لم يُربَط بعد بمحتوى حقيقي معتمد. سيُضاف قريبًا.', 1
      WHERE NOT EXISTS (SELECT 1 FROM path_stages WHERE path_id = v_path_id AND slug = 'pending-content')
      RETURNING id INTO v_stage_id;
    IF v_stage_id IS NULL THEN SELECT id INTO v_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'pending-content'; END IF;

    INSERT INTO courses (stage_id, slug, title, description, learning_goal, level, sort_order, status, outcomes)
      SELECT v_stage_id, 'pending-content', 'محتوى قيد المراجعة العلمية', 'لم تُضَف بعد دروس أو كتب حقيقية معتمدة لهذا المقرر.', NULL, 'foundational', 1, 'needs_review', '[]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM courses WHERE stage_id = v_stage_id AND slug = 'pending-content');
  END LOOP;

END $$;
