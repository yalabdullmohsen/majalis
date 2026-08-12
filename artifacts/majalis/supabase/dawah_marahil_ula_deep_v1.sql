-- ═══════════════════════════════════════════════════════════════════════════
-- dawah_marahil_ula_deep_v1.sql
--
-- تعميق مقرر "مراحل الدعوة النبوية الأولى" (dawah path، وحدة
-- `10a3e9d4...`) من عنصرين وصفيين عامّين (الدعوة السرية، الجهر بالدعوة)
-- بإضافة عنصر واحد بحدث محدد من مرحلة الجهر — تكملة قائمة المقررات
-- السطحية المتبقية (بطلب المنسّق).
--
-- تجنُّب التكرار المموَّه: العنصر الموجود "الجهر بالدعوة" يذكر عموماً
-- "دعوة العشيرة الأقربين" — العنصر الجديد لا يكرر هذا الوصف العام، بل
-- يضيف الحدث المحدد بنصه الحرفي (نداء الصفا) غير الموجود في وصف العنصر
-- الأصلي.
--
-- سلامة الاستشهاد: صعود النبي ﷺ جبل الصفا ونداؤه «يا صباحاه» ثم قوله
-- لقريش «أرأيتكم لو أخبرتكم أن خيلاً بالوادي تريد أن تغير عليكم أكنتم
-- مصدِّقيّ؟» — متفق عليه (صحيح البخاري ومسلم)، تنفيذاً لأمر آية الشعراء
-- (214): «وأنذر عشيرتك الأقربين» (تحقَّقت حرفياً من
-- public/data/quran/surah-026.json).
--
-- الكتاب المرجعي: "الرحيق المختوم" (نفس مرجع العنصرين الموجودين مسبقاً).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := '10a3e9d4-182b-499c-8592-0eaa423e9eca';
  v_item1 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'نداء الصفا: إنذار العشيرة الأقربين'
  ) THEN
    RAISE NOTICE 'عنصر مراحل الدعوة النبوية الأولى المعمَّق موجود مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'نداء الصفا: إنذار العشيرة الأقربين', 'تنفيذاً لآية الشعراء (214) «وأنذر عشيرتك الأقربين»، صعد النبي ﷺ جبل الصفا ونادى «يا صباحاه» حتى اجتمعت قريش، فقال: «أرأيتكم لو أخبرتكم أن خيلاً بالوادي تريد أن تغير عليكم أكنتم مصدِّقيّ؟» قالوا: نعم. قال: «فإني نذير لكم بين يدي عذاب شديد» — متفق عليه.', 1, 15, 34, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'الرحيق المختوم', 'الشيخ صفي الرحمن المباركفوري', 'أساسية إلزامية', 'نداء الصفا', 'المرجع الأصلي للمقرر، يكمّل العنصرين الوصفيين الموجودين بحدث محدد', 'library-catalog.ts');

  UPDATE learning_items SET weight = 33 WHERE unit_id = v_unit_id AND title IN ('الدعوة السرية', 'الجهر بالدعوة');

  UPDATE learning_paths SET total_sessions = total_sessions + 1 WHERE slug = 'dawah';

  RAISE NOTICE 'أُدخل عنصر جديد لمقرر مراحل الدعوة النبوية الأولى + صف course_books';
END $$;
