-- ═══════════════════════════════════════════════════════════════════════════
-- aqidah_wasitiyyah_deep_v1.sql
--
-- تعميق مقرر "العقيدة الواسطية" (aqeedah path) من عنصر واحد عام
-- ("العقيدة الواسطية") إلى 5 عناصر تتناول 4 من أبرز مواضيع رسالة ابن
-- تيمية الأصلية كلٌّ على حدة — تكملة أولوية "أهمها علميًا" (بطلب
-- المنسّق) بعد صحيح البخاري ومسلم ورياض الصالحين.
--
-- تجنُّب التكرار: قُورنت المواضيع الأربعة بالعناصر الأربعة المُضافة
-- حديثاً لمقرر "كتاب التوحيد" (نفس مسار العقيدة، sql سابق: تفسير
-- التوحيد/الشهادة، دخول الجنة بلا حساب، الخوف من الشرك، الذبح لغير الله)
-- — لا تطابق: الواسطية تتناول أسماء الله وصفاته والقدر والصحابة واليوم
-- الآخر، بخلاف مباحث التوحيد الثلاثة المباشرة في كتاب التوحيد.
--
-- سلامة الاستشهاد (كل نص تحقَّق حرفياً عبر WebFetch من نص الكتاب نفسه
-- على ويكي مصدر العربية، والآيات القرآنية تحقَّقت مباشرة من الملفات
-- المحلية public/data/quran/):
--   1. منهج أهل السنة في أسماء الله وصفاته — النص الحرفي الافتتاحي:
--      «ومن الإيمان بالله: الإيمان بما وصف به نفسه في كتابه وبما وصفه
--      به رسوله محمد ﷺ من غير تحريف ولا تعطيل، ومن غير تكييف ولا
--      تمثيل» + آية الشورى: 11 «ليس كمثله شيء وهو السميع البصير»
--      (تحقَّقت حرفياً من surah-042.json، numberInSurah: 11).
--   2. الإيمان بالقدر خيره وشره — النص الحرفي: «وتؤمن الفرقة الناجية
--      أهل السنة والجماعة بالقدر خيره وشره» + «العباد فاعلون حقيقة
--      والله خالق أفعالهم» + «وللعباد القدرة على أعمالهم ولهم إرادة»
--      + آية التكوير: 28-29 «لمن شاء منكم أن يستقيم، وما تشاءون إلا
--      أن يشاء الله» (تحقَّقت حرفياً من surah-081.json).
--   3. ترتيب الخلفاء الراشدين ومنهج أهل السنة في الصحابة — النص الحرفي:
--      «خير هذه الأمة بعد نبيها أبو بكر ثم عمر، ويثلثون بعثمان ويربعون
--      بعلي».
--   4. الإيمان باليوم الآخر: فتنة القبر والميزان — يشمل «فتنة القبر
--      وعذابه ونعيمه» ونصب الموازين + آية المؤمنون: 102 «فمن ثقلت
--      موازينه فأولئك هم المفلحون» (تحقَّقت حرفياً من surah-023.json؛
--      العبارة نفسها ترد أيضاً في الأعراف: 8).
--
-- الكتاب المرجعي: "العقيدة الواسطية" نفسها (موجودة مسبقاً في الفهرس،
-- مؤلفها شيخ الإسلام ابن تيمية) — العنصر العام الموجود مسبقاً يبقى كما
-- هو، وهذه العناصر الأربعة تربط مباحث محددة إضافية منها.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := '7527bfb6-dce0-4f3e-9bbb-53731cd002bd';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'منهج أهل السنة في أسماء الله وصفاته'
  ) THEN
    RAISE NOTICE 'عناصر العقيدة الواسطية المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'منهج أهل السنة في أسماء الله وصفاته', 'النص الافتتاحي لرسالة ابن تيمية: «ومن الإيمان بالله: الإيمان بما وصف به نفسه في كتابه وبما وصفه به رسوله محمد ﷺ من غير تحريف ولا تعطيل، ومن غير تكييف ولا تمثيل» — إثبات بلا تمثيل، وتنزيه بلا تعطيل، استدلالاً بآية الشورى (11): «ليس كمثله شيء وهو السميع البصير».', 1, 20, 20, true, 'manual_confirm', null, 2, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'الإيمان بالقدر خيره وشره', 'موقف أهل السنة الوسط بين الجبرية والقدرية: «العباد فاعلون حقيقة والله خالق أفعالهم»، «وللعباد القدرة على أعمالهم ولهم إرادة» — استدلالاً بآيتي التكوير (28-29): «لمن شاء منكم أن يستقيم، وما تشاءون إلا أن يشاء الله».', 1, 20, 20, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'ترتيب الخلفاء الراشدين ومنهج أهل السنة في الصحابة', 'النص الحرفي: «خير هذه الأمة بعد نبيها أبو بكر ثم عمر، ويثلثون بعثمان ويربعون بعلي» — وجوب محبة الصحابة والكف عما شجر بينهم دون الطعن في أحد منهم.', 1, 15, 20, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'الإيمان باليوم الآخر: فتنة القبر والميزان', 'التصديق بفتنة القبر وعذابه ونعيمه، ونصب الموازين يوم القيامة لوزن أعمال العباد — استدلالاً بآية المؤمنون (102): «فمن ثقلت موازينه فأولئك هم المفلحون».', 1, 15, 20, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'العقيدة الواسطية', 'شيخ الإسلام ابن تيمية', 'أساسية إلزامية', 'منهج أهل السنة في أسماء الله وصفاته', 'المتن الأصلي للمقرر، يكمّل العنصر العام المرتبط بكامل الرسالة', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'العقيدة الواسطية', 'شيخ الإسلام ابن تيمية', 'أساسية إلزامية', 'الإيمان بالقدر', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'العقيدة الواسطية', 'شيخ الإسلام ابن تيمية', 'أساسية إلزامية', 'منهج أهل السنة في الصحابة', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'العقيدة الواسطية', 'شيخ الإسلام ابن تيمية', 'أساسية إلزامية', 'الإيمان باليوم الآخر', 'المتن الأصلي للمقرر', 'library-catalog.ts');

  -- إعادة توازن الوزن: العنصر الوحيد الموجود كان weight=100 (وحيد في الوحدة)،
  -- الآن 5 عناصر فيُعاد توازنها إلى 20 لكل عنصر (تجمع 100 كالسابق).
  UPDATE learning_items SET weight = 20 WHERE unit_id = v_unit_id AND title = 'العقيدة الواسطية' AND item_type = 'lesson';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'aqeedah';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر العقيدة الواسطية + 4 صفوف course_books';
END $$;
