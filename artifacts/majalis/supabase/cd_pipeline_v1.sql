-- CD Pipeline v1 — deployment tracking, pipeline runs, self-heal events (idempotent)

CREATE TABLE IF NOT EXISTS cd_pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_type TEXT NOT NULL DEFAULT 'autonomous-cd',
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'failed', 'blocked', 'cancelled')),
  branch TEXT,
  commit_sha TEXT,
  pr_number INT,
  risk_level TEXT NOT NULL DEFAULT 'low',
  auto_merge BOOLEAN NOT NULL DEFAULT false,
  stages JSONB NOT NULL DEFAULT '[]',
  failure_reason TEXT,
  fix_suggestion TEXT,
  duration_ms INT,
  finished_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cd_pipeline_runs_status_idx ON cd_pipeline_runs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS cd_pipeline_runs_branch_idx ON cd_pipeline_runs (branch, created_at DESC);

CREATE TABLE IF NOT EXISTS cd_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id TEXT,
  commit_sha TEXT,
  branch TEXT NOT NULL DEFAULT 'main',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'building', 'healthy', 'unhealthy', 'rollback', 'failed')),
  health_status TEXT CHECK (health_status IS NULL OR health_status IN ('healthy', 'degraded', 'unhealthy')),
  vercel_url TEXT,
  production_url TEXT,
  build_duration_ms INT,
  verify_duration_ms INT,
  rollback_of UUID REFERENCES cd_deployments(id) ON DELETE SET NULL,
  failure_checks JSONB NOT NULL DEFAULT '[]',
  self_heal_actions JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cd_deployments_status_idx ON cd_deployments (status, created_at DESC);
CREATE INDEX IF NOT EXISTS cd_deployments_commit_idx ON cd_deployments (commit_sha);

CREATE TABLE IF NOT EXISTS cd_self_heal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component TEXT NOT NULL DEFAULT 'cd',
  issue_type TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  attempt INT NOT NULL DEFAULT 1,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cd_self_heal_events_type_idx ON cd_self_heal_events (issue_type, created_at DESC);

ALTER TABLE cd_pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cd_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cd_self_heal_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cd_pipeline_runs_admin ON cd_pipeline_runs;
CREATE POLICY cd_pipeline_runs_admin ON cd_pipeline_runs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS cd_deployments_admin ON cd_deployments;
CREATE POLICY cd_deployments_admin ON cd_deployments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS cd_self_heal_events_admin ON cd_self_heal_events;
CREATE POLICY cd_self_heal_events_admin ON cd_self_heal_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

GRANT SELECT ON cd_pipeline_runs TO authenticated;
GRANT SELECT ON cd_deployments TO authenticated;
GRANT SELECT ON cd_self_heal_events TO authenticated;
GRANT ALL ON cd_pipeline_runs TO service_role;
GRANT ALL ON cd_deployments TO service_role;
GRANT ALL ON cd_self_heal_events TO service_role;

NOTIFY pgrst, 'reload schema';
