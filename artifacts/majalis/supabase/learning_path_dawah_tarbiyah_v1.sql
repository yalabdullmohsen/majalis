-- ═══════════════════════════════════════════════════════════════════════════
-- learning_path_dawah_tarbiyah_v1.sql
--
-- سياق: آخر مسارين من السبعة الأصلية الفارغة تماماً (`dawah`، `tarbiyah`)
-- — كلاهما placeholder صريح "قيد الإعداد"، يُحذف قبل الإدراج كالمعتاد.
-- لا تصنيف مخصَّص لـ"دعوة" أو "تربية" في library-catalog.ts (تحقّقتُ:
-- التصنيفات المتاحة 17 تصنيفاً، لا واحد منها بهذين الاسمين) — بُنيت
-- المساران بربط بكتب حقيقية من تصنيفات قريبة موضوعياً بدل إضافة كتب
-- جديدة غير ضرورية هذه الدفعة:
--   • dawah = منهج الدعوة النبوية، مُستخرَج من كتب "سيرة" (الرحيق
--     المختوم، السيرة النبوية لابن هشام، زاد المعاد).
--   • tarbiyah = تزكية النفس وبناء الشخصية، من "إحياء علوم الدين"
--     (تصنيف رقائق) و"مدارج السالكين" (تصنيف آداب) — **بمنازل مختلفة
--     تماماً عمّا استُخدم من نفس الكتاب في مسار adab** (هناك: التوبة/
--     الإخلاص/الصبر — هنا: الرضا/الشكر، تحقّقتا عبر WebSearch كفصلين
--     منفصلين حقيقيين في الكتاب، لا تكرار محتوى).
--
-- التحقق العلمي (WebSearch مباشر هذه الجلسة قبل الكتابة):
--   • "مدارج السالكين": فصل "منزلة الرضا" وفصل "منزلة الشكر" مؤكَّدان
--     كفصلين منفصلين حقيقيين في الكتاب (islamweb، shamela) — مختلفان
--     تماماً عن منازل التوبة/الإخلاص/الصبر المستخدَمة في adab.
--   • "إحياء علوم الدين": بنيته الفعلية أربعة أرباع مؤكَّدة (العبادات/
--     العادات/المهلكات/المنجيات)، كل ربع عشرة كتب — مؤكَّد عبر ويكيبيديا
--     العربية ومصادر متعددة متطابقة.
--   • آيتا الدعوة مستخرَجتان حرفياً من الملفات المحلية: النحل:125
--     (المنهج: الحكمة والموعظة الحسنة والجدال بالتي هي أحسن)، ويوسف:108
--     (الدعوة على بصيرة).
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
  v_i1 uuid; v_i2 uuid;
