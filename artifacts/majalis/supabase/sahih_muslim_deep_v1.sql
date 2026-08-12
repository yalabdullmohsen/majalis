-- ═══════════════════════════════════════════════════════════════════════════
-- sahih_muslim_deep_v1.sql
--
-- تعميق مقرر "صحيح مسلم" (hadith path) من عنصرين ("قراءة كتاب صحيح مسلم"
-- عام بوزن 70، و"قراءة كتاب صحيح مسلم - الحديث 989" بوزن 30) إلى 6 عناصر
-- بإضافة 4 أحاديث حقيقية مشهورة أخرى من صحيح مسلم كلٌّ على حدة — بطلب
-- المنسّق: "تابع عبر أولوياتك (صحيح مسلم، رياض الصالحين، الواسطية،
-- الطحاوية، زاد المستقنع، بلوغ المرام)" بعد إتمام صحيح البخاري.
--
-- تجنُّب التكرار: قُورنت الأحاديث الأربعة المختارة بكل عناوين ونصوص
-- src/lib/arbaeen-nawawi-seed.ts (42 حديثاً) وبالأربعة عناصر المضافة
-- حديثاً لمقرر صحيح البخاري (sahih_bukhari_deep_v1.sql، نفس مسار الحديث)
-- — لا تطابق ولا تداخل موضوعي مباشر مع أيٍّ منها، ولا مع العنصر الموجود
-- مسبقاً "الحديث 989".
--
-- سلامة الاستشهاد (كل حديث تحقَّق عبر WebFetch من ويكي مصدر العربية):
--   1. أول ثلاثة تُسعَّر بهم النار يوم القيامة (القارئ للقرآن، والمجاهد
--      المقتول، والمتصدق) الذين فعلوا ذلك ليُقال (لا لوجه الله) — صحيح
--      مسلم، كتاب الإمارة، عن أبي هريرة رضي الله عنه. عبرة عظيمة في
--      الإخلاص تكمّل موضوعياً حديث "خيركم من تعلم القرآن وعلمه" المُضاف
--      لصحيح البخاري (زاوية مختلفة: فضل التعلّم مقابل خطر الرياء فيه).
--   2. أفشوا السلام بينكم — "لا تدخلون الجنة حتى تؤمنوا، ولا تؤمنوا حتى
--      تحابوا، أولا أدلكم على شيء إذا فعلتموه تحاببتم؟ أفشوا السلام
--      بينكم" — صحيح مسلم، كتاب الإيمان، عن أبي هريرة رضي الله عنه.
--   3. من عاد مريضاً — "من عاد مريضاً لم يزل في خُرفة الجنة حتى يرجع"
--      (خُرفة الجنة: جناها وثمارها) — صحيح مسلم، عن ثوبان مولى رسول الله
--      ﷺ رضي الله عنه.
--   4. الدنيا سجن المؤمن وجنة الكافر — صحيح مسلم، عن أبي هريرة رضي الله
--      عنه.
--
-- الكتاب المرجعي: "صحيح مسلم" نفسه (موجود مسبقاً في الفهرس، مؤلفه الإمام
-- مسلم بن الحجاج) — العنصران الموجودان مسبقاً يبقيان كما هما، وهذه
-- العناصر الأربعة تربط أحاديث محددة إضافية منه.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := '82c0d01d-8db1-416e-9151-b17418752ce1';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'أول من تُسعَّر بهم النار: الرياء في العلم والجهاد والصدقة'
  ) THEN
    RAISE NOTICE 'عناصر صحيح مسلم المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'أول من تُسعَّر بهم النار: الرياء في العلم والجهاد والصدقة', 'حديث أبي هريرة رضي الله عنه: أول ثلاثة يُقضى فيهم يوم القيامة — القارئ للقرآن، والمجاهد المقتول، والمتصدق — فعلوا ذلك ليُقال لا ابتغاء وجه الله، فيُسحبون إلى النار. عبرة عظيمة في خطر الرياء ولو في أعظم الأعمال. صحيح مسلم، كتاب الإمارة.', 1, 15, 17, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'أفشوا السلام بينكم', 'حديث أبي هريرة رضي الله عنه: «لا تدخلون الجنة حتى تؤمنوا، ولا تؤمنوا حتى تحابوا، أولا أدلكم على شيء إذا فعلتموه تحاببتم؟ أفشوا السلام بينكم» — صحيح مسلم، كتاب الإيمان.', 1, 10, 17, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'فضل عيادة المريض', 'حديث ثوبان مولى رسول الله ﷺ رضي الله عنه: «من عاد مريضاً لم يزل في خُرفة الجنة حتى يرجع» — صحيح مسلم.', 1, 10, 17, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'الدنيا سجن المؤمن وجنة الكافر', 'حديث أبي هريرة رضي الله عنه: «الدنيا سجن المؤمن وجنة الكافر» — صحيح مسلم؛ ضابط عظيم في فهم طبيعة الحياة الدنيا بالنسبة للمؤمن.', 1, 10, 16, true, 'manual_confirm', null, 6, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'صحيح مسلم', 'الإمام مسلم بن الحجاج', 'أساسية إلزامية', 'حديث أول من تُسعَّر بهم النار', 'المتن الأصلي للمقرر، يكمّل العناصر الموجودة مسبقاً', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'صحيح مسلم', 'الإمام مسلم بن الحجاج', 'أساسية إلزامية', 'حديث أفشوا السلام بينكم', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'صحيح مسلم', 'الإمام مسلم بن الحجاج', 'أساسية إلزامية', 'حديث فضل عيادة المريض', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'صحيح مسلم', 'الإمام مسلم بن الحجاج', 'أساسية إلزامية', 'حديث الدنيا سجن المؤمن', 'المتن الأصلي للمقرر', 'library-catalog.ts');

  -- إعادة توازن الوزن: العنصران الموجودان (70+30=100) يُخفَّضان ليُفسحا
  -- مجالاً للعناصر الأربعة الجديدة، فيصبح المجموع 6 عناصر تجمع 100:
  -- 17+16+17+17+17+16=100.
  UPDATE learning_items SET weight = 17 WHERE unit_id = v_unit_id AND title = 'قراءة كتاب صحيح مسلم';
  UPDATE learning_items SET weight = 16 WHERE unit_id = v_unit_id AND title = 'قراءة كتاب صحيح مسلم - الحديث 989';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'hadith';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر صحيح مسلم + 4 صفوف course_books';
END $$;
