-- AKE v18 — Fully autonomous Islamic content platform (idempotent)

-- ── Structured rejection audit ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_rejection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID,
  source_id UUID,
  connector_slug TEXT,
  external_id TEXT,
  content_kind TEXT,
  pipeline_stage TEXT NOT NULL,
  rejection_reason TEXT NOT NULL,
  confidence_score NUMERIC(5,2),
  error_code TEXT,
  source_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_rejection_log_stage_idx ON ake_rejection_log (pipeline_stage, created_at DESC);
CREATE INDEX IF NOT EXISTS ake_rejection_log_reason_idx ON ake_rejection_log (rejection_reason, created_at DESC);
CREATE INDEX IF NOT EXISTS ake_rejection_log_connector_idx ON ake_rejection_log (connector_slug, created_at DESC);

-- ── Pipeline stage observability ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_pipeline_stage_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID,
  item_external_id TEXT,
  stage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('running', 'completed', 'failed', 'skipped')),
  duration_ms INT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_pipeline_stage_runs_run_idx ON ake_pipeline_stage_runs (run_id, stage);

-- ── Periodic reports (hourly / daily / weekly / monthly) ────────────────────
CREATE TABLE IF NOT EXISTS ake_periodic_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL CHECK (report_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  period_key TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  summary JSONB NOT NULL DEFAULT '{}',
  recommended_actions JSONB NOT NULL DEFAULT '[]',
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (report_type, period_key)
);

CREATE INDEX IF NOT EXISTS ake_periodic_reports_type_idx ON ake_periodic_reports (report_type, period_key DESC);

-- ── Islamic events (courses, lectures, conferences, competitions) ────────────
CREATE TABLE IF NOT EXISTS islamic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'lecture'
    CHECK (event_type IN ('course', 'lecture', 'conference', 'competition', 'workshop', 'seminar')),
  location TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  source_url TEXT,
  source_name TEXT,
  organizer TEXT,
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('draft', 'pending', 'approved', 'cancelled', 'archived')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS islamic_events_starts_idx ON islamic_events (starts_at DESC);
CREATE INDEX IF NOT EXISTS islamic_events_type_idx ON islamic_events (event_type, status);

-- ── Activate official fatwa/news connectors with validated feeds ──────────────
UPDATE ake_connectors SET is_active = true, poll_interval_minutes = 15
WHERE slug IN ('islamqa', 'ibn-baz', 'islamweb-news')
  AND feed_url IS NOT NULL
  AND trust_level >= 4;

-- ── Register additional connector types in config metadata ───────────────────
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS sitemap_url TEXT;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS podcast_feed_url TEXT;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE ake_rejection_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_pipeline_stage_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_periodic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE islamic_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ake_rejection_log_admin ON ake_rejection_log;
CREATE POLICY ake_rejection_log_admin ON ake_rejection_log FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_pipeline_stage_runs_admin ON ake_pipeline_stage_runs;
CREATE POLICY ake_pipeline_stage_runs_admin ON ake_pipeline_stage_runs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_periodic_reports_admin ON ake_periodic_reports;
CREATE POLICY ake_periodic_reports_admin ON ake_periodic_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS islamic_events_public_read ON islamic_events;
CREATE POLICY islamic_events_public_read ON islamic_events FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS islamic_events_admin ON islamic_events;
CREATE POLICY islamic_events_admin ON islamic_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

GRANT SELECT ON ake_rejection_log TO authenticated;
GRANT SELECT ON ake_pipeline_stage_runs TO authenticated;
GRANT SELECT ON ake_periodic_reports TO authenticated;
GRANT SELECT ON islamic_events TO authenticated, anon;

GRANT ALL ON ake_rejection_log TO service_role;
GRANT ALL ON ake_pipeline_stage_runs TO service_role;
GRANT ALL ON ake_periodic_reports TO service_role;
GRANT ALL ON islamic_events TO service_role;

NOTIFY pgrst, 'reload schema';
