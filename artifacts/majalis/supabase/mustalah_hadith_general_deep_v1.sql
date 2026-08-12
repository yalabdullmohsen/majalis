-- ═══════════════════════════════════════════════════════════════════════════
-- mustalah_hadith_general_deep_v1.sql
--
-- تعميق مقرر "مصطلح الحديث" العام (mustalah-hadith path، وحدة
-- `01553d1e...`، كان عنصراً واحداً مرتبطاً بالمنظومة البيقونية) إلى 5
-- عناصر — تكملة لقائمة الـ14 مقرراً السطحياً المتبقية بعد إغلاق أولوية
-- "أهمها علميًا" (بطلب المنسّق).
--
-- تجنُّب التكرار: هذا المسار له مقرران آخران مبنيان مسبقاً هذه الجلسة:
-- "أقسام الحديث" (الصحيح/الحسن/الضعيف/المتواتر/الآحاد) و"نخبة الفكر"
-- (الشاذ/المنكر/المعلَّل/المدرَج/المقلوب/المضطرب) — فاختيرت 4 مصطلحات
-- مختلفة تماماً لا تتقاطع معهما: تصنيف الحديث بحسب قائله (مرفوع/موقوف/
-- مقطوع)، وبحسب اتصال سنده (مسند/متصل/منقطع/مرسل)، وزيادة الثقة، والحديث
-- الموضوع.
--
-- طبيعة المحتوى مختلفة عن دفعات هذه الجلسة السابقة: مصطلح الحديث علمٌ
-- تعريفي/تصنيفي (تعريف كل نوع وضابطه)، لا نصوص أحاديث تحتاج تخريجاً
-- فردياً — المحتوى مبنيّ على "مقدمة ابن الصلاح في علوم الحديث" (الكتاب
-- الأصل لهذا الفن، مرجع الوحدة الحالية بالفعل: العنصر السابق "الحديث
-- الصحيح وشروطه الخمسة" منسوب لها صراحة في وصفه) — تعريفات مستقرة
-- متفَق عليها بين علماء المصطلح، لا خلافية ولا تحتاج WebFetch.
--
-- الكتاب المرجعي: "مقدمة ابن الصلاح في علوم الحديث" (موجودة مسبقاً في
-- الفهرس) — العنصر العام الموجود مسبقاً (مرتبط بالبيقونية) يبقى كما هو.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := '01553d1e-6c6d-4948-842b-bf2d902b25b8';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'المرفوع والموقوف والمقطوع'
  ) THEN
    RAISE NOTICE 'عناصر مصطلح الحديث المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'المرفوع والموقوف والمقطوع', 'تصنيف الحديث بحسب قائله: المرفوع ما أُضيف إلى النبي ﷺ من قول أو فعل أو تقرير، والموقوف ما أُضيف إلى صحابي، والمقطوع ما أُضيف إلى تابعي — تنبيه: "الأثر" يُطلق أحياناً على الموقوف، وأحياناً يشمل المرفوع أيضاً.', 1, 12, 20, true, 'manual_confirm', null, 2, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'المسند والمتصل والمنقطع والمرسل', 'تصنيف الحديث بحسب اتصال سنده: المسند ما اتصل سنده مرفوعاً إلى النبي ﷺ، والمتصل ما اتصل سنده مطلقاً (مرفوعاً أو موقوفاً)، والمنقطع ما سقط من سنده راوٍ واحد في أي موضع، والمرسل ما سقط منه الصحابي (رواه التابعي مباشرة عن النبي ﷺ).', 1, 15, 20, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'زيادة الثقة وحكمها', 'إذا زاد راوٍ ثقة في متن الحديث أو سنده لفظاً لم يروه غيره، فحكمها عند المحدثين تفصيلي: تُقبل إن لم تُخالف من هو أوثق، وتُرد إن تفرَّد بها ضعيف أو خالف بها من هو أحفظ وأضبط منه.', 1, 12, 20, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'الحديث الموضوع وعلامات الوضع', 'الموضوع: الحديث المكذوب المختلَق المنسوب إلى النبي ﷺ زوراً — أخبث أنواع الضعيف وأشدها تحريماً في الرواية. من أبرز علامات الوضع: ركاكة اللفظ أو المعنى، مخالفة صريح القرآن أو المتواتر من السنة أو إجماع الأمة، إفراط الوعد أو الوعيد على عمل يسير، واعتراف الراوي نفسه بالوضع.', 1, 12, 20, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'مقدمة ابن الصلاح في علوم الحديث', 'ابن الصلاح الشهرزوري', 'أساسية إلزامية', 'المرفوع والموقوف والمقطوع', 'الكتاب الأصل لعلم مصطلح الحديث، منسوب إليه العنصر المشابه "الحديث الصحيح وشروطه الخمسة" في نفس الوحدة', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'مقدمة ابن الصلاح في علوم الحديث', 'ابن الصلاح الشهرزوري', 'أساسية إلزامية', 'المسند والمتصل والمنقطع والمرسل', 'الكتاب الأصل لعلم مصطلح الحديث', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'مقدمة ابن الصلاح في علوم الحديث', 'ابن الصلاح الشهرزوري', 'أساسية إلزامية', 'زيادة الثقة', 'الكتاب الأصل لعلم مصطلح الحديث', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'مقدمة ابن الصلاح في علوم الحديث', 'ابن الصلاح الشهرزوري', 'أساسية إلزامية', 'الحديث الموضوع', 'الكتاب الأصل لعلم مصطلح الحديث', 'library-catalog.ts');

  -- إعادة توازن الوزن: العنصر الوحيد الموجود كان weight=100 (وحيد في الوحدة)،
  -- الآن 5 عناصر فيُعاد توازنها إلى 20 لكل عنصر (تجمع 100 كالسابق).
  UPDATE learning_items SET weight = 20 WHERE unit_id = v_unit_id AND title = 'مصطلح الحديث';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'mustalah-hadith';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر مصطلح الحديث العام + 4 صفوف course_books';
END $$;
