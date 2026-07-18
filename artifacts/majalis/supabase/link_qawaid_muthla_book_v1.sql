-- ═══════════════════════════════════════════════════════════════════════════
-- link_qawaid_muthla_book_v1.sql
--
-- سياق: تكملة لفحص "مسارات بدورات بلا course_books" — مقرر "القواعد
-- المثلى في صفات الله وأسمائه الحسنى" داخل aqeedah له عنصر تعليمي موجود
-- فعلاً بعنوان يطابق الكتاب حرفياً («الدورة العلمية التأصيلية — القواعد
-- المثلى...») لكن بلا course_books مربوط، لأن الكتاب نفسه لم يكن موجوداً
-- في library-catalog.ts. أُضيف الكتاب أولاً (`book-qawaid-muthla`،
-- src/lib/library-catalog.ts) ثم يربطه هذا الملف بالعنصر الموجود — بلا
-- أي تعديل على العنصر نفسه.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_item_id uuid;
  v_path_id uuid;
BEGIN
  SELECT li.id INTO v_item_id
  FROM learning_items li
  JOIN course_units cu ON li.unit_id = cu.id
  JOIN courses c ON cu.course_id = c.id
  WHERE c.slug = 'qawaid-muthla'
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'عنصر مقرر qawaid-muthla غير موجود';
  END IF;

  IF EXISTS (SELECT 1 FROM course_books WHERE learning_item_id = v_item_id) THEN
    RAISE NOTICE 'مُنجَز مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES (gen_random_uuid(), v_item_id, 'القواعد المثلى في صفات الله وأسمائه الحسنى', 'الشيخ محمد بن صالح العثيمين', 'أساسية إلزامية', 'الرسالة كاملة', 'الكتاب الوحيد لهذا العنوان بعينه، موجود الآن في مكتبة المنصة (/library/book-qawaid-muthla)', 'مكتبة المجلس العلمي');

  RAISE NOTICE 'رُبط عنصر qawaid-muthla: item_id=%', v_item_id;
END $$;
