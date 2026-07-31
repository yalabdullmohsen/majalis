-- =============================================================================
-- 20260731_rls_unpolicied_tables_v1.sql
-- REVIEW / OWNER APPLY ONLY — لا يُنفَّذ من الوكلاء على Production.
-- الهدف: جداول public ذات RLS enabled بلا policies → سياسات آمنة حسب الفئة.
-- قيود: لا DROP TABLE/COLUMN، لا USING (true) للجداول التشغيلية، REVOKE قبل GRANT.
-- =============================================================================

BEGIN;

-- تصنيف بالاسم (قابل للتوسيع). الجداول غير المطابقة تُترك مع تقرير في NOTICE.

DO $$
DECLARE
  r record;
  pol_count int;
  classified text;
BEGIN
  FOR r IN
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
    ORDER BY 1
  LOOP
    SELECT count(*) INTO pol_count
    FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = r.table_name;

    IF pol_count > 0 THEN
      CONTINUE;
    END IF;

    classified := CASE
      WHEN r.table_name ~* '(background_job|dead_letter|ai_provider|open_api|webhook|admin_audit|governance_|ake_|akp_|mke_|platform_bootstrap|import_job)'
        THEN 'ops'
      WHEN r.table_name ~* '(user_|profile|bookmark|favorite|progress|submission|notification|device_token|reading_)'
        THEN 'owner'
      WHEN r.table_name ~* '(lesson|sheikh|prayer|benefit|fawaid|adhkar|qa_|rulings|story|hadith|content_|occasion)'
        THEN 'content'
      ELSE 'unknown'
    END;

    IF classified = 'ops' THEN
      -- لا سياسات anon/authenticated — الوصول عبر service_role فقط
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', r.table_name);
      RAISE NOTICE 'ops lockdown (revoke only): %', r.table_name;

    ELSIF classified = 'owner' THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', r.table_name);
      -- سياسة مالك إن وُجد عمود user_id
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name=r.table_name AND column_name='user_id'
      ) THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
          r.table_name || '_owner_all',
          r.table_name
        );
        RAISE NOTICE 'owner policy: %', r.table_name;
      ELSE
        RAISE NOTICE 'owner-class without user_id (manual): %', r.table_name;
      END IF;

    ELSIF classified = 'content' THEN
      -- قراءة عامة للمحتوى المعتمد إن وُجد status، وإلا SELECT فقط مع تقييد لاحق يدوي
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name=r.table_name AND column_name='status'
      ) THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (status IN (%L, %L, %L))',
          r.table_name || '_public_read_approved',
          r.table_name,
          'approved', 'published', 'active'
        );
        RAISE NOTICE 'content approved-read: %', r.table_name;
      ELSE
        RAISE NOTICE 'content-class without status (manual review): %', r.table_name;
      END IF;

    ELSE
      RAISE NOTICE 'unclassified unpolicied table (skip): %', r.table_name;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- Rollback sketch (owner): drop policies created with suffixes
-- _owner_all / _public_read_approved / _public_read then restore prior grants.
