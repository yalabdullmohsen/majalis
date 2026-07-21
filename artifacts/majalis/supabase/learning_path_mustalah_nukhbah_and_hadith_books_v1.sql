-- ═══════════════════════════════════════════════════════════════════════════
-- learning_path_mustalah_nukhbah_and_hadith_books_v1.sql
--
-- سياق: بعد اكتمال تعميق المسارات الخمسة الأصلية (hadith/fiqh/tafseer/
-- seerah/tawheed) بباب واحد لكل مسار، تحقّقتُ أعمق (حسب توجيه المنسّق:
-- "هل توجد مسارات أخرى بدورات بلا course_books؟") عبر استعلام شامل على
-- كل learning_paths، فوجدت:
--
-- 1) مقرر "نخبة الفكر" (`nukhbat-fikr`) داخل `mustalah-hadith` **فارغ
--    تماماً (0 عناصر)** وبحالة `needs_review` (لا `published` — placeholder
--    صادق موصوف بوضوح "لا يوجد بعد درس/محتوى مرتبط... بانتظار مراجعة
--    علمية"، لا يكذب على المستخدم لكنه فجوة حقيقية).
-- 2) مقررا "صحيح البخاري" و"صحيح مسلم" داخل `hadith` (المسار الأكبر،
--    102 جلسة) لهما عناصر تعليمية موجودة فعلاً بعناوين تطابق الكتابين
--    حرفياً («صحيح البخاري»، «قراءة كتاب صحيح مسلم») لكن **بلا أي
--    course_books مربوط إطلاقاً** رغم أن كلا الكتابين موجودان فعلاً في
--    المكتبة (book-bukhari، book-muslim) — فجوة ربط بسيطة وآمنة الإصلاح
--    (إضافة صفوف course_books فقط، بلا تعديل العناصر نفسها).
--
-- هذا الملف يعالج الاثنين معاً:
-- (أ) يملأ "نخبة الفكر" بـ4 عناصر تعليمية حقيقية لأنواع مخالفة الثقات
--     الأربعة التي نظّمها ابن حجر في الكتاب (الشاذ/المنكر، المعلّل،
--     المدرج، المقلوب/المضطرب) — موضوع متقدم مختلف تماماً عمّا سبق تغطيته
--     في مقرر "أقسام الحديث" (الصحيح/الحسن/الضعيف الأساسية، المتواتر/
--     الآحاد) — لا تكرار محتوى، تحقّقتُ عبر WebSearch أن هذه الأنواع
--     الأربعة فعلاً من صميم تبويب نخبة الفكر قبل الكتابة. ثم يرفع حالة
--     المقرر من needs_review إلى published بعد إضافة محتوى حقيقي.
-- (ب) يضيف 3 صفوف course_books للعناصر الثلاثة الموجودة مسبقاً في
--     sahih-bukhari/sahih-muslim — **بلا أي تعديل على العناصر نفسها**،
--     فقط إضافة الربط الببليوغرافي الناقص.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_mustalah_path_id uuid;
  v_hadith_path_id   uuid;
  v_nukhbah_course_id uuid;
  v_unit_id uuid;
  v_i1 uuid; v_i2 uuid; v_i3 uuid; v_i4 uuid;
  v_bukhari_item_id uuid;
  v_muslim_item1_id uuid;
  v_muslim_item2_id uuid;
