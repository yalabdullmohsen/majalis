-- ═══════════════════════════════════════════════════════════════════════════
-- tafsir_nahl_deep_v1.sql
--
-- تعميق مقرر "تفسير سورة النحل" (tafseer path، وحدة `53ca670b...`) من
-- عنصرين (عام + من الآية 40 فما بعدها) إلى 6 عناصر بإضافة 4 عناصر
-- تتناول موضوعات من الآيات 1-39 (النطاق غير المُغطَّى صراحة بالعنصر
-- الثاني "من الآية 40") — تكملة قائمة المقررات السطحية المتبقية (بطلب
-- المنسّق: "حتى تستنفد ما هو قابل للتحقق منها").
--
-- سلامة الاستشهاد: كل آية استُشهد بها تحقَّقت حرفياً من
-- public/data/quran/surah-016.json (numberInSurah مطابق).
--   1. آيات نعم الله على عباده — الأنعام (5-8)، والماء والزرع (10-11)،
--      والبحر (14)، والجبال والأنهار والنجوم (15-16)، وختامها: «وإن
--      تعدوا نعمة الله لا تحصوها» (18).
--   2. حجة التوحيد وإبطال الشرك — «أفمن يخلق كمن لا يخلق أفلا تذكرون»
--      (17)، و«الذين يدعون من دون الله لا يخلقون شيئاً وهم يُخلقون *
--      أموات غير أحياء» (20-21)، و«إلهكم إله واحد» (22).
--   3. حال المتقين والظالمين عند الوفاة ويوم القيامة — الملائكة تتوفى
--      الظالمين أنفسهم فيُقال لهم «ادخلوا أبواب جهنم خالدين فيها» (28-
--      29)، مقابل المتقين الذين يُقال لهم «سلام عليكم ادخلوا الجنة بما
--      كنتم تعملون» (30-32).
--   4. إرسال الرسل لتحقيق التوحيد — «ولقد بعثنا في كل أمة رسولاً أن
--      اعبدوا الله واجتنبوا الطاغوت» (36)، مع تقرير أن الهداية بيد الله
--      لا بيد الرسول: «إن تحرص على هداهم فإن الله لا يهدي من يُضل» (37).
--
-- الكتاب المرجعي: "الجامع لأحكام القرآن — تفسير القرطبي" (نفس مرجع
-- العنصر العام الموجود مسبقاً في هذه الوحدة) — العنصران الموجودان
-- يبقيان كما هما، وهذه العناصر الأربعة تربط آيات محددة إضافية منه.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := '53ca670b-da1e-48c7-850c-6a32e07cd79c';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'آيات نعم الله على عباده'
  ) THEN
    RAISE NOTICE 'عناصر تفسير سورة النحل المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'آيات نعم الله على عباده', 'تعداد نعم الله في مطلع السورة (سُميت لذلك "سورة النِّعَم"): الأنعام (5-8)، الماء والزرع (10-11)، البحر (14)، الجبال والأنهار والنجوم للاهتداء (15-16)، وختامها: «وإن تعدوا نعمة الله لا تحصوها» (18).', 1, 15, 15, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'حجة التوحيد وإبطال الشرك', '«أفمن يخلق كمن لا يخلق أفلا تذكرون» (17)، و«الذين يدعون من دون الله لا يخلقون شيئاً وهم يُخلقون، أمواتٌ غير أحياء» (20-21)، تقرير أن «إلهكم إله واحد» (22).', 1, 15, 15, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'حال المتقين والظالمين عند الوفاة', 'الملائكة تتوفى الظالمين أنفسهم فيُقال لهم «ادخلوا أبواب جهنم خالدين فيها» (28-29)، مقابل المتقين الذين تتوفاهم الملائكة طيبين فيقولون لهم «سلام عليكم ادخلوا الجنة بما كنتم تعملون» (30-32).', 1, 15, 15, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'إرسال الرسل لتحقيق التوحيد', '«ولقد بعثنا في كل أمة رسولاً أن اعبدوا الله واجتنبوا الطاغوت» (36) — رسالة كل الأنبياء واحدة في جوهرها، مع تقرير أن الهداية بيد الله لا بيد الرسول: «إن تحرص على هداهم فإن الله لا يهدي من يُضل» (37).', 1, 15, 15, true, 'manual_confirm', null, 6, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'الجامع لأحكام القرآن — تفسير القرطبي', 'الإمام القرطبي', 'أساسية إلزامية', 'سورة النحل، الآيات 5-18', 'المرجع الأصلي للمقرر، يكمّل العنصرين الموجودين', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'الجامع لأحكام القرآن — تفسير القرطبي', 'الإمام القرطبي', 'أساسية إلزامية', 'سورة النحل، الآيات 17، 20-22', 'المرجع الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'الجامع لأحكام القرآن — تفسير القرطبي', 'الإمام القرطبي', 'أساسية إلزامية', 'سورة النحل، الآيات 28-32', 'المرجع الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'الجامع لأحكام القرآن — تفسير القرطبي', 'الإمام القرطبي', 'أساسية إلزامية', 'سورة النحل، الآيات 36-37', 'المرجع الأصلي للمقرر', 'library-catalog.ts');

  -- إعادة توازن الوزن: العنصران الموجودان (70+30=100) يُخفَّضان ليُفسحا
  -- مجالاً للأربعة الجديدة (4×15=60): الأول من 70 إلى 25، والثاني من 30
  -- إلى 15، فيصبح المجموع 25+15+15×4=100.
  UPDATE learning_items SET weight = 25 WHERE unit_id = v_unit_id AND title = 'تفسير سورة النحل';
  UPDATE learning_items SET weight = 15 WHERE unit_id = v_unit_id AND title = 'تفسير سورة النحل - الآية 40 فما بعدها';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'tafseer';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر تفسير سورة النحل + 4 صفوف course_books';
END $$;
