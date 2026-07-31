-- =============================================================================
-- 20260731_security_definer_grants_v3.sql
-- REVIEW / OWNER APPLY ONLY
-- يقلّص EXECUTE على SECURITY DEFINER في public أمام anon/authenticated
-- إلا للدوال المسموح بها صراحةً (قائمة allow).
-- =============================================================================

BEGIN;

-- Ensure private schema for future moves (no function bodies rewritten here).
CREATE SCHEMA IF NOT EXISTS private;

DO $$
DECLARE
  r record;
  allow_names text[] := ARRAY[
    'is_admin'
  ];
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    IF r.proname = ANY (allow_names) THEN
      RAISE NOTICE 'keep EXECUTE (allowlist): %(%)', r.proname, r.args;
      CONTINUE;
    END IF;

    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated',
      r.proname, r.args);
    -- Pin search_path where missing
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp',
        r.proname, r.args);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'search_path pin skipped for %: %', r.proname, SQLERRM;
    END;
    RAISE NOTICE 'revoked EXECUTE from anon/authenticated: %(%)', r.proname, r.args;
  END LOOP;
END $$;

COMMIT;
