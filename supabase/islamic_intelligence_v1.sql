-- Islamic Intelligence Platform v1
-- Agent runs, audit findings, content plans, discoveries, weekly reports

-- ── Intelligence agent runs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intelligence_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  items_checked int DEFAULT 0,
  issues_found int DEFAULT 0,
  fixes_suggested int DEFAULT 0,
  report jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_intelligence_runs_agent ON intelligence_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_runs_started ON intelligence_runs(started_at DESC);

-- ── Audit findings ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intelligence_audit_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES intelligence_runs(id) ON DELETE CASCADE,
  agent_id text NOT NULL DEFAULT 'knowledge_auditor',
  issue_type text NOT NULL,
  severity text DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  ref_id text,
  description text,
  suggested_fix text,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_findings_run ON intelligence_audit_findings(run_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_type ON intelligence_audit_findings(issue_type);
CREATE INDEX IF NOT EXISTS idx_audit_findings_ref ON intelligence_audit_findings(ref_id);

-- ── Content plans ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intelligence_content_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL UNIQUE,
  period_end date,
  plan jsonb NOT NULL DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at timestamptz DEFAULT now()
);

-- ── Discovery queue ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intelligence_discovery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES intelligence_runs(id) ON DELETE SET NULL,
  item_type text NOT NULL,
  title text,
  source_slug text,
  ref_id text,
  status text DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'published')),
  trust_level int DEFAULT 50,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_discovery_status ON intelligence_discovery_items(status);
CREATE INDEX IF NOT EXISTS idx_discovery_ref ON intelligence_discovery_items(ref_id);

-- ── Weekly reports ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intelligence_weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL UNIQUE,
  period_end date,
  report jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ── Agent metrics snapshot ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intelligence_agent_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  items_processed int DEFAULT 0,
  issues_found int DEFAULT 0,
  avg_score float,
  duration_ms int,
  metadata jsonb DEFAULT '{}',
  UNIQUE(agent_id, metric_date)
);

-- ── RPC: intelligence platform stats ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION intelligence_platform_stats(days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'runs_total', (SELECT count(*) FROM intelligence_runs WHERE started_at >= now() - (days || ' days')::interval),
    'runs_completed', (SELECT count(*) FROM intelligence_runs WHERE status = 'completed' AND started_at >= now() - (days || ' days')::interval),
    'findings_total', (SELECT count(*) FROM intelligence_audit_findings WHERE created_at >= now() - (days || ' days')::interval),
    'findings_unresolved', (SELECT count(*) FROM intelligence_audit_findings WHERE resolved = false),
    'discoveries_pending', (SELECT count(*) FROM intelligence_discovery_items WHERE status = 'pending_review'),
    'plans_active', (SELECT count(*) FROM intelligence_content_plans WHERE status = 'active'),
    'weekly_reports', (SELECT count(*) FROM intelligence_weekly_reports WHERE period_start >= (CURRENT_DATE - days))
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION intelligence_platform_stats(int) TO authenticated, anon;

-- RLS
ALTER TABLE intelligence_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_discovery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_agent_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access intelligence_runs" ON intelligence_runs FOR ALL USING (true);
CREATE POLICY "Service role full access intelligence_audit_findings" ON intelligence_audit_findings FOR ALL USING (true);
CREATE POLICY "Service role full access intelligence_content_plans" ON intelligence_content_plans FOR ALL USING (true);
CREATE POLICY "Service role full access intelligence_discovery_items" ON intelligence_discovery_items FOR ALL USING (true);
CREATE POLICY "Service role full access intelligence_weekly_reports" ON intelligence_weekly_reports FOR ALL USING (true);
CREATE POLICY "Service role full access intelligence_agent_metrics" ON intelligence_agent_metrics FOR ALL USING (true);
