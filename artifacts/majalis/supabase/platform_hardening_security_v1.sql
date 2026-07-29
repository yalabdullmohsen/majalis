-- =============================================================================
-- Platform Hardening Security v1 — RLS deny-default + SECURITY DEFINER hygiene
-- APPLY: Supabase SQL Editor / dedicated migration CI ONLY (never API/Cron)
-- PREREQ: enterprise_reliability_p0_v1.sql (background_jobs / ai_provider_circuit)
-- NO DATA DELETION. Idempotent. Does NOT change Auth dashboard settings.
-- ROLLBACK: platform_hardening_security_v1_ROLLBACK.sql
-- REQUIRES_EXPLICIT_APPROVAL before Production apply.
-- =============================================================================

BEGIN;

-- Stub Supabase roles on bare Postgres (local migration tests). No-ops on hosted Supabase.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1) Reliability tables: RLS ON + deny-by-default for anon/authenticated
--    service_role bypasses RLS; never open WITH CHECK/USING true policies.
-- -----------------------------------------------------------------------------
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
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS deny_all_select ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS deny_all_insert ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS deny_all_update ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS deny_all_delete ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY deny_all_select ON public.%I FOR SELECT TO anon, authenticated USING (false)',
        t
      );
      EXECUTE format(
        'CREATE POLICY deny_all_insert ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (false)',
        t
      );
      EXECUTE format(
        'CREATE POLICY deny_all_update ON public.%I FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false)',
        t
      );
      EXECUTE format(
        'CREATE POLICY deny_all_delete ON public.%I FOR DELETE TO anon, authenticated USING (false)',
        t
      );
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', t);
      EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', t);
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 2) Schema drift columns (additive only; guarded — no DROP)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.mke_runs') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'mke_runs' AND column_name = 'created_at'
     ) THEN
    ALTER TABLE public.mke_runs
      ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  IF to_regclass('public.lesson_sources') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'lesson_sources' AND column_name = 'failure_count'
     ) THEN
    ALTER TABLE public.lesson_sources
      ADD COLUMN failure_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3) is_admin — keep profiles + governance_user_roles; harden search_path/grants
--    Admin proof is DB columns/roles only — never JWT custom metadata claims.
--    Skipped on bare test DBs without profiles.
-- -----------------------------------------------------------------------------
DO $harden_admin$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE NOTICE 'platform_hardening: skip is_admin — public.profiles missing';
    RETURN;
  END IF;

  IF to_regclass('public.governance_user_roles') IS NOT NULL THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS boolean
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = pg_catalog, public
      AS $body$
        SELECT
          EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND (
                p.role IN ('admin', 'super_admin')
                OR p.is_admin IS TRUE
                OR p.is_super_admin IS TRUE
                OR p.is_owner IS TRUE
              )
          )
          OR EXISTS (
            SELECT 1
            FROM public.governance_user_roles g
            WHERE g.user_id = auth.uid()
              AND g.role_id IN ('super_admin', 'system_admin', 'content_manager')
          );
      $body$
    $fn$;
  ELSE
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS boolean
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = pg_catalog, public
      AS $body$
        SELECT EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (
              p.role IN ('admin', 'super_admin')
              OR p.is_admin IS TRUE
              OR p.is_super_admin IS TRUE
              OR p.is_owner IS TRUE
            )
        );
      $body$
    $fn$;
  END IF;

  REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
  REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
  GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
END
$harden_admin$;

-- -----------------------------------------------------------------------------
-- 4) Counter RPCs — DEFINER (bypass RLS for counters); fixed path; no user_id
-- -----------------------------------------------------------------------------
DO $harden_counters$
BEGIN
  IF to_regclass('public.fiqh_council_items') IS NOT NULL THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.increment_fiqh_item_views(item_slug TEXT)
      RETURNS VOID
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = pg_catalog, public
      AS $body$
      BEGIN
        IF item_slug IS NULL OR btrim(item_slug) = '' THEN
          RETURN;
        END IF;
        UPDATE public.fiqh_council_items
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE slug = item_slug;
      END;
      $body$
    $fn$;
    REVOKE ALL ON FUNCTION public.increment_fiqh_item_views(TEXT) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.increment_fiqh_item_views(TEXT) TO anon, authenticated;
  ELSE
    RAISE NOTICE 'platform_hardening: skip increment_fiqh_item_views — table missing';
  END IF;

  IF to_regclass('public.lessons') IS NOT NULL THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.record_lesson_view(p_lesson_id UUID)
      RETURNS VOID
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = pg_catalog, public
      AS $body$
      BEGIN
        IF p_lesson_id IS NULL THEN
          RETURN;
        END IF;
        UPDATE public.lessons
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE id = p_lesson_id;
      EXCEPTION
        WHEN undefined_column THEN
          NULL;
        WHEN undefined_table THEN
          NULL;
      END;
      $body$
    $fn$;
    REVOKE ALL ON FUNCTION public.record_lesson_view(UUID) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.record_lesson_view(UUID) TO anon, authenticated;
  ELSE
    RAISE NOTICE 'platform_hardening: skip record_lesson_view — lessons missing';
  END IF;
END
$harden_counters$;

-- -----------------------------------------------------------------------------
-- 5) Family / recommendations — revoke PUBLIC/anon; authenticated + service_role
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'accept_family_invite',
        'revoke_family_link',
        'get_similar_users',
        'profile_privileges_unchanged',
        'upsert_user_interest'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = pg_catalog, public',
      r.nspname, r.proname, r.args
    );
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon',
      r.nspname, r.proname, r.args
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role',
      r.nspname, r.proname, r.args
    );
  END LOOP;
END $$;

COMMIT;
