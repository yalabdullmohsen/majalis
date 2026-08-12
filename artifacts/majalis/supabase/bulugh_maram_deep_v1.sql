-- ═══════════════════════════════════════════════════════════════════════════
-- bulugh_maram_deep_v1.sql
--
-- تعميق مقرر "بلوغ المرام من أدلة الأحكام" (fiqh path، وحدة
-- `13c3ca00...`) من عنصر واحد عام إلى 5 عناصر تتناول 4 أحاديث فقهية
-- حقيقية من الكتاب كلٌّ على حدة — تكملة أولوية "أهمها علميًا" (بطلب
-- المنسّق). محاولة تعميق "زاد المستقنع" (fiqh path أيضاً) قبل هذا
-- المقرر تعذَّرت: متنه غير متوفر على ويكي مصدر العربية (بحث مباشر أعاد
-- صفر نتائج)، ومصادر أخرى (shamela.ws) رفضت الوصول (403) — تأجَّل
-- ريثما يتوفر مصدر يمكن التحقق المباشر منه، ولم يُختلَق محتوى فقهي
-- حنبلي دقيق بلا تحقق، بنفس انضباط الجلسة.
--
-- بلوغ المرام (لابن حجر العسقلاني) مختلف عن الكتب السابقة: مجموعة
-- أحاديث أحكام فقهية تحديداً (لا أحاديث عقيدة/أخلاق عامة كالبخاري ومسلم
-- ورياض الصالحين المُعمَّقة سابقاً)، فاختيرت 4 أحاديث أحكام مباشرة —
-- لا تطابق ولا تداخل مع أي من الدفعات السابقة (42 حديث الأربعون + 8
-- عناصر البخاري ومسلم + 4 رياض الصالحين).
--
-- سلامة الاستشهاد (كل حديث تحقَّق عبر WebFetch من ويكي مصدر العربية):
--   1. المسح على الخفين — حديث المغيرة بن شعبة رضي الله عنه في غزوة
--      تبوك (توضأ النبي ﷺ فمسح على خفيه) — رواه أبو داود والنسائي (لم
--      يُنسَب للصحيحين تحديداً لعدم تأكد موضعه فيهما عبر نتائج البحث
--      المتاحة، رغم شهرته الواسعة).
--   2. تحريم كل مسكر — «كل مسكر خمر، وكل خمر حرام» — متفق عليه (خرّجاه
--      في الصحيحين)، عن عبد الله بن عمر رضي الله عنهما.
--   3. الشفعة في كل ما لم يقسم — «إنما جعل النبي ﷺ الشفعة في كل ما لم
--      يقسم، فإذا وقعت الحدود وصرفت الطرق فلا شفعة» — صحيح البخاري،
--      عن جابر بن عبدالله رضي الله عنهما.
--   4. النهي عن بيع الغرر — «نهى عن بيع الغرر وعن بيع الحصاة» — صحيح
--      مسلم، عن أبي هريرة رضي الله عنه.
--
-- الكتاب المرجعي: "بلوغ المرام من أدلة الأحكام" نفسه (موجود مسبقاً في
-- الفهرس، مؤلفه الحافظ ابن حجر العسقلاني) — العنصر العام الموجود مسبقاً
-- يبقى كما هو، وهذه العناصر الأربعة تربط أحاديث أحكام محددة إضافية منه.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := '13c3ca00-a905-4f3a-8a11-4f0e90d7dd15';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'حديث المسح على الخفين'
  ) THEN
    RAISE NOTICE 'عناصر بلوغ المرام المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'حديث المسح على الخفين', 'حديث المغيرة بن شعبة رضي الله عنه في غزوة تبوك: توضأ النبي ﷺ فمسح على خفيه — رواه أبو داود والنسائي؛ أصل جواز المسح على الخفين بدل خلعهما عند الوضوء.', 1, 15, 20, true, 'manual_confirm', null, 2, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'حديث تحريم كل مسكر', 'حديث عبد الله بن عمر رضي الله عنهما: «كل مسكر خمر، وكل خمر حرام» — متفق عليه؛ الأصل الفقهي في تحريم كل مادة مسكرة أياً كان اسمها أو مصدرها.', 1, 10, 20, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'حديث الشفعة في العقار المشترك', 'حديث جابر بن عبدالله رضي الله عنهما: «إنما جعل النبي ﷺ الشفعة في كل ما لم يقسم، فإذا وقعت الحدود وصرفت الطرق فلا شفعة» — صحيح البخاري؛ أصل حق الشفعة في الملكية المشتركة غير المقسومة.', 1, 12, 20, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'حديث النهي عن بيع الغرر', 'حديث أبي هريرة رضي الله عنه: «نهى رسول الله ﷺ عن بيع الغرر وعن بيع الحصاة» — صحيح مسلم؛ أصل عظيم في اشتراط انتفاء الغرر والجهالة الفاحشة لصحة عقود البيع.', 1, 12, 20, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'بلوغ المرام من أدلة الأحكام', 'الحافظ ابن حجر العسقلاني', 'أساسية إلزامية', 'حديث المسح على الخفين', 'المتن الأصلي للمقرر، يكمّل العنصر العام المرتبط بكامل الدورة', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'بلوغ المرام من أدلة الأحكام', 'الحافظ ابن حجر العسقلاني', 'أساسية إلزامية', 'حديث تحريم كل مسكر', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'بلوغ المرام من أدلة الأحكام', 'الحافظ ابن حجر العسقلاني', 'أساسية إلزامية', 'حديث الشفعة', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'بلوغ المرام من أدلة الأحكام', 'الحافظ ابن حجر العسقلاني', 'أساسية إلزامية', 'حديث النهي عن بيع الغرر', 'المتن الأصلي للمقرر', 'library-catalog.ts');

  -- إعادة توازن الوزن: العنصر الوحيد الموجود كان weight=100 (وحيد في الوحدة)،
  -- الآن 5 عناصر فيُعاد توازنها إلى 20 لكل عنصر (تجمع 100 كالسابق).
  UPDATE learning_items SET weight = 20 WHERE unit_id = v_unit_id AND title = 'الدورة العلمية التأصيلية — بلوغ المرام من أدلة الأحكام';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'fiqh';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر بلوغ المرام + 4 صفوف course_books';
END $$;
