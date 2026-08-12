-- إصلاح جذري: 24 عنقودًا جذريًا في learn_library_v2 (parent_id IS NULL)
-- ظلّت حالتها status='draft' رغم أن 100% من تصنيفاتها الفرعية ودروسها
-- منشورة فعلاً. السبب: كل ملفات SQL السابقة لدفعات ملء المحتوى (batch1
-- لكل عنقود عبر عشرات الدورات) كانت تُحدّث status للتصنيفات الفرعية فقط
-- ولم تتضمن قط تحديث سجل العنقود الجذري نفسه.
-- الأثر: learn-library-service.ts يفلتر التصنيفات الجذرية المعروضة في
-- قائمة مكتبة التعلّم الرئيسية بشرط .eq("status","published") — أي أن
-- هذه العناقيد الـ24 المكتملة 100% كانت غير مرئية إطلاقًا على الموقع.
-- تحقَّق مسبقًا (استعلام SELECT): لكل عنقود من هذه الـ24، count(children)
-- = count(children WHERE status='published') بلا أي استثناء (0 تصنيف
-- فرعي draft ضمن أي منها). هذا تحديث حالة إداري بحت لمحتوى منشور مسبقًا
-- ومُراجَع بالفعل عبر دورات سابقة، وليس توليد محتوى جديد أو اجتهادًا
-- تحريريًا جديدًا — لا يستدعي وسم needs-post-review.
UPDATE categories SET status = 'published'
WHERE parent_id IS NULL
  AND status = 'draft'
  AND slug IN (
    'qawaid-fiqhiyya', 'usul-fiqh', 'tarikh-islami', 'akhlaq-adab',
    'adhkar-adiya', 'lugha-arabiyya', 'dawah', 'tarbiya-imaniyya',
    'usrah-mujtama', 'shabab-nashia', 'muslim-jadid', 'fatawa-muwaththaqa',
    'maqasid-sharia', 'thaqafa-fikr', 'iqtisad-maliyya-islamiyya',
    'tibb-ahkam-shariyya', 'munasabat-islamiyya', 'nawazil-muasira',
    'fiqh-aqalliyat', 'tarikh-tashri', 'qada-dawa-ithbat',
    'wilaya-islamiyya', 'alaqat-dawliyya', 'afkar-muasira'
  );
