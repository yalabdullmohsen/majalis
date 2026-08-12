-- إصلاح: التصنيفات الفرعية السبعة لمراحل السيرة (التي رُبطت بها الدروس الـ12
-- الجديدة في سلسلة "السيرة النبوية الكاملة") لم تُنشَر عند الزرع الأول، ما جعل
-- تلك الدروس غير قابلة للوصول عبر تصفح صفحة "السيرة النبوية" (رغم ظهورها في
-- صفحة السلسلة نفسها) — اكتُشف عبر تحقق حي بـ Playwright ضد بيانات الإنتاج
-- (العدّاد أظهر 28 درسًا بدل 40). لكل تصنيف هنا محتوى حقيقي مباشر الآن.
UPDATE categories SET status = 'published' WHERE slug IN (
  'mawlid-nashaa', 'arab-qabl-islam', 'bitha-dawa-sirriyya', 'dawa-jahriyya-makka',
  'hijra', 'ahd-madani-ghazawat', 'wafah-nabawiyya'
);
