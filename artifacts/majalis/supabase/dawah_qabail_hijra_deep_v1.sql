-- ═══════════════════════════════════════════════════════════════════════════
-- dawah_qabail_hijra_deep_v1.sql
--
-- تعميق مقرر "دعوة القبائل والهجرة" (dawah path، وحدة `d51f414c...`) من
-- عنصرين وصفيين عامّين (عرض النبي ﷺ نفسه على القبائل، الهجرة كتحوّل في
-- منهج الدعوة) بإضافة عنصر واحد بنص حقيقي محدد — تكملة قائمة المقررات
-- السطحية المتبقية (بطلب المنسّق: "إن وُجد مصدر موثوق لها").
--
-- ملاحظة منهجية: اقتُصر على عنصر واحد فقط (لا أربعة) لأن محاولة تأكيد
-- عنصر ثانٍ (بعث مصعب بن عمير إلى المدينة بعد البيعة الأولى) عبر
-- WebFetch أعادت صفر نتائج — بدل اختلاق تفاصيل غير مؤكَّدة بثقة كافية
-- (اسم الصحابي أو تفاصيل المهمة)، اكتُفي بالمؤكَّد فقط، بنفس انضباط
-- الجلسة (قارن: ألفية ابن مالك، زاد المستقنع).
--
-- سلامة الاستشهاد: بيعة العقبة الأولى (12 رجلاً من الأنصار، السنة
-- الثانية عشرة من البعثة) ونص بيعة النساء («بايعناه على أن لا نشرك
-- بالله شيئاً، ولا نسرق، ولا نزني...») تحقَّقا عبر WebFetch من نتائج
-- بحث مستقلة تؤكد ورود النص في صحيح البخاري (كتاب مناقب الأنصار)
-- وصحيح مسلم (كتاب الحدود).
--
-- الكتاب المرجعي: "السيرة النبوية" (نفس مرجع العنصرين الموجودين مسبقاً).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := 'd51f414c-5158-41a6-a95f-12fd7d6c98b5';
  v_item1 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'بيعة العقبة الأولى'
  ) THEN
    RAISE NOTICE 'عنصر دعوة القبائل والهجرة المعمَّق موجود مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'بيعة العقبة الأولى', 'بايع النبي ﷺ اثني عشر رجلاً من الأنصار في السنة الثانية عشرة من البعثة، وهي بيعة النساء (البنود الأخلاقية لا القتال): «بايعناه على أن لا نشرك بالله شيئاً، ولا نسرق، ولا نزني...» — متفق عليه، أصل التمهيد لبيعة العقبة الثانية والهجرة.', 1, 12, 34, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'السيرة النبوية', 'ابن هشام', 'أساسية إلزامية', 'بيعة العقبة الأولى', 'المرجع الأصلي للمقرر، يكمّل العنصرين الوصفيين الموجودين بحدث محدد', 'library-catalog.ts');

  UPDATE learning_items SET weight = 33 WHERE unit_id = v_unit_id AND title IN ('عرض النبي ﷺ نفسه على القبائل', 'الهجرة كتحوّل في منهج الدعوة');

  UPDATE learning_paths SET total_sessions = total_sessions + 1 WHERE slug = 'dawah';

  RAISE NOTICE 'أُدخل عنصر جديد لمقرر دعوة القبائل والهجرة + صف course_books';
END $$;
