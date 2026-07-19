-- فحص شامل لفجوات الربط المكتبي (course_books) عبر كل الكورسات
-- المنشورة على المنصة (بطلب المنسِّق للمتابعة بعد إغلاق فجوة seerah-
-- deep الجانبية). النتيجة: 15 كورساً فيها فجوة (عدد العناصر لا يطابق
-- عدد الروابط)، غالبيتها نمط متكرر: عنصر أول مربوط بكتاب واضح، وعناصر
-- لاحقة أُضيفت في دفعات تعميق سابقة (سواء هذه الجلسة أو جلسات أقدم)
-- دون تمديد نفس الربط إليها رغم أنها استمرار مباشر لنفس الكتاب/الموضوع.
--
-- استُبعِد من هذه الدفعة:
--   - nawaqid-islam sort_order=99: عنصر "اختبر نفسك" item_type='assessment'
--     (اختبار لا كتاب) — عدم الربط هنا صحيح بالتصميم، ليس فجوة.
--   - talkhees-muqni: عنصر وحيد بلا وصف أصلاً (item_type='lesson' فارغ)،
--     موثَّق مسبقًا في CONTINUATION_PLAN.md كأحد 6 كورسات محظورة بلا
--     مصدر خارجي يمكن التحقق منه — لم يُمَس، يبقى محظورًا لا مُهمَلاً.
--   - minhaj-muslim (6 عناصر): اكتُشِف أن العنصر الوحيد المربوط أصلاً
--     (sort_order=1) يشير لكتاب "منهاج المسلم" لأبي بكر جابر الجزائري
--     — كتاب حقيقي مشهور، لكنه **غير موجود إطلاقًا في
--     library-catalog.ts** (لا صفحة /library/ له على المنصة، بخلاف كل
--     الروابط الأخرى في هذه الدفعة والدفعات السابقة). تمديد نفس الربط
--     لبقية العناصر كان سيُكرِّر رابطًا لا يقود لصفحة حقيقية على
--     المنصة — تُرِك بلا تعديل، ويُوصى بتسجيله للمالك: إما إضافة الكتاب
--     فعليًا لـlibrary-catalog.ts، أو استبدال الرابط بكتاب موجود فعلاً.
--
-- كل الروابط أدناه تمتد كتبًا **حقيقية موجودة بالفعل في
-- library-catalog.ts** (تحقَّق فردي لكل عنوان قبل الكتابة)، ولا تُضيف
-- أي محتوى شرعي جديد — ربط بيانات وصفية بحتة (بنفس الكتاب المُستخدَم
-- أصلاً لعناصر أخرى بنفس الكورس، أو لموضوع مطابق تمامًا).
DO $$
BEGIN
  -- الأنماط البسيطة: نسخ (book_title, book_author) من عنصر مربوط أصلاً
  -- بنفس الكورس إلى كل عنصر غير مربوط فيه (نفس الكتاب بالضبط).
  INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  SELECT unlinked.id, ref.book_title, ref.book_author, 'مادة مساندة',
         'باب متصل بموضوع: ' || unlinked.title,
         'نفس الكتاب المُعتمَد فعلاً لعناصر أخرى بهذا الكورس — موجود في مكتبة المنصة',
         'مكتبة المجلس العلمي'
  FROM learning_items unlinked
  JOIN course_units cu ON cu.id = unlinked.unit_id
  JOIN courses c ON c.id = cu.course_id
  JOIN LATERAL (
    SELECT cb.book_title, cb.book_author
    FROM course_books cb
    JOIN learning_items li2 ON li2.id = cb.learning_item_id
    JOIN course_units cu2 ON cu2.id = li2.unit_id
    WHERE cu2.course_id = c.id
    ORDER BY li2.sort_order
    LIMIT 1
  ) ref ON true
  LEFT JOIN course_books existing ON existing.learning_item_id = unlinked.id
  WHERE c.slug IN ('adab-al-usrah','arabic-mujam-wasit','fiqh-hanafi','fiqh-shafii',
                    'mustalah-aqsam-hadith','nukhbat-fikr','qawaid-muthla','tafsir-general',
                    'waraqat-intro')
    AND existing.id IS NULL;

  -- fiqh-ibadat sort_order=3 تحديدًا: يناقش "فتح المعين والإمام
  -- المليباري" (الكتاب الذي شرحه sort_order=2)، لا سجود السهو
  -- (sort_order=1) — يُربَط بكتاب إعانة الطالبين تحديدًا لا فقه السنة.
  INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  SELECT li.id, 'إعانة الطالبين على حل ألفاظ فتح المعين', 'أبو بكر عثمان بن محمد شطا الدمياطي', 'مادة مساندة',
         'باب متصل بموضوع: ' || li.title,
         'العنصر يناقش هذا الكتاب تحديدًا (شرح فتح المعين) — موجود في مكتبة المنصة',
         'مكتبة المجلس العلمي'
  FROM learning_items li
  JOIN course_units cu ON cu.id = li.unit_id
  JOIN courses c ON c.id = cu.course_id
  WHERE c.slug = 'fiqh-ibadat' AND li.sort_order = 3;

  -- uloom-quran-mutaqaddima sort_order 5-6 (فواتح السور، القسم في
  -- القرآن): مواضيع علوم قرآن كلاسيكية مُغطاة باستفاضة في البرهان
  -- للزركشي تحديدًا (المُستخدَم أصلاً لعنصري 2-3 من نفس الكورس).
  INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  SELECT li.id, 'البرهان في علوم القرآن', 'الإمام بدر الدين الزركشي', 'مادة مساندة',
         'باب متصل بموضوع: ' || li.title,
         'نفس الكتاب المُعتمَد لعنصري "إعجاز القرآن" و"المحكم والمتشابه" بنفس الكورس — موجود في مكتبة المنصة',
         'مكتبة المجلس العلمي'
  FROM learning_items li
  JOIN course_units cu ON cu.id = li.unit_id
  JOIN courses c ON c.id = cu.course_id
  WHERE c.slug = 'uloom-quran-mutaqaddima' AND li.sort_order IN (5,6);

  -- fiqh-women: كورس بُني هذه الجلسة (7 عناصر) بلا أي ربط مكتبي منذ
  -- البداية — لا عنصر سابق يُنسَخ منه، فيُربَط صراحة بكتاب "فقه السنة"
  -- (نفس الكتاب المُستخدَم لفيقه المعاملات والأسرة هذه الجلسة، يغطي
  -- الاستحاضة والحجاب والعدة والمهر والنفقة والخلع ضمن نطاقه الشامل).
  -- material_role "قراءة إثرائية" لا "أساسية إلزامية": الكتاب لم
  -- يُستخدَم كمصدر أساسي مباشر عند كتابة هذه العناصر، بل كمرجع إثرائي
  -- مناسب الموضوع (نفس التصنيف المُستخدَم فعلاً لفيقه المعاملات/الأسرة).
  INSERT INTO course_books (learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  SELECT li.id, 'فقه السنة', 'الشيخ سيد سابق', 'قراءة إثرائية',
         'باب متصل بموضوع: ' || li.title,
         'كتاب فقه شامل ميسَّر يستند للأدلة، يغطي فقه المرأة ضمن نطاقه الشامل — موجود في مكتبة المنصة (/library/book-fiqh-sunnah)',
         'مكتبة المجلس العلمي'
  FROM learning_items li
  JOIN course_units cu ON cu.id = li.unit_id
  JOIN courses c ON c.id = cu.course_id
  WHERE c.slug = 'fiqh-women';
END $$;
