-- ═══════════════════════════════════════════════════════════════════════════
-- learning_path_mustalah_hadith_building_v1.sql
--
-- سياق: Phase 3 (موسوعة العلوم الشرعية) — باب حديثي إضافي بنمط أركان
-- الإيمان (تفصيل موضوع-فموضوع، لا عنصر عام واحد). اكتشاف مهم أثناء
-- التخطيط: على خلاف ما وُثِّق سابقاً في CONTINUATION_PLAN.md ("لا مسار
-- حديث مخصَّص إطلاقاً")، **مسارات hadith وfiqh وtafseer وseerah وtawheed
-- وmustalah-hadith كلها موجودة فعلاً ومنشورة** (`SELECT slug,status,
-- total_sessions FROM learning_paths` أظهر هذا مباشرة) — الخطأ السابق
-- كان فحص السبعة "الفارغة تماماً" المُعلَمة فقط، لا الجدول كاملاً. لكن
-- هذه المسارات **ضحلة فعلياً**: `mustalah-hadith` مثلاً له مرحلتان
-- ومقرران لكن **عنصر تعليمي واحد فقط بينهما** (نفس نمط "عنصر عام واحد
-- لكل مقرر" الذي وُجد سابقاً في aqeedah قبل إضافة arkan-al-iman).
--
-- هذا الملف يضيف مرحلة "البناء" جديدة لمسار mustalah-hadith (كان فيه
-- فقط "التأسيس"←"التوسع" بلا مرحلة وسطى)، بمقرر مفصَّل موضوعاً-فموضوعاً
-- عن أقسام الحديث (صحيح/حسن/ضعيف/متواتر)، مستخدماً كتاباً غير مستخدَم
-- بعد في هذا المسار: "مقدمة ابن الصلاح في علوم الحديث" — الكتاب الأصلي
-- الذي تُبنى عليه أغلب المتون اللاحقة (منها نخبة الفكر ذاتها، ومنظومة
-- السيوطي "ألفية الحديث" نظماً له) — يُكمِّل السلسلة التصاعدية: البيقونية
-- (تأسيس، مبسَّط) ← مقدمة ابن الصلاح (بناء، مُفصَّل، 65 نوعاً) ← نخبة
-- الفكر (توسّع، تلخيص محكم متقدم لابن حجر).
--
-- التحقق العلمي (WebSearch مباشر هذه الجلسة قبل الكتابة):
--   • مقدمة ابن الصلاح: 65 نوعاً من علوم الحديث، لمؤلفها أبي عمرو عثمان
--     الشهرزوري (ت 643هـ)، مبنية على عناية ابن الصلاح بكتاب "معرفة علوم
--     الحديث" للحاكم النيسابوري — مؤكَّد عبر ويكيبيديا العربية ومصادر
--     متعددة متطابقة.
--   • شروط الحديث الصحيح الخمسة (اتصال السند، عدالة الرواة، ضبط الرواة،
--     عدم الشذوذ، عدم العلة) — مؤكَّد سابقاً هذه الجلسة (استُخدم أيضاً في
--     quiz-seed.ts demo-quiz-969).
--   • تعريف ابن حجر للحسن (خفة الضبط عن الصحيح) وتقسيمه لذاته/لغيره —
--     مؤكَّد عبر alukah.net وwikipedia ومصادر متعددة متطابقة.
--   • أسباب ضعف الحديث الرئيسية (سقط في السند، طعن في الراوي) — مؤكَّد.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_path_id    uuid;
  v_stage_id   uuid;
  v_course_id  uuid;
  v_unit_id    uuid;
  v_i1 uuid; v_i2 uuid; v_i3 uuid; v_i4 uuid;
BEGIN
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'mustalah-hadith';
  IF v_path_id IS NULL THEN RAISE EXCEPTION 'مسار mustalah-hadith غير موجود'; END IF;

  IF EXISTS (SELECT 1 FROM courses WHERE slug = 'mustalah-aqsam-hadith') THEN
    RAISE NOTICE 'مُنجَز مسبقاً — تخطّي';
    RETURN;
  END IF;

  -- ترقيم "التوسع" الموجودة مسبقاً (كانت 2) لإفساح مكان لمرحلة "البناء" الجديدة
  UPDATE path_stages SET sort_order = 3 WHERE path_id = v_path_id AND slug = 'advanced';

  INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
  VALUES (gen_random_uuid(), v_path_id, 'building', 'البناء',
    'أقسام الحديث تفصيلاً (الصحيح والحسن والضعيف والمتواتر) عبر "مقدمة ابن الصلاح" — الأصل الذي بُنيت عليه أغلب المتون اللاحقة في هذا الفن.',
    2, 'published')
  RETURNING id INTO v_stage_id;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage_id, 'mustalah-aqsam-hadith', 'أقسام الحديث: الصحيح والحسن والضعيف',
    'قراءة موجَّهة في أقسام الحديث الأربعة الرئيسية من "مقدمة ابن الصلاح": الصحيح، والحسن، والضعيف، والمتواتر مقابل الآحاد.',
    'معرفة شروط الحديث الصحيح الخمسة، والفرق بين الحسن لذاته ولغيره، وأسباب ضعف الحديث الرئيسية، ومعنى التواتر وأثره.',
    'intermediate', 1, 70,
    '["معرفة شروط الحديث الصحيح الخمسة تفصيلاً","التمييز بين الحديث الحسن لذاته والحسن لغيره","معرفة السببين الرئيسيين لضعف الحديث (سقط في السند وطعن في الراوي)","معرفة الفرق بين المتواتر وخبر الآحاد من حيث إفادة العلم"]'::jsonb,
    'published')
  RETURNING id INTO v_course_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'الحديث الصحيح وشروطه الخمسة',
    'من "مقدمة ابن الصلاح": الحديث الصحيح ما اتصل سنده بنقل العدل تام الضبط عن مثله إلى منتهاه، من غير شذوذ ولا علة. الشروط الخمسة: اتصال السند، وعدالة الرواة، وتمام ضبطهم، والسلامة من الشذوذ، والسلامة من العلة القادحة — اختلال شرط واحد يُخرِج الحديث من رتبة الصحيح.',
    1, 25, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'الحديث الحسن: لذاته ولغيره',
    'من "مقدمة ابن الصلاح": قال ابن حجر: «وخبر الآحاد بنقل عدل تام الضبط متصل السند غير معلل ولا شاذ هو الصحيح لذاته، فإن خفّ الضبط فالحسن لذاته» — أي أن الحسن كالصحيح تماماً إلا في تفاوت درجة الضبط. أما الحسن لغيره فهو حديث ضعيف أصلاً لكنه ارتقى إلى مرتبة الحسن بتعدد طرقه وتقوّي بعضها ببعض.',
    1, 25, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'الحديث الضعيف وأسباب ضعفه',
    'من "مقدمة ابن الصلاح": الحديث الضعيف ما لم تجتمع فيه شروط الصحيح ولا الحسن. أسباب ضعفه ترجع إلى جهتين رئيسيتين: سقط في السند (كعدم اتصاله أو انقطاعه)، أو طعن في الراوي (كعدم عدالته أو ضعف ضبطه). لكل نوع من هذين السببين أقسام فرعية عديدة تفصَّل في كتب المصطلح المتقدمة.',
    1, 25, true, 'manual_confirm', 100, 3, 'published', true) RETURNING id INTO v_i3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'المتواتر وخبر الآحاد',
    'من "مقدمة ابن الصلاح": الحديث المتواتر ما رواه جمع كثير عن جمع كثير يستحيل عادةً تواطؤهم على الكذب، عن شيء محسوس — يفيد العلم اليقيني القطعي، ولا يُبحث في عدالة رواته لكثرتهم. أما خبر الآحاد (ما لم يبلغ حد التواتر) فيفيد الظن الغالب عند جمهور الأصوليين، مع وجوب العمل به إذا صح سنده.',
    1, 25, true, 'manual_confirm', 100, 4, 'published', true) RETURNING id INTO v_i4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_i1, 'مقدمة ابن الصلاح في علوم الحديث', 'ابن الصلاح الشهرزوري', 'أساسية إلزامية', 'النوع الأول: معرفة الصحيح من الحديث', 'الأصل الذي بُنيت عليه أغلب المتون اللاحقة في مصطلح الحديث (منها نخبة الفكر ذاتها)، 65 نوعاً — موجود في مكتبة المنصة (/library/book-muqaddimah-ibn-salah)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i2, 'مقدمة ابن الصلاح في علوم الحديث', 'ابن الصلاح الشهرزوري', 'أساسية إلزامية', 'النوع الثاني: معرفة الحسن من الحديث', 'الأصل الذي بُنيت عليه أغلب المتون اللاحقة في مصطلح الحديث — موجود في مكتبة المنصة (/library/book-muqaddimah-ibn-salah)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i3, 'مقدمة ابن الصلاح في علوم الحديث', 'ابن الصلاح الشهرزوري', 'أساسية إلزامية', 'النوع الثالث: معرفة الضعيف من الحديث', 'الأصل الذي بُنيت عليه أغلب المتون اللاحقة في مصطلح الحديث — موجود في مكتبة المنصة (/library/book-muqaddimah-ibn-salah)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i4, 'مقدمة ابن الصلاح في علوم الحديث', 'ابن الصلاح الشهرزوري', 'أساسية إلزامية', 'النوع الرابع والخامس: المتواتر والآحاد', 'الأصل الذي بُنيت عليه أغلب المتون اللاحقة في مصطلح الحديث — موجود في مكتبة المنصة (/library/book-muqaddimah-ibn-salah)', 'مكتبة المجلس العلمي');

  UPDATE learning_paths SET total_sessions = total_sessions + 4, updated_at = now() WHERE id = v_path_id;

  RAISE NOTICE 'mustalah-hadith building: stage_id=%, course_id=%', v_stage_id, v_course_id;
END $$;
