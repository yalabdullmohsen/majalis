-- ═══════════════════════════════════════════════════════════════════════════
-- learning_path_usool_fiqh_pilot_v1.sql
--
-- سياق: 8 من 15 مساراً علمياً في learning_paths مُعلَّمة status='published'
-- لكن total_sessions=0 فعلياً (لا محتوى منشور) — منها "أصول الفقه"
-- (usool-fiqh)، وهو الأهم لأنه مصنَّف level='advanced' رغم فراغه الكامل.
-- الواجهة تتعامل مع هذا بأمانة (رسالة "قيد المراجعة العلمية، لم يُنشَر
-- محتواه بعد" بدل صفحة بيضاء) لكن الفجوة حقيقية.
--
-- هذا الملف مسار تجريبي أول (pilot) يثبت النمط: مرحلة تأسيسية واحدة، مقرر
-- واحد، وحدة واحدة، 3 عناصر تعليمية — كل عنصر مربوط بكتاب حقيقي موجود
-- فعلاً في مكتبة المنصة (src/lib/library-catalog.ts) بدل اختراع محتوى
-- جديد، تطبيقاً لتوجيه "اربط بالكتب/الدروس الموجودة فعلاً أولاً". الكتاب
-- المختار: "الورقات في أصول الفقه" للجويني — المتن التقليدي القياسي الذي
-- يُدرَّس أولاً للمبتدئين في هذا الفن بالمعاهد الشرعية (ليس متناً متقدماً
-- كـ"روضة الناظر" أو "المستصفى" الموجودين أيضاً بالمكتبة لمراحل لاحقة).
--
-- ملاحظة معمارية مهمة (اكتُشفت أثناء بناء هذا الملف): جدول learning_items
-- له حقول content_ref_table/content_ref_id/external_url لكن الواجهة
-- (src/lib/learning-paths-service.ts سطر ~191) لا تستعلمها حالياً أصلاً —
-- التتبع الفعلي للتقدّم "إكمال ذاتي" (زر "إكمال" فقط) بلا مُشغِّل محتوى
-- مضمَّن. الربط الحقيقي الوحيد الفعّال بمحتوى موجود هو عبر جدول
-- course_books (يُعرض كـ"شريحة كتاب" في واجهة المقرر). لذلك اعتُمد هذا
-- المسار: كل عنصر تعليمي = قراءة موجَّهة في فصل من الكتاب الحقيقي، لا
-- "درس فيديو" وهمي غير موجود. هذا محدود بحدود المخطط الحالي فعلاً، وليس
-- قصوراً في هذا الملف.
--
-- بعد التطبيق: يجب تحديث learning_paths.total_sessions لمسار usool-fiqh
-- يدوياً (لا trigger يحسبه تلقائياً — تحقّقتُ من عدم وجود أي trigger على
-- الجداول الأربعة ذات الصلة).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_path_id uuid;
  v_stage_id uuid;
  v_course_id uuid;
  v_unit_id uuid;
  v_item1_id uuid;
  v_item2_id uuid;
  v_item3_id uuid;
BEGIN
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'usool-fiqh';
  IF v_path_id IS NULL THEN
    RAISE EXCEPTION 'مسار usool-fiqh غير موجود — لا يوجد شيء لربطه به';
  END IF;

  INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
  VALUES (gen_random_uuid(), v_path_id, 'foundations', 'التأسيس',
    'المدخل الأول لعلم أصول الفقه: تعريفه وموضوعه وأدلته الأصلية، عبر متن الورقات للجويني — المتن القياسي المُدرَّس أولاً في هذا الفن.',
    1, 'published')
  RETURNING id INTO v_stage_id;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage_id, 'waraqat-intro', 'المدخل إلى أصول الفقه — متن الورقات',
    'قراءة موجَّهة في متن "الورقات في أصول الفقه" لإمام الحرمين الجويني، أشهر متن تأسيسي في هذا العلم.',
    'فهم تعريف أصول الفقه وموضوعه، والتمييز بين الأحكام التكليفية الخمسة، ومعرفة الأدلة الأصلية للأحكام الشرعية (الكتاب والسنة).',
    'foundational', 1, 70,
    '["تعريف أصول الفقه وثمرته","التمييز بين الأحكام التكليفية الخمسة (الواجب، المندوب، المباح، المكروه، المحرَّم)","معرفة الأدلة الأصلية المتفق عليها للأحكام الشرعية"]'::jsonb,
    'published')
  RETURNING id INTO v_course_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course_id, 'الدروس', 1)
  RETURNING id INTO v_unit_id;

  INSERT INTO learning_items
    (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book',
     'تعريف أصول الفقه وموضوعه وثمرته',
     'قراءة مقدمة الورقات: تعريف الفقه لغة واصطلاحاً، تعريف أصول الفقه، وثمرة دراسته (القدرة على استنباط الأحكام من أدلتها التفصيلية).',
     1, 34, true, 'manual_confirm', 100, 1, 'published', true)
    RETURNING id INTO v_item1_id;

  INSERT INTO learning_items
    (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book',
     'الأحكام التكليفية الخمسة',
     'قراءة باب الأحكام في الورقات: الواجب والمندوب والمباح والمكروه والمحرَّم، مع ضوابط كل حكم وأمثلته.',
     1, 33, true, 'manual_confirm', 100, 2, 'published', true)
    RETURNING id INTO v_item2_id;

  INSERT INTO learning_items
    (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book',
     'الأدلة الأصلية للأحكام: الكتاب والسنة',
     'قراءة أبواب الكتاب والسنة من الورقات: حجية القرآن والسنة كأصلين متفق عليهما، وأقسام السنة (قولية وفعلية وتقريرية).',
     1, 33, true, 'manual_confirm', 100, 3, 'published', true)
    RETURNING id INTO v_item3_id;

  INSERT INTO course_books
    (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1_id, 'الورقات في أصول الفقه', 'إمام الحرمين أبو المعالي الجويني', 'أساسية إلزامية',
     'المقدمة وتعريف أصول الفقه', 'المتن التأسيسي القياسي في المعاهد الشرعية لهذا العلم — موجود في مكتبة المنصة (/library/book-waraqat)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_item2_id, 'الورقات في أصول الفقه', 'إمام الحرمين أبو المعالي الجويني', 'أساسية إلزامية',
     'باب الأحكام', 'المتن التأسيسي القياسي في المعاهد الشرعية لهذا العلم — موجود في مكتبة المنصة (/library/book-waraqat)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_item3_id, 'الورقات في أصول الفقه', 'إمام الحرمين أبو المعالي الجويني', 'أساسية إلزامية',
     'بابا الكتاب والسنة', 'المتن التأسيسي القياسي في المعاهد الشرعية لهذا العلم — موجود في مكتبة المنصة (/library/book-waraqat)', 'مكتبة المجلس العلمي');

  UPDATE learning_paths SET total_sessions = 3, updated_at = now() WHERE id = v_path_id;

  RAISE NOTICE 'usool-fiqh pilot: path_id=%, stage_id=%, course_id=%, unit_id=%, items=[%,%,%]',
    v_path_id, v_stage_id, v_course_id, v_unit_id, v_item1_id, v_item2_id, v_item3_id;
END $$;
