-- ═══════════════════════════════════════════════════════════════════════════
-- knowledge_graph_integrity_v1.sql
-- تقرير سلامة علاقات knowledge_relationships (للقراءة فقط — لا يحذف شيئاً):
--   • علاقات مكسورة: source_id/target_id لا يشير إلى سجل موجود في جدول نوعه.
--   • علاقات ذاتية (self-loop): الطرفان نفس النوع ونفس المعرّف.
-- خريطة النوع→الجدول مؤكَّدة من مخطط قاعدة البيانات.
-- الفهارس (idx_kr_source/target/verified/rel_type) موجودة مسبقاً — كفاءة جيدة.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  m         RECORD;
  cnt_src   INTEGER;
  cnt_tgt   INTEGER;
  cnt_self  INTEGER;
  total     INTEGER;
  broken    INTEGER := 0;
BEGIN
  SELECT count(*) INTO total FROM knowledge_relationships;
  RAISE NOTICE 'إجمالي العلاقات: %', total;

  SELECT count(*) INTO cnt_self
  FROM knowledge_relationships
  WHERE source_type = target_type AND source_id = target_id;
  RAISE NOTICE 'علاقات ذاتية (self-loop): %', cnt_self;

  RAISE NOTICE 'العلاقات المكسورة حسب النوع (طرف مصدر / طرف هدف):';
  FOR m IN
    SELECT * FROM (VALUES
      ('scholar',  'sheikhs'),
      ('lesson',   'lessons'),
      ('book',     'library_items'),
      ('fatwa',    'fatwas'),
      ('fawaid',   'fawaid'),
      ('question', 'qa_questions')
    ) AS v(node_type, tbl)
  LOOP
    EXECUTE format(
      'SELECT count(*) FROM knowledge_relationships kr WHERE kr.source_type = %L
         AND NOT EXISTS (SELECT 1 FROM %I e WHERE e.id::text = kr.source_id)',
      m.node_type, m.tbl
    ) INTO cnt_src;

    EXECUTE format(
      'SELECT count(*) FROM knowledge_relationships kr WHERE kr.target_type = %L
         AND NOT EXISTS (SELECT 1 FROM %I e WHERE e.id::text = kr.target_id)',
      m.node_type, m.tbl
    ) INTO cnt_tgt;

    broken := broken + cnt_src + cnt_tgt;
    IF cnt_src > 0 OR cnt_tgt > 0 THEN
      RAISE NOTICE '  % : مصدر=% هدف=%', m.node_type, cnt_src, cnt_tgt;
    END IF;
  END LOOP;

  RAISE NOTICE '───────────────';
  RAISE NOTICE 'إجمالي الأطراف المكسورة: % | ذاتية: %', broken, cnt_self;
  IF broken = 0 AND cnt_self = 0 THEN
    RAISE NOTICE '✅ لا توجد علاقات مكسورة.';
  ELSE
    RAISE NOTICE '⚠️ راجِع القائمة أدناه ثم احذف المكسور يدوياً بعد التأكد.';
  END IF;
END $$;

-- قائمة مفصّلة بالعلاقات الذاتية (لمراجعتها/حذفها يدوياً بعد التأكد):
SELECT id, source_type, source_id, relationship_type
FROM knowledge_relationships
WHERE source_type = target_type AND source_id = target_id;

-- ملاحظة: لحذف علاقة مكسورة بعد التأكد يدوياً استخدم (مثال):
--   DELETE FROM knowledge_relationships WHERE id = '<id>';
-- لا نحذف تلقائياً حفاظاً على البيانات.
