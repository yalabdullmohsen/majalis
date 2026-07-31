-- =============================================================================
-- 20260731_extensions_schema_prep.sql
-- REVIEW / OWNER APPLY ONLY
-- يجهّز schema extensions وينقل pg_trgm / vector إن أمكن دون كسر.
-- تحذير: نقل الامتداد قد يتطلب صيانة فهارس GIN/IVFFlat — اختبر على clone أولًا.
-- =============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Attempt relocate (Supabase often already uses extensions schema).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
             WHERE e.extname = 'pg_trgm' AND n.nspname = 'public') THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
    RAISE NOTICE 'moved pg_trgm → extensions';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_trgm move skipped: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
             WHERE e.extname = 'vector' AND n.nspname = 'public') THEN
    ALTER EXTENSION vector SET SCHEMA extensions;
    RAISE NOTICE 'moved vector → extensions';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'vector move skipped: %', SQLERRM;
END $$;

COMMIT;
