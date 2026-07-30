-- Rollback: platform_bootstrap_runs_v1
-- Drops bootstrap run history table only (no content tables).

DROP POLICY IF EXISTS deny_all_select ON platform_bootstrap_runs;
DROP POLICY IF EXISTS deny_all_insert ON platform_bootstrap_runs;
DROP POLICY IF EXISTS deny_all_update ON platform_bootstrap_runs;
DROP POLICY IF EXISTS deny_all_delete ON platform_bootstrap_runs;
DROP INDEX IF EXISTS idx_platform_bootstrap_runs_started;
DROP TABLE IF EXISTS platform_bootstrap_runs;
