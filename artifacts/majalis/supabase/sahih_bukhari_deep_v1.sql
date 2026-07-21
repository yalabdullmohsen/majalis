-- ═══════════════════════════════════════════════════════════════════════════
-- sahih_bukhari_deep_v1.sql
--
-- تعميق مقرر "صحيح البخاري" (hadith path) من عنصر واحد عام ("صحيح البخاري")
-- إلى 5 عناصر تتناول 4 أحاديث مشهورة من صحيح البخاري كلٌّ على حدة —
-- اختير هذا المقرر بأولوية علمية (بطلب المنسّق: "بأولوية لأهمها علميًا")
-- لأن صحيح البخاري أصح كتاب بعد كتاب الله عند جمهور أهل العلم. نفس نمط
-- "أركان الإيمان"/"تفسير الكهف"/"الأربعون النووية"/"كتاب التوحيد" الناجح.
--
-- تجنُّب التكرار: قُورنت الأحاديث الأربعة المختارة بكل عناوين ونصوص
-- src/lib/arbaeen-nawawi-seed.ts (42 حديثاً كاملة موجودة فعلاً في مسار
-- الحديث نفسه) — لا تطابق ولا تداخل موضوعي مباشر مع أيٍّ منها.
--
-- سلامة الاستشهاد (كل حديث تحقَّق عبر WebFetch من ويكي مصدر العربية،
-- بعد فشل الوصول لـsunnah.com بـ403 كالمعتاد هذه الجلسة):
--   1. حديث السبعة الذين يظلهم الله في ظله يوم لا ظل إلا ظله — عن أبي
--      هريرة رضي الله عنه، متفق عليه (صحيح البخاري: كتاب الأذان/الجماعة؛
--      صحيح مسلم: كتاب الزكاة). الأصناف السبعة الكاملة تحقَّقت فردياً عبر
--      3 عمليات WebFetch منفصلة (النص الكامل لم يظهر دفعة واحدة في نتائج
--      البحث فاستُكمل تدريجياً، لا اختلاقاً): الإمام العادل، شاب نشأ في
--      عبادة ربه، رجل قلبه معلق بالمساجد، رجلان تحابا في الله، رجل دعته
--      امرأة ذات منصب وجمال فقال إني أخاف الله، رجل تصدق بصدقة فأخفاها
--      حتى لا تعلم شماله ما تنفق يمينه، رجل ذكر الله خالياً ففاضت عيناه.
--   2. الرحمة بالحيوان في السنة — حديثان مقترنان متفق عليهما: (أ) امرأة
--      عُذّبت في هرة سجنتها حتى ماتت جوعاً فدخلت النار بسببها (تحقَّق
--      ورودها في صحيح البخاري عبر اقتباس "قال البخاري..." في البداية
--      والنهاية لابن كثير)، (ب) رجل سقى كلباً عطشاناً بخفّه فشكر الله له
--      فغفر له (تحقَّق: صحيح البخاري كتاب الأدب/المظالم، صحيح مسلم كتاب
--      السلام). لم يُذكر اسم الراوي لحديث الهرة تحديداً لعدم توفره صراحة
--      في نتائج البحث المتاحة (اكتُفي بـ"متفق عليه" بلا اسم صحابي غير
--      مؤكَّد).
--   3. خيركم من تعلم القرآن وعلمه — عن عثمان بن عفان رضي الله عنه، صحيح
--      البخاري، كتاب فضائل القرآن، الباب 21 (تحقَّق موضعه الدقيق عبر
--      WebFetch).
--   4. أدب الطعام: التسمية والأكل باليمين ومما يلي الآكل — حديث عمر بن
--      أبي سلمة رضي الله عنه (ربيب النبي ﷺ) "يا غلام سمِّ الله وكل
--      بيمينك وكل مما يليك"، صحيح البخاري، كتاب الأطعمة/النفقات (تحقَّق
--      عبر WebFetch مع سياقه الكامل: كانت يده تطيش في الصحفة).
--
-- الكتاب المرجعي: "صحيح البخاري" نفسه (موجود مسبقاً في الفهرس، مؤلفه
-- الإمام محمد بن إسماعيل البخاري) — العنصر العام الموجود مسبقاً يبقى
-- مرتبطاً بكامل الكتاب، وهذه العناصر الأربعة تربط أحاديث محددة منه.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := 'c6a272b8-5e6b-46e2-a4d5-6b6dabef72dc';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'حديث السبعة الذين يظلهم الله في ظله'
  ) THEN
    RAISE NOTICE 'عناصر صحيح البخاري المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'حديث السبعة الذين يظلهم الله في ظله', 'الأصناف السبعة الذين يظلهم الله يوم لا ظل إلا ظله: الإمام العادل، وشاب نشأ في عبادة ربه، ورجل قلبه معلق بالمساجد، ورجلان تحابا في الله، ورجل دعته امرأة ذات منصب وجمال فقال إني أخاف الله، ورجل تصدق بصدقة فأخفاها، ورجل ذكر الله خالياً ففاضت عيناه — متفق عليه عن أبي هريرة رضي الله عنه.', 1, 20, 20, true, 'manual_confirm', null, 2, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'الرحمة بالحيوان في السنة', 'حديثان متقابلان متفق عليهما: امرأة عُذِّبت في هرة سجنتها فماتت جوعاً فدخلت بسببها النار، ورجل سقى كلباً عطشاناً بخفّه فشكر الله له فغفر له — أصل عظيم في الرحمة بالحيوان وأن الأعمال الصغيرة قد تكون سبباً للنجاة أو الهلاك.', 1, 15, 20, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'خيركم من تعلم القرآن وعلمه', 'فضل تعلم القرآن الكريم وتعليمه — حديث عثمان بن عفان رضي الله عنه، صحيح البخاري، كتاب فضائل القرآن.', 1, 10, 20, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'أدب الطعام: التسمية والأكل باليمين', 'حديث عمر بن أبي سلمة رضي الله عنه (ربيب النبي ﷺ) في آداب الأكل: «يا غلام سمِّ الله، وكل بيمينك، وكل مما يليك» — صحيح البخاري، كتاب الأطعمة.', 1, 10, 20, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'صحيح البخاري', 'الإمام محمد بن إسماعيل البخاري', 'أساسية إلزامية', 'حديث السبعة الذين يظلهم الله في ظله', 'المتن الأصلي للمقرر، يكمّل العنصر العام المرتبط بكامل الكتاب', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'صحيح البخاري', 'الإمام محمد بن إسماعيل البخاري', 'أساسية إلزامية', 'أحاديث الرحمة بالحيوان', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'صحيح البخاري', 'الإمام محمد بن إسماعيل البخاري', 'أساسية إلزامية', 'حديث فضل تعلم القرآن', 'المتن الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'صحيح البخاري', 'الإمام محمد بن إسماعيل البخاري', 'أساسية إلزامية', 'حديث آداب الطعام', 'المتن الأصلي للمقرر', 'library-catalog.ts');

  -- إعادة توازن الوزن: العنصر الوحيد الموجود كان weight=100 (وحيد في الوحدة)،
  -- الآن 5 عناصر فيُعاد توازنها إلى 20 لكل عنصر (تجمع 100 كالسابق).
  UPDATE learning_items SET weight = 20 WHERE unit_id = v_unit_id AND title = 'صحيح البخاري' AND item_type = 'lesson';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'hadith';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر صحيح البخاري + 4 صفوف course_books';
END $$;
