-- إصلاح جذري: 4 تصنيفات وسيطة (mid-level clusters تحت fiqh-islami)
-- ظلّت status='draft' رغم أن 100% من تصنيفاتها الفرعية ودروسها منشورة.
-- نفس نمط الخلل الذي أُصلح جذريًا لعناقيد learn_library_v2 (انظر
-- learn_library_v2_root_clusters_status_fix.sql)، لكن على مستوى أعمق:
-- fiqh-islami (جذري) منشور بالفعل، لكن أبناءه المباشرون muamalat/
-- fiqh-usrah/jinayat-qada/fara-mawarith — التي تحتها تصنيفات فرعية
-- منشورة بالكامل — بقيت هي نفسها draft. السبب: learn-library-service.ts
-- سطر 106 يفلتر التصنيفات الفرعية المعروضة تحت أي تصنيف أب بشرط
-- .eq("status","published")، فتختفي هذه العناقيد الأربعة بالكامل من
-- صفحة fiqh-islami رغم اكتمال محتواها 100%.
-- تحقَّق مسبقًا (recursive CTE لكل عنقود): كل تصنيف فرعي منشور بلا
-- استثناء (العدد الوحيد draft هو التصنيف الوسيط نفسه)، و0 دروس/سلاسل
-- غير منشورة مرتبطة مباشرة به. هذا تحديث حالة إداري بحت لمحتوى منشور
-- ومُراجَع مسبقًا عبر دورات سابقة موثَّقة بالكامل في CONTINUATION_PLAN.md
-- (عناقيد muamalat وfiqh-usrah وjinayat-qada وfara-mawarith وُثِّقت كلٌّ
-- منها "مكتمل 100%" في دورات سابقة) — وليس توليد محتوى جديد أو اجتهادًا
-- تحريريًا جديدًا.
UPDATE categories SET status = 'published'
WHERE status = 'draft'
  AND slug IN ('muamalat', 'fiqh-usrah', 'jinayat-qada', 'fara-mawarith');