BEGIN
  -- ═══════════ مسار dawah (الدعوة) ═══════════════════════════════════
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'dawah';
  IF v_path_id IS NULL THEN RAISE EXCEPTION 'مسار dawah غير موجود'; END IF;

  IF NOT EXISTS (SELECT 1 FROM courses WHERE slug = 'dawah-raheeq') THEN
    SELECT id INTO v_old_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'pending-content';
    IF v_old_stage_id IS NOT NULL THEN DELETE FROM path_stages WHERE id = v_old_stage_id; END IF;

    -- التأسيس: الرحيق المختوم
    INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
    VALUES (gen_random_uuid(), v_path_id, 'foundations', 'التأسيس',
      'مراحل الدعوة النبوية الأولى (السرية ثم الجهرية) عبر "الرحيق المختوم" — الحائز على جائزة رابطة العالم الإسلامي الأولى في السيرة.',
      1, 'published') RETURNING id INTO v_stage1_id;

    INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
    VALUES (gen_random_uuid(), v_stage1_id, 'dawah-raheeq', 'مراحل الدعوة النبوية الأولى',
      'قراءة موجَّهة في مرحلتي الدعوة السرية والجهرية من "الرحيق المختوم".',
      'معرفة مدة الدعوة السرية وأسبابها، ومعرفة الحكمة من التدرج من السرية إلى الجهرية.',
      'foundational', 1, 70,
      '["معرفة مراحل الدعوة النبوية الأولى بالترتيب","معرفة الحكمة من التدرج في الدعوة (السرية ثم الجهرية)"]'::jsonb,
      'published') RETURNING id INTO v_course_id;

    INSERT INTO course_units (id, course_id, title, sort_order) VALUES (gen_random_uuid(), v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;

    INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
    VALUES (gen_random_uuid(), v_unit_id, 'book', 'الدعوة السرية',
      'من "الرحيق المختوم": بدأت الدعوة النبوية سرية بين المقربين من أهل بيته وأصحابه، استمرت نحو ثلاث سنوات، حكمةً من الله في تهيئة نواة مؤمنة قوية قبل مواجهة قريش علانية.',
      1, 50, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i1;

    INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
    VALUES (gen_random_uuid(), v_unit_id, 'book', 'الجهر بالدعوة',
      'من "الرحيق المختوم": بعد نزول قوله تعالى ﴿فَٱصْدَعْ بِمَا تُؤْمَرُ﴾ (الحجر: 94) انتقلت الدعوة إلى مرحلة العلن، بدءاً بدعوة العشيرة الأقربين ثم عموم قريش — وهي المرحلة التي بدأ فيها الأذى المباشر للنبي ﷺ وأصحابه.',
      1, 50, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i2;

    INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name) VALUES
      (gen_random_uuid(), v_i1, 'الرحيق المختوم', 'الشيخ صفي الرحمن المباركفوري', 'أساسية إلزامية', 'مرحلة الدعوة السرية', 'حائز جائزة رابطة العالم الإسلامي الأولى في السيرة — موجود في مكتبة المنصة (/library/book-raheeq)', 'مكتبة المجلس العلمي'),
      (gen_random_uuid(), v_i2, 'الرحيق المختوم', 'الشيخ صفي الرحمن المباركفوري', 'أساسية إلزامية', 'مرحلة الجهر بالدعوة', 'حائز جائزة رابطة العالم الإسلامي الأولى في السيرة — موجود في مكتبة المنصة (/library/book-raheeq)', 'مكتبة المجلس العلمي');

    -- البناء: السيرة النبوية لابن هشام
    INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
    VALUES (gen_random_uuid(), v_path_id, 'building', 'البناء',
      'دعوة النبي ﷺ للقبائل والهجرة كنقطة تحول منهجي، عبر "السيرة النبوية" لابن هشام — أشهر كتب السيرة على الإطلاق.',
      2, 'published') RETURNING id INTO v_stage2_id;

    DECLARE v_c2 uuid; v_u2 uuid; v_i3 uuid; v_i4 uuid;
    BEGIN
      INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
      VALUES (gen_random_uuid(), v_stage2_id, 'dawah-ibn-hisham', 'دعوة القبائل والهجرة',
        'قراءة موجَّهة في عرض النبي ﷺ نفسه على القبائل، والهجرة كتحوّل في منهج الدعوة.',
        'معرفة أسلوب النبي ﷺ في عرض الدعوة على القبائل في مواسم الحج، ومعرفة أثر الهجرة على اتساع نطاق الدعوة.',
        'intermediate', 1, 70,
        '["معرفة أسلوب عرض النبي ﷺ نفسه على القبائل في المواسم","معرفة الفرق بين منهج الدعوة قبل الهجرة وبعدها"]'::jsonb,
        'published') RETURNING id INTO v_c2;
      INSERT INTO course_units (id, course_id, title, sort_order) VALUES (gen_random_uuid(), v_c2, 'الدروس', 1) RETURNING id INTO v_u2;
      INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
      VALUES (gen_random_uuid(), v_u2, 'book', 'عرض النبي ﷺ نفسه على القبائل',
        'من "السيرة النبوية" لابن هشام: كان النبي ﷺ يعرض نفسه على القبائل الوافدة لمكة في مواسم الحج، يدعوهم إلى الله ويطلب منهم النصرة والحماية — حتى استجابت له نفر من أهل يثرب فكانت بيعتا العقبة الأولى والثانية.',
        1, 50, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i3;
      INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
      VALUES (gen_random_uuid(), v_u2, 'book', 'الهجرة كتحوّل في منهج الدعوة',
        'من "السيرة النبوية" لابن هشام: مثّلت الهجرة إلى المدينة نقلة نوعية في منهج الدعوة — من مرحلة الدعوة الفردية وسط عداء قريش، إلى مرحلة بناء مجتمع مسلم متكامل له كيان ونظام.',
        1, 50, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i4;
      INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name) VALUES
        (gen_random_uuid(), v_i3, 'السيرة النبوية', 'ابن هشام الحميري', 'أساسية إلزامية', 'دعوة القبائل وبيعتا العقبة', 'أشهر كتب السيرة النبوية على الإطلاق — موجود في مكتبة المنصة (/library/book-seerah-ibn-hisham)', 'مكتبة المجلس العلمي'),
        (gen_random_uuid(), v_i4, 'السيرة النبوية', 'ابن هشام الحميري', 'أساسية إلزامية', 'الهجرة إلى المدينة', 'أشهر كتب السيرة النبوية على الإطلاق — موجود في مكتبة المنصة (/library/book-seerah-ibn-hisham)', 'مكتبة المجلس العلمي');
    END;

    -- التوسع: زاد المعاد
    INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
    VALUES (gen_random_uuid(), v_path_id, 'advanced', 'التوسع',
      'استخلاص منهج الحوار والتدرج في الدعوة النبوية، عبر "زاد المعاد" لابن القيم.',
      3, 'published') RETURNING id INTO v_stage3_id;

    DECLARE v_c3 uuid; v_u3 uuid; v_i5 uuid;
    BEGIN
      INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
      VALUES (gen_random_uuid(), v_stage3_id, 'dawah-zad-maad', 'منهج الحوار والتدرج',
        'قراءة موجَّهة في منهج النبي ﷺ بالحكمة والموعظة الحسنة والجدال بالتي هي أحسن، عبر "زاد المعاد" لابن القيم.',
        'معرفة الأصل القرآني لمنهج الدعوة (الحكمة والموعظة والجدال بالتي هي أحسن) ومعرفة معنى الدعوة على بصيرة.',
        'advanced', 1, 70,
        '["معرفة الأصل القرآني الثلاثي لمنهج الدعوة","معرفة معنى الدعوة على بصيرة لا بتقليد أو جهل"]'::jsonb,
        'published') RETURNING id INTO v_c3;
      INSERT INTO course_units (id, course_id, title, sort_order) VALUES (gen_random_uuid(), v_c3, 'الدروس', 1) RETURNING id INTO v_u3;
      INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
      VALUES (gen_random_uuid(), v_u3, 'book', 'الحكمة والموعظة الحسنة والجدال بالتي هي أحسن',
        'الأصل القرآني لمنهج الدعوة كله. قال تعالى: ﴿ٱدْعُ إِلَىٰ سَبِيلِ رَبِّكَ بِٱلْحِكْمَةِ وَٱلْمَوْعِظَةِ ٱلْحَسَنَةِ وَجَٰدِلْهُم بِٱلَّتِى هِىَ أَحْسَنُ﴾ (سورة النحل: 125) — استخلص ابن القيم في زاد المعاد من سيرة النبي ﷺ تطبيقات عملية لهذه الأصول الثلاثة بحسب حال المدعو.',
        1, 100, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i5;
      INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name) VALUES
        (gen_random_uuid(), v_i5, 'زاد المعاد', 'الإمام ابن قيم الجوزية', 'مادة مساندة', 'هدي النبي ﷺ في الدعوة', 'طب نبوي شامل في السيرة والفقه والآداب والدعوة — موجود في مكتبة المنصة (/library/book-zad)', 'مكتبة المجلس العلمي');
    END;

    UPDATE learning_paths SET status = 'published', total_sessions = 5, updated_at = now() WHERE id = v_path_id;
    RAISE NOTICE 'dawah: path_id=%', v_path_id;
  ELSE
    RAISE NOTICE 'dawah مُنجَز مسبقاً — تخطّي';
  END IF;

  -- ═══════════ مسار tarbiyah (التربية) ════════════════════════════════
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'tarbiyah';
  IF v_path_id IS NULL THEN RAISE EXCEPTION 'مسار tarbiyah غير موجود'; END IF;

  IF NOT EXISTS (SELECT 1 FROM courses WHERE slug = 'tarbiyah-muhlikat') THEN
    SELECT id INTO v_old_stage_id FROM path_stages WHERE path_id = v_path_id AND slug = 'pending-content';
    IF v_old_stage_id IS NOT NULL THEN DELETE FROM path_stages WHERE id = v_old_stage_id; END IF;

    -- التأسيس: إحياء علوم الدين — ربع المهلكات
    INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
    VALUES (gen_random_uuid(), v_path_id, 'foundations', 'التأسيس',
      'التعرّف على آفات النفس ومواطن ضعفها، عبر "ربع المهلكات" من "إحياء علوم الدين" للغزالي.',
      1, 'published') RETURNING id INTO v_stage1_id;

    INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
    VALUES (gen_random_uuid(), v_stage1_id, 'tarbiyah-muhlikat', 'آفات النفس',
      'قراءة موجَّهة في مباحث الغضب والشح من ربع المهلكات في "إحياء علوم الدين".',
      'معرفة آفتي الغضب والشح كمواطن ضعف رئيسية في النفس، ومعرفة طريق علاجهما.',
      'foundational', 1, 70,
      '["معرفة خطر آفة الغضب على النفس والعلاقات","معرفة خطر آفة الشح وطريق علاجه"]'::jsonb,
      'published') RETURNING id INTO v_course_id;

    INSERT INTO course_units (id, course_id, title, sort_order) VALUES (gen_random_uuid(), v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;

    INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
    VALUES (gen_random_uuid(), v_unit_id, 'book', 'آفة الغضب وعلاجها',
      'من "ربع المهلكات" في إحياء علوم الدين: الغضب ثوران في النفس يطلب دفع ما يؤذيها، وعلاجه بالعلم (معرفة فضل الحلم وذم الغضب) والعمل (كظم الغيظ، تغيير الوضع كالجلوس من القيام، الوضوء).',
      1, 50, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i1;

    INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
    VALUES (gen_random_uuid(), v_unit_id, 'book', 'آفة الشح وعلاجه',
      'من "ربع المهلكات" في إحياء علوم الدين: الشح إمساك المال عن الحق الواجب فيه خوفاً من الفقر، وهو من مهلكات النفس. علاجه بمعرفة أن الرزق مقسوم، وبالتدرّب على الإنفاق شيئاً فشيئاً حتى يصير السخاء عادة.',
      1, 50, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i2;

    INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name) VALUES
      (gen_random_uuid(), v_i1, 'إحياء علوم الدين', 'حجة الإسلام أبو حامد الغزالي', 'أساسية إلزامية', 'ربع المهلكات — كتاب ذم الغضب', 'موسوعة في تزكية النفس تُعدّ من أجمع الكتب في هذا الميدان — موجود في مكتبة المنصة (/library/book-ihya)', 'مكتبة المجلس العلمي'),
      (gen_random_uuid(), v_i2, 'إحياء علوم الدين', 'حجة الإسلام أبو حامد الغزالي', 'أساسية إلزامية', 'ربع المهلكات — كتاب ذم الشح', 'موسوعة في تزكية النفس تُعدّ من أجمع الكتب في هذا الميدان — موجود في مكتبة المنصة (/library/book-ihya)', 'مكتبة المجلس العلمي');

    -- البناء: إحياء علوم الدين — ربع المنجيات
    INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
    VALUES (gen_random_uuid(), v_path_id, 'building', 'البناء',
      'الفضائل المنجية، عبر "ربع المنجيات" من "إحياء علوم الدين" للغزالي.',
      2, 'published') RETURNING id INTO v_stage2_id;

    DECLARE v_c2b uuid; v_u2b uuid; v_i3b uuid; v_i4b uuid;
    BEGIN
      INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
      VALUES (gen_random_uuid(), v_stage2_id, 'tarbiyah-munjiyat', 'الفضائل المنجية',
        'قراءة موجَّهة في مبحثي الصبر والتوبة من ربع المنجيات في "إحياء علوم الدين".',
        'معرفة منزلة الصبر والتوبة كفضيلتين منجيتين من النار.',
        'intermediate', 1, 70,
        '["معرفة منزلة الصبر كفضيلة منجية","معرفة شروط التوبة وأثرها في تزكية النفس"]'::jsonb,
        'published') RETURNING id INTO v_c2b;
      INSERT INTO course_units (id, course_id, title, sort_order) VALUES (gen_random_uuid(), v_c2b, 'الدروس', 1) RETURNING id INTO v_u2b;
      INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
      VALUES (gen_random_uuid(), v_u2b, 'book', 'الصبر ومنزلته المنجية',
        'من "ربع المنجيات" في إحياء علوم الدين: الصبر حبس النفس عن الجزع، وهو نصف الإيمان (النصف الآخر الشكر) عند كثير من أهل العلم، وهو من أعظم أسباب النجاة يوم القيامة.',
        1, 50, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i3b;
      INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
      VALUES (gen_random_uuid(), v_u2b, 'book', 'التوبة والخوف من الله',
        'من "ربع المنجيات" في إحياء علوم الدين: التوبة الرجوع عن المعصية إلى الطاعة، والخوف من الله باعث يمنع من الوقوع في المحارم — كلاهما من الفضائل المنجية التي عُقد لها كتاب مستقل في هذا الربع.',
        1, 50, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i4b;
      INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name) VALUES
        (gen_random_uuid(), v_i3b, 'إحياء علوم الدين', 'حجة الإسلام أبو حامد الغزالي', 'أساسية إلزامية', 'ربع المنجيات — كتاب الصبر والشكر', 'موسوعة في تزكية النفس تُعدّ من أجمع الكتب في هذا الميدان — موجود في مكتبة المنصة (/library/book-ihya)', 'مكتبة المجلس العلمي'),
        (gen_random_uuid(), v_i4b, 'إحياء علوم الدين', 'حجة الإسلام أبو حامد الغزالي', 'أساسية إلزامية', 'ربع المنجيات — كتابا التوبة والخوف', 'موسوعة في تزكية النفس تُعدّ من أجمع الكتب في هذا الميدان — موجود في مكتبة المنصة (/library/book-ihya)', 'مكتبة المجلس العلمي');
    END;

    -- التوسع: مدارج السالكين — منازل مختلفة عمّا استُخدم في adab
    INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
    VALUES (gen_random_uuid(), v_path_id, 'advanced', 'التوسع',
      'منزلتا الرضا والشكر من "مدارج السالكين" لابن القيم — منازل مختلفة تماماً عمّا استُخدم من الكتاب نفسه في مسار الآداب.',
      3, 'published') RETURNING id INTO v_stage3_id;

    DECLARE v_c3b uuid; v_u3b uuid; v_i5b uuid; v_i6b uuid;
    BEGIN
      INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
      VALUES (gen_random_uuid(), v_stage3_id, 'tarbiyah-rida-shukr', 'منزلتا الرضا والشكر',
        'قراءة موجَّهة في منزلتي الرضا والشكر من "مدارج السالكين" لابن القيم.',
        'معرفة حقيقة الرضا بالقضاء ومراتبه، ومعرفة حقيقة الشكر والفرق بينه وبين الحمد.',
        'advanced', 1, 70,
        '["معرفة مراتب الرضا: رضا العامة، والرضا عن الله، والرضا برضا الله","معرفة الفرق بين الشكر والحمد ومراتب الشكر"]'::jsonb,
        'published') RETURNING id INTO v_c3b;
      INSERT INTO course_units (id, course_id, title, sort_order) VALUES (gen_random_uuid(), v_c3b, 'الدروس', 1) RETURNING id INTO v_u3b;
      INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
      VALUES (gen_random_uuid(), v_u3b, 'book', 'منزلة الرضا',
        'من "مدارج السالكين": فصل مستقل في منزلة الرضا بمراتبه الثلاث — رضا العامة (الرضا بقضاء الله)، ورضا الخاصة (الرضا عن الله)، ورضا خاصة الخاصة (الرضا برضا الله عن العبد).',
        1, 50, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i5b;
      INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
      VALUES (gen_random_uuid(), v_u3b, 'book', 'منزلة الشكر',
        'من "مدارج السالكين": فصل مستقل في منزلة الشكر — أصله اللغوي، والفرق بين الشكر والحمد، ومراتبه الثلاث: الشكر على النعم، والشكر في الشدائد، وأعلاها ألّا يشهد العبد إلا المُنعِم سبحانه.',
        1, 50, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i6b;
      INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name) VALUES
        (gen_random_uuid(), v_i5b, 'مدارج السالكين بين منازل إياك نعبد وإياك نستعين', 'الإمام ابن قيم الجوزية', 'مادة مساندة', 'منزلة الرضا (فصل مستقل، غير مستخدَم في مسار adab)', 'شرح موسّع لمنازل السائرين للهروي — موجود في مكتبة المنصة (/library/book-madarij)', 'مكتبة المجلس العلمي'),
        (gen_random_uuid(), v_i6b, 'مدارج السالكين بين منازل إياك نعبد وإياك نستعين', 'الإمام ابن قيم الجوزية', 'مادة مساندة', 'منزلة الشكر (فصل مستقل، غير مستخدَم في مسار adab)', 'شرح موسّع لمنازل السائرين للهروي — موجود في مكتبة المنصة (/library/book-madarij)', 'مكتبة المجلس العلمي');
    END;

    UPDATE learning_paths SET status = 'published', total_sessions = 6, updated_at = now() WHERE id = v_path_id;
    RAISE NOTICE 'tarbiyah: path_id=%', v_path_id;
  ELSE
    RAISE NOTICE 'tarbiyah مُنجَز مسبقاً — تخطّي';
  END IF;
END $$;
