-- ═══════════════════════════════════════════════════════════════════════════
-- manhaj_hiwar_tadarruj_deep_v1.sql
--
-- تعميق مقرر "منهج الحوار والتدرج" (dawah path، وحدة `d6ca471f...`) من
-- عنصر واحد عام (عن الحكمة والموعظة الحسنة والجدال بالتي هي أحسن،
-- النحل: 125) إلى 5 عناصر بإضافة 4 أمثلة حقيقية لمبدأ "التدرج" تحديداً
-- (الجانب غير المُغطَّى بالعنصر الموجود، الذي يركّز على الحوار لا
-- التدرج) — تكملة قائمة المقررات السطحية المتبقية (بطلب المنسّق).
--
-- سلامة الاستشهاد (كل نص/آية تحقَّق عبر WebFetch أو محلياً):
--   1. التدرج في الدعوة إلى التوحيد — حديث بعث النبي ﷺ معاذ بن جبل إلى
--      اليمن: «إنك تأتي قوماً من أهل الكتاب، فليكن أول ما تدعوهم إليه
--      شهادة أن لا إله إلا الله، فإن هم أطاعوا لذلك فأعلمهم أن الله
--      افترض عليهم خمس صلوات...» — متفق عليه (البخاري ومسلم).
--   2. التدرج في التشريع: تحريم الخمر مثالاً — ثلاث مراحل قرآنية
--      متتابعة، كل آية تحقَّقت حرفياً من الملفات المحلية: (أ) البقرة:
--      219 «فيهما إثم كبير ومنافع للناس»، (ب) النساء: 43 «لا تقربوا
--      الصلاة وأنتم سكارى»، (ج) المائدة: 90-91 «فاجتنبوه... فهل أنتم
--      منتهون» (التحريم القاطع).
--   3. الرفق في الدعوة — «إن الرفق لا يكون في شيء إلا زانه، ولا يُنزع
--      من شيء إلا شانه» — صحيح مسلم، عن عائشة رضي الله عنها.
--   4. مراتب تغيير المنكر — «من رأى منكم منكراً فليغيره بيده، فإن لم
--      يستطع فبلسانه، فإن لم يستطع فبقلبه، وذلك أضعف الإيمان» — صحيح
--      مسلم، عن أبي سعيد الخدري رضي الله عنه.
--
-- الكتاب المرجعي: "زاد المعاد" (نفس مرجع العنصر العام الموجود مسبقاً في
-- هذه الوحدة، لابن القيم) — العنصر العام يبقى كما هو.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := 'd6ca471f-9b5b-42c5-96b7-307c69272179';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'التدرج في الدعوة: حديث بعث معاذ إلى اليمن'
  ) THEN
    RAISE NOTICE 'عناصر منهج الحوار والتدرج المعمَّقة موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'التدرج في الدعوة: حديث بعث معاذ إلى اليمن', 'حديث النبي ﷺ لمعاذ بن جبل عند إرساله إلى اليمن: «فليكن أول ما تدعوهم إليه شهادة أن لا إله إلا الله، فإن هم أطاعوا لذلك فأعلمهم أن الله افترض عليهم خمس صلوات في كل يوم وليلة، فإن هم أطاعوا لذلك فأعلمهم أن الله افترض عليهم صدقة تؤخذ من أغنيائهم فتُرد على فقرائهم» — متفق عليه.', 1, 15, 20, true, 'manual_confirm', null, 2, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'التدرج في التشريع: تحريم الخمر مثالاً', 'ثلاث مراحل قرآنية متتابعة في تحريم الخمر: (1) البقرة: 219 «فيهما إثم كبير ومنافع للناس وإثمهما أكبر من نفعهما»، (2) النساء: 43 «لا تقربوا الصلاة وأنتم سكارى»، (3) المائدة: 90-91 «إنما الخمر والميسر... رجس من عمل الشيطان فاجتنبوه» (التحريم القاطع).', 1, 15, 20, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'الرفق في الدعوة', 'حديث عائشة رضي الله عنها: «إن الرفق لا يكون في شيء إلا زانه، ولا يُنزع من شيء إلا شانه» — صحيح مسلم؛ أصل عظيم في اختيار الأسلوب الرفيق في الدعوة والتعامل.', 1, 12, 20, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'مراتب تغيير المنكر', 'حديث أبي سعيد الخدري رضي الله عنه: «من رأى منكم منكراً فليغيره بيده، فإن لم يستطع فبلسانه، فإن لم يستطع فبقلبه، وذلك أضعف الإيمان» — صحيح مسلم؛ تدرج الإنكار بحسب القدرة والمصلحة.', 1, 12, 20, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'زاد المعاد', 'ابن القيم الجوزية', 'أساسية إلزامية', 'حديث بعث معاذ إلى اليمن', 'المرجع الأصلي للمقرر، يكمّل العنصر العام المرتبط بكامل الكتاب', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'زاد المعاد', 'ابن القيم الجوزية', 'أساسية إلزامية', 'التدرج في تحريم الخمر', 'المرجع الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'زاد المعاد', 'ابن القيم الجوزية', 'أساسية إلزامية', 'الرفق في الدعوة', 'المرجع الأصلي للمقرر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'زاد المعاد', 'ابن القيم الجوزية', 'أساسية إلزامية', 'مراتب تغيير المنكر', 'المرجع الأصلي للمقرر', 'library-catalog.ts');

  -- إعادة توازن الوزن: العنصر الوحيد الموجود كان weight=100 (وحيد في الوحدة)،
  -- الآن 5 عناصر فيُعاد توازنها إلى 20 لكل عنصر (تجمع 100 كالسابق).
  UPDATE learning_items SET weight = 20 WHERE unit_id = v_unit_id AND title = 'الحكمة والموعظة الحسنة والجدال بالتي هي أحسن';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'dawah';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر منهج الحوار والتدرج + 4 صفوف course_books';
END $$;
