-- ═══════════════════════════════════════════════════════════════════════════
-- knowledge_relationships_book_book_v1.sql
--
-- استكمال لتعبئة knowledge_relationships (كانت فارغة كلياً قبل هذه الجلسة،
-- عُبِّئت أولاً بـ70 علاقة عالِم↔عالِم/عالِم↔كتاب في
-- knowledge_relationships_populate_v1.sql). هذا الملف يضيف أول دفعة
-- علاقات "شرح_لكتاب" (كتاب↔كتاب) — نوع علاقة معرَّف مسبقاً في
-- RelationshipsSection.tsx (REL_TYPES) لكن لم يُستخدَم قط حتى الآن.
--
-- كل زوج (شرح ← متن) مُستخرَج مباشرة من عنوان الكتاب نفسه في
-- library-catalog.ts (نمط "X شرح Y" واضح دلالياً، لا يحتاج بحثاً خارجياً)،
-- مع التحقق برمجياً أن كلا الكتابين (الشرح والمتن) موجودان فعلاً بمعرِّف
-- صريح في الفهرس قبل الإدراج — 5 أزواج مؤكَّدة من أصل 10 عناوين "شرح"
-- في الفهرس (البقية: متونها ["المهذب"، "زاد المستقنع"، "تقريب النواوي"،
-- "بداية المبتدي"، "الدرة المضية"] غير مُفهرَسة كسجل مستقل، فلا معرِّف
-- هدف صالح لها حالياً).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM knowledge_relationships WHERE relationship_type = 'شرح_لكتاب' LIMIT 1) THEN
    RAISE NOTICE 'علاقات شرح_لكتاب موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO knowledge_relationships (id, source_type, source_id, target_type, target_id, relationship_type, label, is_verified, source_reference)
  VALUES
    (gen_random_uuid(), 'book', 'book-fath-majeed', 'book', 'book-tawhid', 'شرح_لكتاب', 'كتاب التوحيد', true, 'library-catalog.ts — عنوان الكتاب صريح'),
    (gen_random_uuid(), 'book', 'book-sharh-arbaeen-ibn-daqiq', 'book', 'book-nawawi40', 'شرح_لكتاب', 'الأربعون النووية', true, 'library-catalog.ts — عنوان الكتاب صريح'),
    (gen_random_uuid(), 'book', 'book-fath-al-bari', 'book', 'book-bukhari', 'شرح_لكتاب', 'صحيح البخاري', true, 'library-catalog.ts — عنوان الكتاب صريح'),
    (gen_random_uuid(), 'book', 'book-minhaj-nawawi-sharh-muslim', 'book', 'book-muslim', 'شرح_لكتاب', 'صحيح مسلم', true, 'library-catalog.ts — عنوان الكتاب صريح'),
    (gen_random_uuid(), 'book', 'book-tahawiyya-sharh', 'book', 'book-tahawiyyah', 'شرح_لكتاب', 'العقيدة الطحاوية', true, 'library-catalog.ts — عنوان الكتاب صريح');

  RAISE NOTICE 'أُدخلت % علاقة شرح_لكتاب', (SELECT count(*) FROM knowledge_relationships WHERE relationship_type = 'شرح_لكتاب');
END $$;
