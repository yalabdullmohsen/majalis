-- Enterprise Governance & Editorial Platform v1
-- RBAC, lifecycle, reviews, audit trail, backup, security

-- ── User roles ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS governance_user_roles (
  user_id uuid PRIMARY KEY,
  role_id text NOT NULL DEFAULT 'read_only',
  assigned_by uuid,
  assigned_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_governance_roles_role ON governance_user_roles(role_id);

-- ── Unified audit trail ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS governance_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor_id text NOT NULL DEFAULT 'system',
  actor_role text,
  resource_type text,
  resource_id text,
  ref_id text,
  ip_address text,
  user_agent text,
  reason text,
  outcome text DEFAULT 'success',
  metadata jsonb DEFAULT '{}',
  source text DEFAULT 'governance',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gov_audit_action ON governance_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_gov_audit_actor ON governance_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_gov_audit_resource ON governance_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_gov_audit_created ON governance_audit_log(created_at DESC);

-- ── Content lifecycle ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS governance_content_lifecycle (
  content_kind text NOT NULL,
  content_id text NOT NULL,
  current_stage text NOT NULL DEFAULT 'draft',
  status text DEFAULT 'active',
  assigned_to uuid,
  updated_by text,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (content_kind, content_id)
);

CREATE TABLE IF NOT EXISTS governance_lifecycle_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_kind text NOT NULL,
  content_id text NOT NULL,
  from_stage text,
  to_stage text NOT NULL,
  actor_id text,
  actor_role text,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_history_content ON governance_lifecycle_history(content_kind, content_id);

-- ── Scientific / editorial reviews ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS governance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_kind text NOT NULL,
  content_id text NOT NULL,
  review_type text NOT NULL DEFAULT 'scientific',
  status text DEFAULT 'needs_review',
  checks jsonb DEFAULT '[]',
  can_publish boolean DEFAULT false,
  reviewer_id text,
  reviewer_role text,
  review_notes text,
  finished_at timestamptz,
  reviewed_at timestamptz,
  UNIQUE(content_kind, content_id, review_type)
);

CREATE INDEX IF NOT EXISTS idx_gov_reviews_status ON governance_reviews(status);

-- ── Backup runs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS governance_backup_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text DEFAULT 'running',
  checks jsonb DEFAULT '[]',
  snapshots jsonb DEFAULT '[]',
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz
);

-- ── Security audits ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS governance_security_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  score int DEFAULT 0,
  critical_count int DEFAULT 0,
  warning_count int DEFAULT 0,
  report jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ── RPC: governance platform stats ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION governance_platform_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'audit_events_30d', (SELECT count(*) FROM governance_audit_log WHERE created_at >= now() - interval '30 days'),
    'reviews_pending', (SELECT count(*) FROM governance_reviews WHERE status = 'needs_review'),
    'reviews_approved', (SELECT count(*) FROM governance_reviews WHERE status = 'approved'),
    'users_with_roles', (SELECT count(*) FROM governance_user_roles),
    'lifecycle_active', (SELECT count(*) FROM governance_content_lifecycle WHERE status = 'active'),
    'last_backup', (SELECT max(started_at) FROM governance_backup_runs),
    'last_security_audit', (SELECT max(created_at) FROM governance_security_audits),
    'last_backup_check', (SELECT max(finished_at) FROM governance_backup_runs WHERE status = 'completed')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION governance_platform_stats() TO authenticated, anon;

-- RLS
ALTER TABLE governance_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_content_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_lifecycle_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_backup_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_security_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role governance_user_roles" ON governance_user_roles FOR ALL USING (true);
CREATE POLICY "Service role governance_audit_log" ON governance_audit_log FOR ALL USING (true);
CREATE POLICY "Service role governance_content_lifecycle" ON governance_content_lifecycle FOR ALL USING (true);
CREATE POLICY "Service role governance_lifecycle_history" ON governance_lifecycle_history FOR ALL USING (true);
CREATE POLICY "Service role governance_reviews" ON governance_reviews FOR ALL USING (true);
CREATE POLICY "Service role governance_backup_runs" ON governance_backup_runs FOR ALL USING (true);
CREATE POLICY "Service role governance_security_audits" ON governance_security_audits FOR ALL USING (true);
