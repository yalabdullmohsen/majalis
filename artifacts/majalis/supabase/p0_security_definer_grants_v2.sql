-- p0_security_definer_grants_v2.sql
-- Tightens EXECUTE grants / search_path for sensitive RPCs if present.
-- APPLY: Staging first, then Production after explicit approval.
-- NEVER via Admin HTTP / Cron / API runtime.
-- ROLLBACK: p0_security_definer_grants_v2_ROLLBACK.sql
-- REQUIRES_EXPLICIT_APPROVAL
-- Does NOT change Auth dashboard (Leaked Password / MFA / Redirect URLs).

BEGIN;

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

-- Harden listed functions when they exist (no CREATE of business logic here).
DO $$
DECLARE
  fn RECORD;
  sensitive TEXT[] := ARRAY[
    'is_admin',
    'record_lesson_view',
    'increment_fiqh_item_views',
    'accept_family_invite',
    'revoke_family_link',
    'get_similar_users',
    'upsert_user_interest',
    'profile_privileges_unchanged'
  ];
  name TEXT;
BEGIN
  FOREACH name IN ARRAY sensitive
  LOOP
    FOR fn IN
      SELECT p.oid, n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = name
    LOOP
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = pg_catalog, public',
        fn.nspname, fn.proname, fn.args
      );
      EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC', fn.nspname, fn.proname, fn.args);
      EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM anon', fn.nspname, fn.proname, fn.args);

      IF fn.proname IN ('record_lesson_view', 'increment_fiqh_item_views') THEN
        -- Intentional public counters (read telemetry) — anon + authenticated only.
        EXECUTE format(
          'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO anon, authenticated, service_role',
          fn.nspname, fn.proname, fn.args
        );
      ELSIF fn.proname = 'is_admin' THEN
        EXECUTE format(
          'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role',
          fn.nspname, fn.proname, fn.args
        );
      ELSE
        -- Family / interest / similar-users: authenticated + service_role only.
        EXECUTE format(
          'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role',
          fn.nspname, fn.proname, fn.args
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

COMMIT;
