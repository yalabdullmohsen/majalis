-- ═══════════════════════════════════════════════════════════════════════════
-- knowledge_relationships_fawaid_book_v1.sql
--
-- استكمال knowledge_relationships بربط فوائد↔كتب — أول استخدام لهذا
-- المزيج من source_type/target_type (fawaid/book)، غير مُستكشَف سابقاً.
-- كل زوج مُستخرَج من مطابقة برمجية مباشرة بين حقل `source` لكل فائدة في
-- fawaid-seed.ts وعنوان كتاب حقيقي في library-catalog.ts — لا بحث خارجي.
--
-- استُبعدت عمداً مطابقات الكتب الستة (البخاري/مسلم/الترمذي/أبي داود/
-- النسائي/ابن ماجه) رغم كثرتها (~60 مطابقة إضافية) لأنها مجرد مصادر
-- تخريج الحديث الخام لا مواد ذات صلة موضوعية غنية — ربط كل فائدة حديثية
-- بكامل «صحيح البخاري» يُغرق الرسم المعرفي بروابط منخفضة القيمة تكرّر
-- ما يظهر أصلاً في حقل `source` نفسه دون فائدة تصفّح إضافية حقيقية.
-- أُبقيت فقط الكتب الموضوعية الجوهرية (تفسير/عقيدة/فقه/سيرة/لغة/تاريخ)
-- التي يمثّل الرابط فيها قيمة تصفّح حقيقية (الانتقال من فائدة عن تفسير
-- ابن كثير إلى كتاب التفسير كاملاً، مثلاً).
--
-- نوع العلاقة "مرتبط" (لا "درس_عن_كتاب") لأن الفائدة ليست درساً، وهذا
-- الاختيار الصادق الوحيد من الأنواع الستة المعرَّفة في RelationshipsSection.tsx.
--
-- مرافق لإصلاح كود: TYPE_HREF.fawaid في KnowledgeRelatedItems.tsx كان
-- يتجاهل `id` ويعيد `/fawaid` العامة دوماً (نفس عائلة عطل fatwa/scholar
-- المُصلَحة سابقاً) — صُحِّح إلى `/fawaid#${id}` (FaidahCard.tsx يضع
-- `id={item.id}` على كل بطاقة فعلياً، فالـhash يعمل عبر تمرير المتصفح
-- الطبيعي بلا حاجة لمنطق JS إضافي).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM knowledge_relationships
    WHERE source_type = 'fawaid' AND target_type = 'book'
    LIMIT 1
  ) THEN
    RAISE NOTICE 'علاقات fawaid-book موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO knowledge_relationships (id, source_type, source_id, target_type, target_id, relationship_type, label, is_verified, source_reference)
  VALUES
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-49', 'book', 'book-wasitiyyah', 'مرتبط', 'العقيدة الواسطية', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-166', 'book', 'book-tahawiyyah', 'مرتبط', 'العقيدة الطحاوية', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-314', 'book', 'book-tafsir-ibnkathir', 'مرتبط', 'تفسير ابن كثير', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-315', 'book', 'book-tafsir-ibnkathir', 'مرتبط', 'تفسير ابن كثير', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-322', 'book', 'book-ihya', 'مرتبط', 'إحياء علوم الدين', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-327', 'book', 'book-riyadh', 'مرتبط', 'رياض الصالحين', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-366', 'book', 'book-miftah-dar-al-saadah', 'مرتبط', 'مفتاح دار السعادة', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-384', 'book', 'book-riyadh', 'مرتبط', 'رياض الصالحين', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-389', 'book', 'book-zad', 'مرتبط', 'زاد المعاد', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-401', 'book', 'book-mughni', 'مرتبط', 'المغني', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-403', 'book', 'book-dara-at-taarus', 'مرتبط', 'درء تعارض العقل والنقل', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-409', 'book', 'book-siyar-alam-nubala', 'مرتبط', 'سير أعلام النبلاء', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-411', 'book', 'book-seerah-ibn-hisham', 'مرتبط', 'السيرة النبوية', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-414', 'book', 'book-tibyan', 'مرتبط', 'التبيان في آداب حملة القرآن', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-418', 'book', 'book-burhan', 'مرتبط', 'البرهان في علوم القرآن', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-422', 'book', 'book-dalaail-ijaz', 'مرتبط', 'دلائل الإعجاز', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-426', 'book', 'book-burhan', 'مرتبط', 'البرهان في علوم القرآن', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-427', 'book', 'book-bidayat-mujtahid', 'مرتبط', 'بداية المجتهد ونهاية المقتصد', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-428', 'book', 'book-miftah-dar-al-saadah', 'مرتبط', 'مفتاح دار السعادة', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-436', 'book', 'book-mughni', 'مرتبط', 'المغني', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-437', 'book', 'book-itqan', 'مرتبط', 'الإتقان في علوم القرآن', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-438', 'book', 'book-muqaddima-ibn-khaldun', 'مرتبط', 'مقدمة ابن خلدون', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-444', 'book', 'book-lisan-al-arab', 'مرتبط', 'لسان العرب', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-449', 'book', 'book-kamil-ibn-athir', 'مرتبط', 'الكامل في التاريخ', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-451', 'book', 'book-dara-at-taarus', 'مرتبط', 'درء تعارض العقل والنقل', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-453', 'book', 'book-burhan', 'مرتبط', 'البرهان في علوم القرآن', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-462', 'book', 'book-dalaail-ijaz', 'مرتبط', 'دلائل الإعجاز', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-465', 'book', 'book-muqaddimah-ibn-salah', 'مرتبط', 'مقدمة ابن الصلاح في علوم الحديث', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-466', 'book', 'book-tibyan', 'مرتبط', 'التبيان في آداب حملة القرآن', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-471', 'book', 'book-al-muwafaqat-shatibi', 'مرتبط', 'الموافقات في أصول الشريعة', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-472', 'book', 'book-tafsir-ibnkathir', 'مرتبط', 'تفسير ابن كثير', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-473', 'book', 'book-riyadh', 'مرتبط', 'رياض الصالحين', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-477', 'book', 'book-lisan-al-arab', 'مرتبط', 'لسان العرب', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-478', 'book', 'book-zad', 'مرتبط', 'زاد المعاد', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-481', 'book', 'book-kamil-ibn-athir', 'مرتبط', 'الكامل في التاريخ', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-482', 'book', 'book-ihya', 'مرتبط', 'إحياء علوم الدين', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-482', 'book', 'book-risalah-qushayri', 'مرتبط', 'الرسالة القشيرية', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-485', 'book', 'book-ihya', 'مرتبط', 'إحياء علوم الدين', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-490', 'book', 'book-tafsir-ibnkathir', 'مرتبط', 'تفسير ابن كثير', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-493', 'book', 'book-seerah-ibn-hisham', 'مرتبط', 'السيرة النبوية', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-496', 'book', 'book-seerah-ibn-hisham', 'مرتبط', 'السيرة النبوية', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-497', 'book', 'book-tarikh-tabari', 'مرتبط', 'تاريخ الطبري', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-498', 'book', 'book-seerah-ibn-hisham', 'مرتبط', 'السيرة النبوية', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-500', 'book', 'book-kamil-ibn-athir', 'مرتبط', 'الكامل في التاريخ', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-505', 'book', 'book-burhan', 'مرتبط', 'البرهان في علوم القرآن', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-505', 'book', 'book-tahrir-wa-tanwir', 'مرتبط', 'التحرير والتنوير', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-507', 'book', 'book-ihya', 'مرتبط', 'إحياء علوم الدين', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-508', 'book', 'book-riyadh', 'مرتبط', 'رياض الصالحين', true, 'fawaid-seed.ts source field — تطابق مباشر'),
    (gen_random_uuid(), 'fawaid', 'seed-fawaid-510', 'book', 'book-zad', 'مرتبط', 'زاد المعاد', true, 'fawaid-seed.ts source field — تطابق مباشر');

  RAISE NOTICE 'أُدخلت % علاقة fawaid-book', (SELECT count(*) FROM knowledge_relationships WHERE source_type = 'fawaid' AND target_type = 'book');
END $$;
