-- ═══════════════════════════════════════════════════════════════════════════
-- knowledge_relationships_lesson_book_v1.sql
--
-- استكمال knowledge_relationships بنوع علاقة معرَّف مسبقاً في
-- RelationshipsSection.tsx (REL_TYPES) لكن لم يُستخدَم قط: "درس_عن_كتاب"
-- (درس ← كتاب). كل صف مُستخرَج من مطابقة مباشرة بين عنوان درس حقيقي في
-- جدول lessons الحي (استعلام مباشر عبر supabase db query) وعنوان كتاب
-- حقيقي في library-catalog.ts — لا بحث خارجي، فقط مطابقة عناوين موجودة
-- بالفعل في كلا المصدرين.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM knowledge_relationships WHERE relationship_type = 'درس_عن_كتاب' LIMIT 1) THEN
    RAISE NOTICE 'علاقات درس_عن_كتاب موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO knowledge_relationships (id, source_type, source_id, target_type, target_id, relationship_type, label, is_verified, source_reference)
  VALUES
    (gen_random_uuid(), 'lesson', 'e00f40d1-6e06-4ac2-afde-fe782c1bda04', 'book', 'book-riyadh', 'درس_عن_كتاب', 'رياض الصالحين', true, 'lessons.title + library-catalog.ts — تطابق مباشر'),
    (gen_random_uuid(), 'lesson', 'ecefeb94-e257-42a3-a3ba-815c119eadf8', 'book', 'book-tawhid', 'درس_عن_كتاب', 'كتاب التوحيد', true, 'lessons.title + library-catalog.ts — تطابق مباشر'),
    (gen_random_uuid(), 'lesson', 'a3c2336a-201f-43a6-999d-d00780f6b68b', 'book', 'book-bukhari', 'درس_عن_كتاب', 'صحيح البخاري', true, 'lessons.title + library-catalog.ts — تطابق مباشر'),
    (gen_random_uuid(), 'lesson', '5c770d7e-be7c-4043-a9bd-9937eb5902c8', 'book', 'book-muslim', 'درس_عن_كتاب', 'صحيح مسلم', true, 'lessons.title + library-catalog.ts — تطابق مباشر'),
    (gen_random_uuid(), 'lesson', '8aa2cb01-2555-4708-9ba3-5a9db7f64645', 'book', 'book-muslim', 'درس_عن_كتاب', 'صحيح مسلم', true, 'lessons.title + library-catalog.ts — تطابق مباشر'),
    (gen_random_uuid(), 'lesson', '208ac0ba-431d-405a-a8eb-f4f20f71431a', 'book', 'book-zaad-mustaqni', 'درس_عن_كتاب', 'زاد المستقنع في اختصار المقنع', true, 'lessons.title + library-catalog.ts — تطابق مباشر');

  RAISE NOTICE 'أُدخلت % علاقة درس_عن_كتاب', (SELECT count(*) FROM knowledge_relationships WHERE relationship_type = 'درس_عن_كتاب');
END $$;
