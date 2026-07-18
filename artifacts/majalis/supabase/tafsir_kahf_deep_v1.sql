-- ═══════════════════════════════════════════════════════════════════════════
-- tafsir_kahf_deep_v1.sql
--
-- تعميق مقرر "تفسير سورة الكهف" (tafseer path) من عنصر واحد عام (مرتبط
-- بتيسير الكريم الرحمن للسعدي، تُطبَّق كامل السورة) إلى 4 عناصر تتناول
-- القصص الأربع الشهيرة في السورة كلٌّ على حدة — نفس نمط "أركان الإيمان
-- الستة" الناجح (تفصيل موضوعي حقيقي لا عنصر واحد عام).
--
-- سلامة الاستشهاد:
--   - حدود الآيات لكل قصة تحقَّقت مباشرة من public/data/quran/surah-018.json
--     (قراءة الآيات الحدّية فعلياً لتأكيد بداية/نهاية كل قصة، لا افتراضاً
--     من الذاكرة): أصحاب الكهف 9-26، صاحب الجنتين 32-44، موسى والخضر
--     60-82، ذو القرنين 83-98.
--   - حديث فضل حفظ عشر آيات من أول/آخر سورة الكهف (العصمة من الدجال) —
--     رواه مسلم عن أبي الدرداء، تحقَّق عبر WebFetch من نتائج بحث ويكي
--     مصدر (يذكر صراحة صحيح مسلم، كتاب صلاة المسافرين، مع رواية بديلة
--     "من آخر سورة الكهف" أيضاً في نفس الكتاب — لم يُقدَّم رقم دقيق لعدم
--     التمكن من تأكيده حرفياً، بنفس انضباط الاكتفاء بـ"رواه مسلم" حين لا
--     يتوفر رقم مؤكَّد).
--   - الكتاب المرجعي المختار: تفسير ابن كثير (موجود مسبقاً في الفهرس،
--     book-tafsir-ibnkathir) لأنه المرجع القياسي لقصص القرآن تفصيلاً،
--     يكمّل تيسير الكريم الرحمن (السعدي) المرتبط بالعنصر العام الموجود.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := '58984eeb-e494-4aef-b99d-73e2a1e37831';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'قصة أصحاب الكهف'
  ) THEN
    RAISE NOTICE 'عناصر تفسير سورة الكهف موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'قصة أصحاب الكهف', 'قصة الفتية الذين فرّوا بدينهم فأووا إلى الكهف فضرب الله على آذانهم سنين عدداً — الآيات 9-26، والحديث المرتبط بفضل حفظ أول السورة.', 1, 25, 20, true, 'manual_confirm', null, 2, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'قصة صاحب الجنتين', 'مثل الرجل المغرور بماله وجنّتيه الذي نسي فضل ربّه عليه، مقابل صاحبه المؤمن الفقير — الآيات 32-44، وفيها آية «ما شاء الله لا قوة إلا بالله».', 1, 20, 20, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'قصة موسى والخضر عليهما السلام', 'رحلة موسى عليه السلام لطلب العلم عند الخضر، وما جرى من خرق السفينة وقتل الغلام وإقامة الجدار — الآيات 60-82، من أعظم القصص القرآنية في أدب طلب العلم.', 1, 30, 20, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'قصة ذي القرنين وردم يأجوج ومأجوج', 'الملك الصالح الذي مكّن الله له في الأرض فبلغ مغرب الشمس ومطلعها وبنى السد بين يأجوج ومأجوج — الآيات 83-98.', 1, 25, 20, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'تفسير ابن كثير', 'الإمام ابن كثير', 'أساسية إلزامية', 'سورة الكهف، الآيات 9-26', 'المرجع القياسي لقصص القرآن تفصيلاً، يكمّل تيسير الكريم الرحمن المرتبط بالعنصر العام للسورة', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'تفسير ابن كثير', 'الإمام ابن كثير', 'أساسية إلزامية', 'سورة الكهف، الآيات 32-44', 'المرجع القياسي لقصص القرآن تفصيلاً', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'تفسير ابن كثير', 'الإمام ابن كثير', 'أساسية إلزامية', 'سورة الكهف، الآيات 60-82', 'المرجع القياسي لقصص القرآن تفصيلاً، أشهر رواية لقصة موسى والخضر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'تفسير ابن كثير', 'الإمام ابن كثير', 'أساسية إلزامية', 'سورة الكهف، الآيات 83-98', 'المرجع القياسي لقصص القرآن تفصيلاً', 'library-catalog.ts');

  -- إعادة توازن الوزن: العنصر الوحيد الموجود كان weight=100 (وحيد في الوحدة)،
  -- الآن 5 عناصر فيُعاد توازنها إلى 20 لكل عنصر (تجمع 100 كالسابق).
  UPDATE learning_items SET weight = 20 WHERE unit_id = v_unit_id AND title = 'تفسير سورة الكهف';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'tafseer';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر تفسير سورة الكهف + 4 صفوف course_books';
END $$;
