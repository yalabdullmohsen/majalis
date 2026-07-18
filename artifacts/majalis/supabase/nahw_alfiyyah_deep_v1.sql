-- ═══════════════════════════════════════════════════════════════════════════
-- nahw_alfiyyah_deep_v1.sql
--
-- تعميق مقرر "النحو والصرف المتقدّم — ألفية ابن مالك" (nahw path، وحدة
-- `eae5b2db...`) من عنصرين (منهج ابن مالك، الأبواب الصرفية — عرض عام
-- لبنية الألفية، وزن 50/50) بإضافة عنصر واحد فقط يحتوي البيت الافتتاحي
-- الفعلي (نص حقيقي من المنظومة، لا وصف عنها) — تكملة قائمة المقررات
-- السطحية المتبقية (بطلب المنسّق).
--
-- ملاحظة منهجية: اقتُصر على عنصر واحد جديد فقط (لا أربعة كالمعتاد) لأن
-- محاولة تأكيد بيت ثانٍ (باب المبتدأ والخبر) عبر WebFetch من ويكي مصدر
-- أعادت صفر نتائج — بدل اختلاق نص بيت غير مؤكَّد بثقة كافية، اكتُفي
-- بالبيت الوحيد المؤكَّد حرفياً، بنفس انضباط الجلسة في عدم تقديم معلومة
-- غير مؤكَّدة كحقيقة.
--
-- سلامة الاستشهاد: البيت الافتتاحي تحقَّق حرفياً عبر WebFetch من نسختين
-- مستقلتين على ويكي مصدر (نص الألفية نفسه، وشرح ابن عقيل الذي يقتبسه) —
-- «كَلَامُنَا لَفْظٌ مُفِيدٌ كَاسْتَقِمْ، وَاسْمٌ وَفِعْلٌ ثُمَّ حَرْفٌ
-- الكَلِمْ».
--
-- الكتاب المرجعي: "ألفية ابن مالك في النحو والصرف" (نفس مرجع العنصرين
-- الموجودين مسبقاً).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := 'eae5b2db-0da7-4686-9611-d1cb37671598';
  v_item1 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'البيت الافتتاحي: تعريف الكلام'
  ) THEN
    RAISE NOTICE 'عنصر ألفية ابن مالك المعمَّق موجود مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'البيت الافتتاحي: تعريف الكلام', 'البيت الأول من الألفية: «كَلَامُنَا لَفْظٌ مُفِيدٌ كَاسْتَقِمْ، وَاسْمٌ وَفِعْلٌ ثُمَّ حَرْفٌ الكَلِمْ» — يُعرِّف الكلام ويقسمه إلى ثلاثة أقسام (اسم وفعل وحرف)، وهو نفس التقسيم الافتتاحي في متن الآجرومية لكن بصياغة منظومة.', 1, 10, 34, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'ألفية ابن مالك في النحو والصرف', 'ابن مالك الأندلسي', 'أساسية إلزامية', 'البيت الافتتاحي', 'المتن الأصلي للمقرر، يكمّل العنصرين الوصفيين الموجودين بنص حقيقي من المنظومة', 'library-catalog.ts');

  UPDATE learning_items SET weight = 33 WHERE unit_id = v_unit_id AND title IN ('منهج ابن مالك في ترتيب الألفية', 'الأبواب الصرفية في الألفية');

  UPDATE learning_paths SET total_sessions = total_sessions + 1 WHERE slug = 'nahw';

  RAISE NOTICE 'أُدخل عنصر جديد لمقرر ألفية ابن مالك + صف course_books';
END $$;
