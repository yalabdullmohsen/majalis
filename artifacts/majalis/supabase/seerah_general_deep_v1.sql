-- ═══════════════════════════════════════════════════════════════════════════
-- seerah_general_deep_v1.sql
--
-- تعميق مقرر "السيرة النبوية" العام (seerah path، وحدة `2594ba33...`) من
-- عنصر واحد عام (مرتبط بالرحيق المختوم) إلى 5 عناصر تتناول 4 أحداث
-- مبكرة حقيقية من السيرة كلٌّ على حدة — تكملة قائمة المقررات السطحية
-- المتبقية (بطلب المنسّق: "حتى تستنفد ما هو قابل للتحقق منها").
--
-- تجنُّب التكرار: اختيرت 4 أحداث من الفترة المكية المبكرة (قبل الهجرة)،
-- بخلاف مقرر "الغزوات الكبرى" المبني مسبقاً هذه الجلسة (فترة مدنية بعد
-- الهجرة) ومقرر "السيرة النبوية المعمقة" (وحدة أخرى منفصلة، لم يُمس بعد
-- في هذه الدفعة) — لا تداخل.
--
-- سلامة الاستشهاد (كل نص تحقَّق عبر WebFetch من ويكي مصدر العربية، والآيات
-- القرآنية تحقَّقت مباشرة من الملفات المحلية):
--   1. بدء الوحي وحادثة غار حراء — أول ما نزل: سورة العلق، الآيات 1-5
--      (تحقَّقت حرفياً من public/data/quran/surah-096.json)، وتطمين
--      خديجة رضي الله عنها للنبي ﷺ: «كلا والله ما يخزيك الله أبداً،
--      إنك لتصل الرحم، وتحمل الكل، وتكسب المعدوم، وتقري الضيف، وتعين
--      على نوائب الحق» — صحيح البخاري، كتاب بدء الوحي.
--   2. الهجرة الأولى إلى الحبشة — خطاب جعفر بن أبي طالب أمام النجاشي:
--      «كنا قوماً أهل جاهلية، نعبد الأصنام، ونأكل الميتة...» — ثابت في
--      مسند أحمد وكتب السيرة (سيرة ابن هشام).
--   3. عام الحزن ورحلة الطائف — وفاة خديجة وأبي طالب، ثم رحلة النبي ﷺ
--      إلى الطائف طلباً للنصرة فرُدَّ وأُوذي، ودعاؤه المشهور: «اللهم
--      إليك أشكو ضعف قوتي، وقلة حيلتي، وهواني على الناس...» — سيرة ابن
--      هشام.
--   4. بيعة العقبة الثانية — بايع النبي ﷺ فيها 73 رجلاً وامرأتان من
--      الأنصار قُبيل الهجرة إلى المدينة — ثابت في البداية والنهاية
--      لابن كثير (تفصيلاً في: "أسماء من شهد بيعة العقبة الثانية:
--      ثلاثة وسبعون رجلاً وامرأتان").
--
-- الكتاب المرجعي: "الرحيق المختوم" (نفس مرجع العنصر العام الموجود
-- مسبقاً في هذه الوحدة، للصفي الرحمن المباركفوري) — العنصر العام يبقى
-- كما هو، وهذه العناصر الأربعة تربط أحداثاً محددة إضافية منه.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := '2594ba33-96ca-47ea-bb86-15e2df44763d';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'بدء الوحي وحادثة غار حراء'
  ) THEN
    RAISE NOTICE 'عناصر السيرة النبوية المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'بدء الوحي وحادثة غار حراء', 'نزول أول آيات القرآن على النبي ﷺ في غار حراء: «اقرأ باسم ربك الذي خلق...» (العلق: 1-5)، وتطمين خديجة رضي الله عنها له بعد عودته مرتجفاً: «كلا والله ما يخزيك الله أبداً، إنك لتصل الرحم، وتحمل الكل، وتكسب المعدوم، وتقري الضيف، وتعين على نوائب الحق» — صحيح البخاري.', 1, 20, 20, true, 'manual_confirm', null, 2, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'الهجرة الأولى إلى الحبشة', 'أمر النبي ﷺ أصحابه بالهجرة إلى أرض الحبشة فراراً بدينهم من أذى قريش، وخطاب جعفر بن أبي طالب الشهير أمام النجاشي: «كنا قوماً أهل جاهلية، نعبد الأصنام، ونأكل الميتة...» حتى أسلم على يديه.', 1, 18, 20, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'عام الحزن ورحلة الطائف', 'وفاة خديجة وأبي طالب رضي الله عنهما في عام واحد، ثم رحلة النبي ﷺ إلى الطائف طلباً للنصرة فرُدَّ وأُوذي، ودعاؤه المشهور: «اللهم إليك أشكو ضعف قوتي، وقلة حيلتي، وهواني على الناس، يا أرحم الراحمين، أنت رب المستضعفين وأنت ربي».', 1, 18, 20, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'بيعة العقبة الثانية', 'بايع النبي ﷺ فيها 73 رجلاً وامرأتين من الأنصار قُبيل الهجرة إلى المدينة، وكانت الخطوة الحاسمة التي مهَّدت لهجرة النبي ﷺ وأصحابه.', 1, 15, 20, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'الرحيق المختوم', 'الشيخ صفي الرحمن المباركفوري', 'أساسية إلزامية', 'بدء الوحي', 'المتن الأصلي للمقرر، يكمّل العنصر العام المرتبط بكامل الكتاب', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'الرحيق المختوم', 'الشيخ صفي الرحمن المباركفوري', 'أساسية إلزامية', 'الهجرة إلى الحبشة', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'الرحيق المختوم', 'الشيخ صفي الرحمن المباركفوري', 'أساسية إلزامية', 'عام الحزن ورحلة الطائف', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'الرحيق المختوم', 'الشيخ صفي الرحمن المباركفوري', 'أساسية إلزامية', 'بيعة العقبة الثانية', 'المتن الأصلي للمقرر', 'library-catalog.ts');

  -- إعادة توازن الوزن: العنصر الوحيد الموجود كان weight=100 (وحيد في الوحدة)،
  -- الآن 5 عناصر فيُعاد توازنها إلى 20 لكل عنصر (تجمع 100 كالسابق).
  UPDATE learning_items SET weight = 20 WHERE unit_id = v_unit_id AND title = 'السيرة النبوية';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'seerah';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر السيرة النبوية العام + 4 صفوف course_books';
END $$;