BEGIN
  -- ── (أ) ملء مقرر نخبة الفكر ──────────────────────────────────────────
  SELECT id INTO v_mustalah_path_id FROM learning_paths WHERE slug = 'mustalah-hadith';
  IF v_mustalah_path_id IS NULL THEN RAISE EXCEPTION 'مسار mustalah-hadith غير موجود'; END IF;

  SELECT id INTO v_nukhbah_course_id FROM courses WHERE slug = 'nukhbat-fikr';
  IF v_nukhbah_course_id IS NULL THEN RAISE EXCEPTION 'مقرر nukhbat-fikr غير موجود'; END IF;

  IF EXISTS (SELECT 1 FROM course_units WHERE course_id = v_nukhbah_course_id) THEN
    RAISE NOTICE 'نخبة الفكر مُنجَز مسبقاً — تخطّي الجزء (أ)';
  ELSE
    INSERT INTO course_units (id, course_id, title, sort_order)
    VALUES (gen_random_uuid(), v_nukhbah_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;

    INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
    VALUES (gen_random_uuid(), v_unit_id, 'book', 'الحديث الشاذ والمنكر',
      'الشاذ: ما رواه الراوي المقبول مخالفاً لمن هو أوثق منه أو أكثر عدداً. المنكر: ما رواه الراوي الضعيف مخالفاً لرواية الثقات. كلاهما من أنواع مخالفة الثقات التي نظّمها ابن حجر في نخبة الفكر، ويختلفان عن الحديث الضعيف العادي (المُغطى في مقرر سابق) في أن العلة هنا مخالفة راوٍ لراوٍ أوثق منه لا مجرد ضعف في السند بذاته.',
      1, 25, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i1;

    INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
    VALUES (gen_random_uuid(), v_unit_id, 'book', 'الحديث المعلَّل',
      'ما اطُّلع فيه على علة خفية قادحة في صحته مع أن ظاهر إسناده السلامة منها؛ اكتشاف العلة يحتاج إمعان نظر وجمع طرق الحديث، ولا يقوم به إلا أهل الاختصاص من كبار الحفاظ الممارسين. يُعدّ علم العلل من أدقّ علوم الحديث وأشرفها.',
      1, 25, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i2;

    INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
    VALUES (gen_random_uuid(), v_unit_id, 'book', 'الحديث المُدرَج',
      'ما أُدخل فيه ما ليس منه، بحيث يتصل كلام الراوي أو تفسيره بمتن الحديث دون فاصل بيّن، فيُظَنّ من أصل الحديث النبوي وهو ليس كذلك. قد يقع الإدراج في المتن أو في الإسناد، ومعرفته من أدقّ فنون نقد الحديث.',
      1, 25, true, 'manual_confirm', 100, 3, 'published', true) RETURNING id INTO v_i3;

    INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
    VALUES (gen_random_uuid(), v_unit_id, 'book', 'الحديث المقلوب والمضطرب',
      'المقلوب: إبدال شيء بآخر في السند أو المتن (كتقديم اسم راوٍ على آخر أو تبديل إسناد بمتن مختلف). المضطرب: ما رُوي على أوجه مختلفة متساوية في القوة يتعذّر ترجيح بعضها على بعض، بخلاف الروايات التي يمكن الجمع بينها أو ترجيح إحداها.',
      1, 25, true, 'manual_confirm', 100, 4, 'published', true) RETURNING id INTO v_i4;

    INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
    VALUES
      (gen_random_uuid(), v_i1, 'نخبة الفكر في مصطلح أهل الأثر', 'الإمام ابن حجر العسقلاني', 'أساسية إلزامية', 'مبحث الشاذ والمنكر', 'أشهر متن في مصطلح الحديث، موجود في مكتبة المنصة (/library/book-nukhbah)', 'مكتبة المجلس العلمي'),
      (gen_random_uuid(), v_i2, 'نخبة الفكر في مصطلح أهل الأثر', 'الإمام ابن حجر العسقلاني', 'أساسية إلزامية', 'مبحث العلة والحديث المعلَّل', 'موجود في مكتبة المنصة (/library/book-nukhbah)', 'مكتبة المجلس العلمي'),
      (gen_random_uuid(), v_i3, 'نخبة الفكر في مصطلح أهل الأثر', 'الإمام ابن حجر العسقلاني', 'أساسية إلزامية', 'مبحث الإدراج', 'موجود في مكتبة المنصة (/library/book-nukhbah)', 'مكتبة المجلس العلمي'),
      (gen_random_uuid(), v_i4, 'نخبة الفكر في مصطلح أهل الأثر', 'الإمام ابن حجر العسقلاني', 'أساسية إلزامية', 'مبحث القلب والاضطراب', 'موجود في مكتبة المنصة (/library/book-nukhbah)', 'مكتبة المجلس العلمي');

    UPDATE courses SET status = 'published' WHERE id = v_nukhbah_course_id;
    UPDATE learning_paths SET total_sessions = total_sessions + 4, updated_at = now() WHERE id = v_mustalah_path_id;

    RAISE NOTICE 'نخبة الفكر مُلئ: course_id=%', v_nukhbah_course_id;
  END IF;

  -- ── (ب) ربط عناصر sahih-bukhari/sahih-muslim الموجودة بالكتابين ────────
  SELECT id INTO v_hadith_path_id FROM learning_paths WHERE slug = 'hadith';
  IF v_hadith_path_id IS NULL THEN RAISE EXCEPTION 'مسار hadith غير موجود'; END IF;

  SELECT li.id INTO v_bukhari_item_id
  FROM learning_items li
  JOIN course_units cu ON li.unit_id = cu.id
  JOIN courses c ON cu.course_id = c.id
  WHERE c.slug = 'sahih-bukhari' AND li.title = 'صحيح البخاري'
  LIMIT 1;

  SELECT li.id INTO v_muslim_item1_id
  FROM learning_items li
  JOIN course_units cu ON li.unit_id = cu.id
  JOIN courses c ON cu.course_id = c.id
  WHERE c.slug = 'sahih-muslim' AND li.title = 'قراءة كتاب صحيح مسلم'
  LIMIT 1;

  SELECT li.id INTO v_muslim_item2_id
  FROM learning_items li
  JOIN course_units cu ON li.unit_id = cu.id
  JOIN courses c ON cu.course_id = c.id
  WHERE c.slug = 'sahih-muslim' AND li.title = 'قراءة كتاب صحيح مسلم - الحديث 989'
  LIMIT 1;

  IF v_bukhari_item_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM course_books WHERE learning_item_id = v_bukhari_item_id) THEN
    INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
    VALUES (gen_random_uuid(), v_bukhari_item_id, 'صحيح البخاري', 'الإمام محمد بن إسماعيل البخاري', 'أساسية إلزامية', 'قراءة عامة موجَّهة', 'أصح كتاب بعد كتاب الله، موجود في مكتبة المنصة (/library/book-bukhari)', 'مكتبة المجلس العلمي');
  END IF;

  IF v_muslim_item1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM course_books WHERE learning_item_id = v_muslim_item1_id) THEN
    INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
    VALUES (gen_random_uuid(), v_muslim_item1_id, 'صحيح مسلم', 'الإمام مسلم بن الحجاج النيسابوري', 'أساسية إلزامية', 'قراءة عامة موجَّهة', 'ثاني أصح كتب الحديث، موجود في مكتبة المنصة (/library/book-muslim)', 'مكتبة المجلس العلمي');
  END IF;

  IF v_muslim_item2_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM course_books WHERE learning_item_id = v_muslim_item2_id) THEN
    INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
    VALUES (gen_random_uuid(), v_muslim_item2_id, 'صحيح مسلم', 'الإمام مسلم بن الحجاج النيسابوري', 'أساسية إلزامية', 'الحديث رقم 989', 'موجود في مكتبة المنصة (/library/book-muslim)', 'مكتبة المجلس العلمي');
  END IF;

  RAISE NOTICE 'ربط sahih-bukhari/sahih-muslim: bukhari_item=%, muslim_item1=%, muslim_item2=%', v_bukhari_item_id, v_muslim_item1_id, v_muslim_item2_id;
END $$;
