-- =============================================================================
-- ROLLBACK for platform_hardening_security_v1.sql
-- Safe: drops deny policies added by v1; does NOT drop columns (data-preserving).
-- Does NOT restore prior function bodies automatically — re-apply owner_bootstrap
-- / prior migration if a full function revert is required.
-- REQUIRES_EXPLICIT_APPROVAL before Production apply.
-- =============================================================================

BEGIN;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'background_jobs',
    'background_job_attempts',
    'background_job_dead_letters',
    'ai_provider_circuit',
    'ai_request_dedup',
    'ai_content_cache',
    'ai_spend_ledger',
    'ai_error_aggregates'
  ]
  LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS deny_all_select ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS deny_all_insert ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS deny_all_update ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS deny_all_delete ON public.%I', t);
    END IF;
  END LOOP;
END $$;

-- Restore broader is_admin EXECUTE only if function exists (prefer re-apply
-- owner_bootstrap_v1.sql for full body). Grants only — body left as last CREATE OR REPLACE.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
  END IF;
END $$;

COMMIT;
