-- إصلاح فجوة ربط مكتبي سابقة اكتُشِفت أثناء التحقق من دفعة
-- seerah_deep_wafat_nabi_v1.sql: عناصر sort_order 2-4 (الهجرة، صلح
-- الحديبية، حجة الوداع) في seerah-deep لم يكن لها أي صف course_books
-- إطلاقًا (فقط sort_order 1 كان مربوطًا بكتاب "السيرة النبوية" لابن
-- هشام) — فجوة قديمة سابقة لهذه الجلسة، لا علاقة لها بدفعة اليوم، لكن
-- اكتُشِفت أثناء فحص روتيني لعدد الروابط بعد إضافة العناصر الخمسة
-- الجديدة. أُصلحت بنفس نمط بقية كورسات السيرة (الرحيق المختوم).
DO $$
BEGIN
  INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  SELECT li.id, 'الرحيق المختوم', 'الشيخ صفي الرحمن المباركفوري', 'أساسية إلزامية',
         'باب متصل بموضوع: ' || li.title,
         'مرجع سيرة معتمَد وشامل، مستخدَم فعلاً في كورسات السيرة الأخرى بالمسار — موجود في مكتبة المنصة (/library/book-raheeq)',
         'مكتبة المجلس العلمي'
  FROM learning_items li
  JOIN course_units cu ON cu.id = li.unit_id
  JOIN courses c ON c.id = cu.course_id
  WHERE c.slug = 'seerah-deep' AND li.sort_order IN (2,3,4);
END $$;
