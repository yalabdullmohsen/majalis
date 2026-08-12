-- ═══════════════════════════════════════════════════════════════════════════
-- link_sunnah_vs_science_book_v1.sql
--
-- سياق: تكملة منهجية اكتشاف الفجوات (courses بلا course_books، عناصر
-- تُسمِّي كتباً غير موجودة بالمكتبة) — مقرر "دعوى تعارض السنة مع العلم
-- التجريبي" داخل hadith له عنصر تعليمي موجود فعلاً بعنوان يطابق كتاباً
-- حرفياً («قراءة في كتاب دعوى تعارض السنة النبوية مع العلم التجريبي»)
-- لكن بلا course_books مربوط، لأن الكتاب نفسه لم يكن موجوداً في
-- library-catalog.ts. أُضيف الكتاب أولاً (`book-daawa-taarud-sunnah-ilm`،
-- تحقّق عبر WebSearch: دراسة دكتوراه معاصرة حقيقية من الجامعة الإسلامية
-- بالمدينة، للدكتور راشد صليهم الهاجري، نُشرت 1444هـ/2023م) ثم يربطه هذا
-- الملف بالعنصر الموجود — بلا أي تعديل على العنصر نفسه.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_item_id uuid;
BEGIN
  SELECT li.id INTO v_item_id
  FROM learning_items li
  JOIN course_units cu ON li.unit_id = cu.id
  JOIN courses c ON cu.course_id = c.id
  WHERE c.slug = 'sunnah-vs-science'
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'عنصر مقرر sunnah-vs-science غير موجود';
  END IF;

  IF EXISTS (SELECT 1 FROM course_books WHERE learning_item_id = v_item_id) THEN
    RAISE NOTICE 'مُنجَز مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES (gen_random_uuid(), v_item_id, 'دعوى تعارض السنة النبوية مع العلم التجريبي: دراسة نقدية تطبيقية', 'د. راشد صليهم الصليهم الهاجري', 'أساسية إلزامية', 'الدراسة كاملة (جزءان)', 'الكتاب الوحيد لهذا العنوان بعينه، موجود الآن في مكتبة المنصة (/library/book-daawa-taarud-sunnah-ilm)', 'مكتبة المجلس العلمي');

  RAISE NOTICE 'رُبط عنصر sunnah-vs-science: item_id=%', v_item_id;
END $$;
