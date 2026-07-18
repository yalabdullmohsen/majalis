-- ═══════════════════════════════════════════════════════════════════════════
-- tarbiyah_rida_shukr_deep_v1.sql
--
-- تعميق مقرر "منزلتا الرضا والشكر" (tarbiyah path، وحدة `869a7689...`)
-- من عنصرين (منزلة الرضا، منزلة الشكر — عامّان، وزن 50/50) إلى 4 عناصر
-- بإضافة استشهاد قرآني وحديثي محدد لكل منزلة — تكملة قائمة المقررات
-- السطحية المكتشَفة حديثاً في مساري آداب/تربية (بطلب المنسّق).
--
-- سلامة الاستشهاد:
--   1. آية الرضا المتبادل — البينة: 8 «رضي الله عنهم ورضوا عنه، ذلك لمن
--      خشي ربه» — تحقَّقت حرفياً من public/data/quran/surah-098.json.
--   2. حديث طعم الإيمان بالرضا — «ذاق طعم الإيمان من رضي بالله رباً،
--      وبالإسلام ديناً، وبمحمد رسولاً» — صحيح مسلم، عن العباس بن عبد
--      المطلب رضي الله عنه (تحقَّق عبر WebFetch).
--   3. آية الشكر ووعد الزيادة — إبراهيم: 7 «لئن شكرتم لأزيدنكم ولئن
--      كفرتم إن عذابي لشديد» — تحقَّقت حرفياً من
--      public/data/quran/surah-014.json.
--   4. حديث شكر الناس من شكر الله — «من لا يشكر الناس لا يشكر الله» —
--      رواه الترمذي وصحَّحه (حسن صحيح)، عن أبي هريرة رضي الله عنه
--      (تحقَّق عبر WebFetch).
--
-- الكتاب المرجعي: "مدارج السالكين بين منازل إياك نعبد وإياك نستعين"
-- (نفس مرجع العنصرين الموجودين مسبقاً، لابن القيم الجوزية).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := '869a7689-f85e-4aef-adcb-1a0d0e94722e';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'آية الرضا المتبادل بين الله وعباده'
  ) THEN
    RAISE NOTICE 'عناصر منزلتا الرضا والشكر المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'آية الرضا المتبادل بين الله وعباده', 'آية البينة (8): «رضي الله عنهم ورضوا عنه، ذلك لمن خشي ربه» — أعلى درجات الرضا: أن يرضى العبد عن ربه في كل قضائه، فيرضى الله عنه.', 1, 10, 17, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'حديث طعم الإيمان بالرضا', 'حديث العباس بن عبد المطلب رضي الله عنه: «ذاق طعم الإيمان من رضي بالله رباً، وبالإسلام ديناً، وبمحمد رسولاً» — صحيح مسلم.', 1, 10, 17, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'آية الشكر ووعد الزيادة', 'آية إبراهيم (7): «وإذ تأذّن ربكم لئن شكرتم لأزيدنكم، ولئن كفرتم إن عذابي لشديد» — الشكر سبب لمزيد النعمة.', 1, 10, 17, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'حديث شكر الناس من شكر الله', 'حديث أبي هريرة رضي الله عنه: «من لا يشكر الناس لا يشكر الله» — رواه الترمذي وقال: حديث حسن صحيح؛ شكر الناس على معروفهم جزء من شكر الله.', 1, 10, 16, true, 'manual_confirm', null, 6, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'مدارج السالكين بين منازل إياك نعبد وإياك نستعين', 'ابن القيم الجوزية', 'أساسية إلزامية', 'منزلة الرضا: آية البينة', 'المرجع الأصلي للمقرر، يكمّل العنصرين الموجودين', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'مدارج السالكين بين منازل إياك نعبد وإياك نستعين', 'ابن القيم الجوزية', 'أساسية إلزامية', 'منزلة الرضا: حديث طعم الإيمان', 'المرجع الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'مدارج السالكين بين منازل إياك نعبد وإياك نستعين', 'ابن القيم الجوزية', 'أساسية إلزامية', 'منزلة الشكر: آية إبراهيم', 'المرجع الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'مدارج السالكين بين منازل إياك نعبد وإياك نستعين', 'ابن القيم الجوزية', 'أساسية إلزامية', 'منزلة الشكر: حديث شكر الناس', 'المرجع الأصلي للمقرر', 'library-catalog.ts');

  -- إعادة توازن الوزن: 6 عناصر بعد الإضافة (2 موجودان + 4 جديدة)، لا 4
  -- كما افتُرض أولاً (خطأ صُحِّح فور اكتشافه عبر تحقّق SUM(weight) مباشر
  -- من DB الحية بعد التطبيق: كانت 150 بدل 100) — التوزيع الصحيح
  -- 17×4+16×2=100.
  UPDATE learning_items SET weight = 17 WHERE unit_id = v_unit_id AND title = 'منزلة الرضا';
  UPDATE learning_items SET weight = 16 WHERE unit_id = v_unit_id AND title = 'منزلة الشكر';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'tarbiyah';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر منزلتا الرضا والشكر + 4 صفوف course_books';
END $$;
