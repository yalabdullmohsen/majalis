-- توسيع مسار "آداب حامل القرآن" (uloom-quran path) من 3 إلى 9 أبواب من أصل
-- 10 أبواب لكتاب "التبيان في آداب حملة القرآن" للنووي (تحقَّقت أبواب الكتاب
-- العشرة عبر ويكيبيديا العربية؛ الباب العاشر ملحق لغوي بأسماء/ألفاظ الكتاب،
-- لا محتوى تعليمي قائم بذاته، فاستُبعد عمدًا دون ادّعاء اكتمال زائف).
-- نفس نمط course waraqat-intro الناجح: item_type='book' + description
-- موجزة + course_books تربط كل عنصر بالكتاب نفسه بحقل scope_description.

BEGIN;

-- 1) إعادة ترقيم العناصر الثلاثة الموجودة لتتبع ترتيب الأبواب الحقيقي
--    في الكتاب (1، 5، 6) بدل الترتيب العرضي الحالي (1، 2، 3)، وتوحيد
--    الأوزان (weight) على 9 عناصر بدل 3.
UPDATE learning_items SET sort_order = 5, weight = 11.00
  WHERE id = 'f609db5c-4e94-4c2f-8409-6c9e7808c7c8'; -- الباب الخامس (كان sort_order=2)

UPDATE learning_items SET sort_order = 6, weight = 11.00
  WHERE id = '264be038-1d8b-480d-8ff9-895edbf55c72'; -- الباب السادس (كان sort_order=3)

UPDATE learning_items SET weight = 12.00
  WHERE id = '95cc74a4-a7d7-4b46-9a5f-0491024bd13b'; -- الباب الأول (sort_order يبقى 1)

-- 2) تحديث وصف الدورة ليعكس التغطية الموسَّعة (9 من 10 أبواب، صراحةً)
UPDATE courses SET description =
  'قراءة موجَّهة في تسعة من أبواب "التبيان في آداب حملة القرآن" للنووي العشرة: فضل التلاوة وحملته، ترجيح القراءة، إكرام أهل القرآن، آداب التعليم والتعلّم، آداب حامله، آداب القراءة (معظم الكتاب)، آداب عموم الناس معه، الآيات المستحبة في أوقاتها، وآداب كتابته وإكرام المصحف.'
  WHERE id = '7600459b-fff5-4b32-95e0-4928b4f8e3bf';

-- 3) إضافة 6 عناصر جديدة للأبواب 2، 3، 4، 7، 8، 9
WITH new_items AS (
  INSERT INTO learning_items
    (unit_id, item_type, title, description, sort_order, status, is_approved,
     is_required, completion_method, completion_threshold, session_estimate, weight)
  VALUES
    ('c23171f2-e9f6-4594-a1e8-dcd615bf1f71', 'book',
     'ترجيح القراءة والقارئ',
     'الباب الثاني من "التبيان": في تفضيل بعض وجوه القراءة على بعض، وفضل بعض القراء على بعض.',
     2, 'published', true, true, 'manual_confirm', 100.00, 1.0, 11.00),
    ('c23171f2-e9f6-4594-a1e8-dcd615bf1f71', 'book',
     'إكرام أهل القرآن',
     'الباب الثالث من "التبيان": في وجوب إكرام حَمَلة القرآن وتوقيرهم واحترام مكانتهم بين الناس.',
     3, 'published', true, true, 'manual_confirm', 100.00, 1.0, 11.00),
    ('c23171f2-e9f6-4594-a1e8-dcd615bf1f71', 'book',
     'آداب معلّم القرآن ومتعلّمه',
     'الباب الرابع من "التبيان": في آداب معلّم القرآن ومتعلّمه، وما ينبغي أن يكون عليه كلٌّ منهما في مجلس التعليم.',
     4, 'published', true, true, 'manual_confirm', 100.00, 1.0, 11.00),
    ('c23171f2-e9f6-4594-a1e8-dcd615bf1f71', 'book',
     'آداب عموم الناس مع القرآن',
     'الباب السابع من "التبيان": في آداب عموم الناس (لا الحفّاظ خاصة) في التعامل مع المصحف والقرآن.',
     7, 'published', true, true, 'manual_confirm', 100.00, 1.0, 11.00),
    ('c23171f2-e9f6-4594-a1e8-dcd615bf1f71', 'book',
     'الآيات والسور المستحبة في أوقاتها',
     'الباب الثامن من "التبيان": في الآيات والسور التي يُستحب قراءتها في أوقات وأحوال مخصوصة.',
     8, 'published', true, true, 'manual_confirm', 100.00, 1.0, 11.00),
    ('c23171f2-e9f6-4594-a1e8-dcd615bf1f71', 'book',
     'كتابة القرآن وإكرام المصحف',
     'الباب التاسع من "التبيان": في آداب كتابة القرآن، ووجوب إكرام المصحف وصيانته.',
     9, 'published', true, true, 'manual_confirm', 100.00, 1.0, 11.00)
  RETURNING id, sort_order
)
INSERT INTO course_books
  (learning_item_id, book_title, book_author, material_role, scope_description,
   inclusion_reason, source_name, source_url, license_note, library_item_id)
SELECT
  ni.id,
  'التبيان في آداب حملة القرآن',
  'الإمام يحيى بن شرف النووي',
  'أساسية إلزامية',
  CASE ni.sort_order
    WHEN 2 THEN 'الباب الثاني'
    WHEN 3 THEN 'الباب الثالث'
    WHEN 4 THEN 'الباب الرابع'
    WHEN 7 THEN 'الباب السابع'
    WHEN 8 THEN 'الباب الثامن'
    WHEN 9 THEN 'الباب التاسع'
  END,
  'المتن التأسيسي القياسي في آداب حامل القرآن، عشرة أبواب — موجود في مكتبة المنصة (/library/book-tibyan)',
  'مكتبة المجلس العلمي',
  NULL,
  NULL,
  NULL
FROM new_items ni;

COMMIT;
