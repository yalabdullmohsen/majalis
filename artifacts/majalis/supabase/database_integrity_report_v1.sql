-- ═══════════════════════════════════════════════════════════════════════════
-- database_integrity_report_v1.sql
-- تقرير صحّة قاعدة البيانات (للقراءة فقط — لا يغيّر شيئاً). يعتمد على كتالوج
-- القاعدة فيتكيّف مع المخطط الفعلي دون أسماء جداول ثابتة. يغطّي:
--   1) مفاتيح خارجية بلا فهرس مُغطٍّ  → بطء في الـ JOIN/الحذف (تحسين الفهارس).
--   2) جداول بلا مفتاح أساسي.
--   3) تكرار محتمل في أعمدة external_key (مفتاح إزالة التكرار في المشروع).
-- شغّله في Supabase SQL Editor واقرأ الـ NOTICEs.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1) مفاتيح خارجية بلا فهرس مُغطٍّ على الأعمدة المرجعية ──────────────────
DO $$
DECLARE r RECORD; n INTEGER := 0;
BEGIN
  RAISE NOTICE '── مفاتيح خارجية بلا فهرس مُغطٍّ (يُنصح بإضافتها) ──';
  FOR r IN
    SELECT c.conname, t.relname AS tbl, n.nspname AS sch,
           pg_get_constraintdef(c.oid) AS def,
           c.conrelid, c.conkey
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.contype = 'f' AND n.nspname = 'public'
  LOOP
    -- هل يوجد فهرس تبدأ أعمدته بأعمدة المفتاح الخارجي؟
    IF NOT EXISTS (
      SELECT 1 FROM pg_index i
      WHERE i.indrelid = r.conrelid
        AND (i.indkey::int2[])[0:array_length(r.conkey,1)-1] = r.conkey
    ) THEN
      n := n + 1;
      RAISE NOTICE '  %.% : %', r.sch, r.tbl, r.def;
    END IF;
  END LOOP;
  RAISE NOTICE 'المجموع: % مفتاح خارجي بلا فهرس.', n;
END $$;

-- ── 2) جداول بلا مفتاح أساسي ───────────────────────────────────────────────
DO $$
DECLARE r RECORD; n INTEGER := 0;
BEGIN
  RAISE NOTICE '── جداول بلا مفتاح أساسي ──';
  FOR r IN
    SELECT t.relname AS tbl
    FROM pg_class t
    JOIN pg_namespace ns ON ns.oid = t.relnamespace
    WHERE t.relkind = 'r' AND ns.nspname = 'public'
      AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid = t.oid AND c.contype = 'p')
    ORDER BY t.relname
  LOOP
    n := n + 1;
    RAISE NOTICE '  %', r.tbl;
  END LOOP;
  RAISE NOTICE 'المجموع: % جدول بلا مفتاح أساسي.', n;
END $$;

-- ── 3) تكرار محتمل في أعمدة external_key ──────────────────────────────────
DO $$
DECLARE r RECORD; dups INTEGER;
BEGIN
  RAISE NOTICE '── تكرار في external_key (يجب أن يكون فريداً) ──';
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.column_name = 'external_key'
  LOOP
    EXECUTE format(
      'SELECT count(*) FROM (SELECT external_key FROM %I WHERE external_key IS NOT NULL GROUP BY external_key HAVING count(*) > 1) d',
      r.table_name
    ) INTO dups;
    IF dups > 0 THEN
      RAISE NOTICE '  %: % قيمة مكرّرة', r.table_name, dups;
    END IF;
  END LOOP;
  RAISE NOTICE '(اكتمل فحص التكرار)';
END $$;
