-- platform_bootstrap_runs_v1.sql
-- Apply via SQL Editor / CLI only. Never via Admin HTTP / Cron / Runtime.
-- REQUIRES_EXPLICIT_APPROVAL before Production apply.
-- Rollback: platform_bootstrap_runs_v1_ROLLBACK.sql

CREATE TABLE IF NOT EXISTS platform_bootstrap_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  current_step TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  error TEXT,
  owner_actions JSONB,
  production_ready BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_platform_bootstrap_runs_started
  ON platform_bootstrap_runs (started_at DESC);

ALTER TABLE platform_bootstrap_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_bootstrap_runs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deny_all_select ON platform_bootstrap_runs;
DROP POLICY IF EXISTS deny_all_insert ON platform_bootstrap_runs;
DROP POLICY IF EXISTS deny_all_update ON platform_bootstrap_runs;
DROP POLICY IF EXISTS deny_all_delete ON platform_bootstrap_runs;

CREATE POLICY deny_all_select ON platform_bootstrap_runs
  FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY deny_all_insert ON platform_bootstrap_runs
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY deny_all_update ON platform_bootstrap_runs
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_all_delete ON platform_bootstrap_runs
  FOR DELETE TO anon, authenticated USING (false);

REVOKE ALL ON TABLE platform_bootstrap_runs FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE platform_bootstrap_runs TO service_role;
