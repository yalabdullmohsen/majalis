-- إصلاح بق حقيقي حرج: 7 صفوف في verified_hadith_items تحوي النص
-- الحرفي "[object Object]" بدل نص حديث فعلي (خلل استيراد برمجي كلاسيكي:
-- تسلسل كائن JS بدل استخراج حقل النص منه). اكتُشِف عبر فحص تكرار نص
-- شامل (SELECT text, count(*) ... GROUP BY text HAVING count(*)>1) أثناء
-- بحث عن "عائلة بق" جديدة بطلب المنسِّق.
--
-- الأثر الحي المؤكَّد: كل الصفوف السبعة verification_status='verified'،
-- وflashcard-service.ts (getDueFlashCards → hadithToCard) يستعلم بـ
-- .eq("verification_status","verified") ويعرض h.text مباشرة كـ"front"
-- البطاقة — أي أن مستخدمي ميزة "بطاقات المراجعة المتباعدة" لحفظ الحديث
-- كانوا (أو سيكونون) معرَّضين لرؤية بطاقة حرفية "[object Object]" بدل
-- حديث حقيقي، مصنَّفة "صحيح" رغم كونها فارغة تمامًا من المحتوى.
--
-- نطاق الخلل: تحقَّق أن الخلل محصور في دفعة استيراد واحدة فاشلة بالكامل:
-- كل الصفوف السبعة معرّفها يبدأ بـ"hadith-akp-"، أُنشئت 2026-07-01 إلى
-- 07-03، واحد لكل من الكتب الستة + موطأ مالك (bukhari/muslim/abudawud/
-- tirmidhi/nasai/ibnmajah/malik) — صفر صف "akp" آخر سليم، أي الدفعة
-- فشلت 7/7 بالكامل، لا صفوف جزئية سليمة تحتاج تمييزاً.
--
-- القرار: **لا تأليف نص حديث بديل** — لا توجد وسيلة لمعرفة الحديث
-- الأصلي المقصود من دفعة الاستيراد الفاشلة دون الرجوع لمصدرها الأصلي
-- غير المتاح. الإصلاح الآمن الوحيد: تعليم الصفوف كـ'rejected' (قيمة
-- صالحة ضمن CHECK constraint الموجود: verified/needs_review/rejected/
-- duplicate/archived) + soft-delete عبر deleted_at، فتُستبعَد فورًا من
-- استعلام flashcard-service.ts (الذي يُصفّي على verification_status
-- تحديدًا) بصرف النظر عن أي فلترة deleted_at في طبقات أخرى.
UPDATE verified_hadith_items
SET verification_status = 'rejected',
    deleted_at = now(),
    updated_at = now()
WHERE id LIKE 'hadith-akp-%' AND text = '[object Object]';
