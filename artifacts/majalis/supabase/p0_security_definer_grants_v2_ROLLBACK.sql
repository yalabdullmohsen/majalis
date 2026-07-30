-- Rollback: p0_security_definer_grants_v2
-- Restores broad EXECUTE to PUBLIC for the listed functions (pre-hardening posture).
-- Prefer re-applying platform_hardening_security_v1.sql instead of this rollback in Production.

BEGIN;

DO $$
DECLARE
  fn RECORD;
  name TEXT;
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
        'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO PUBLIC',
        fn.nspname, fn.proname, fn.args
      );
    END LOOP;
  END LOOP;
END $$;

COMMIT;
