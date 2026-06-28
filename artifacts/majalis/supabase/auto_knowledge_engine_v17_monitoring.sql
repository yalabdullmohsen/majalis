-- AKE v17 — Phase 8 monitoring, alerts, cron tracking, daily reports (idempotent)

-- ── Extend ake_alerts ───────────────────────────────────────────────────────
ALTER TABLE ake_alerts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE ake_alerts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
  CHECK (status IN ('open', 'resolved', 'ignored'));
ALTER TABLE ake_alerts ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE ake_alerts ADD COLUMN IF NOT EXISTS run_id UUID;
ALTER TABLE ake_alerts ADD COLUMN IF NOT EXISTS dedupe_key TEXT;
ALTER TABLE ake_alerts ADD COLUMN IF NOT EXISTS resolved_by UUID;

UPDATE ake_alerts SET status = 'resolved' WHERE resolved = true AND status = 'open';
UPDATE ake_alerts SET status = 'open' WHERE resolved = false AND status IS NULL;
UPDATE ake_alerts SET title = COALESCE(title, alert_type) WHERE title IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ake_alerts_dedupe_open_idx
  ON ake_alerts (dedupe_key)
  WHERE status = 'open' AND dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS ake_alerts_status_created_idx ON ake_alerts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS ake_alerts_severity_status_idx ON ake_alerts (severity, status);

-- ── Cron run tracking ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cron_name TEXT NOT NULL,
  schedule TEXT,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'failed', 'missed', 'timeout')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INT,
  last_success_at TIMESTAMPTZ,
  error_message TEXT,
  error_stack TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_cron_runs_name_started_idx ON ake_cron_runs (cron_name, started_at DESC);
CREATE INDEX IF NOT EXISTS ake_cron_runs_status_idx ON ake_cron_runs (status, started_at DESC);

-- ── Pipeline failures ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_pipeline_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID,
  engine_name TEXT NOT NULL DEFAULT 'ake',
  stage TEXT NOT NULL,
  source_id UUID,
  item_id UUID,
  error_code TEXT,
  error_message TEXT NOT NULL,
  retry_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'ignored')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ake_pipeline_failures_status_idx ON ake_pipeline_failures (status, created_at DESC);
CREATE INDEX IF NOT EXISTS ake_pipeline_failures_stage_idx ON ake_pipeline_failures (stage, created_at DESC);
CREATE INDEX IF NOT EXISTS ake_pipeline_failures_run_idx ON ake_pipeline_failures (run_id);

-- ── Source health events ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_source_health_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID,
  connector_slug TEXT,
  connector_type TEXT,
  event_type TEXT NOT NULL,
  health_score NUMERIC(5,2),
  previous_health_score NUMERIC(5,2),
  failure_reason TEXT,
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  recommended_action TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_source_health_events_slug_idx ON ake_source_health_events (connector_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS ake_source_health_events_type_idx ON ake_source_health_events (event_type, created_at DESC);

-- ── Daily operational reports ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated'
    CHECK (status IN ('generated', 'sent', 'failed')),
  summary JSONB NOT NULL DEFAULT '{}',
  metrics JSONB NOT NULL DEFAULT '{}',
  recommended_actions JSONB NOT NULL DEFAULT '[]',
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  UNIQUE (report_date)
);

CREATE INDEX IF NOT EXISTS ake_daily_reports_date_idx ON ake_daily_reports (report_date DESC);

-- ── Notification preferences ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_notification_preferences (
  id TEXT PRIMARY KEY DEFAULT 'global',
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  webhook_enabled BOOLEAN NOT NULL DEFAULT false,
  webhook_url TEXT,
  admin_email TEXT,
  min_severity TEXT NOT NULL DEFAULT 'warning'
    CHECK (min_severity IN ('info', 'warning', 'critical')),
  alert_cooldown_minutes INT NOT NULL DEFAULT 60,
  daily_report_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_report_hour_utc INT NOT NULL DEFAULT 4,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO ake_notification_preferences (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE ake_cron_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_pipeline_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_source_health_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ake_cron_runs_admin ON ake_cron_runs;
CREATE POLICY ake_cron_runs_admin ON ake_cron_runs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_pipeline_failures_admin ON ake_pipeline_failures;
CREATE POLICY ake_pipeline_failures_admin ON ake_pipeline_failures FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_source_health_events_admin ON ake_source_health_events;
CREATE POLICY ake_source_health_events_admin ON ake_source_health_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_daily_reports_admin ON ake_daily_reports;
CREATE POLICY ake_daily_reports_admin ON ake_daily_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_notification_preferences_admin ON ake_notification_preferences;
CREATE POLICY ake_notification_preferences_admin ON ake_notification_preferences FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

GRANT SELECT ON ake_cron_runs TO authenticated;
GRANT SELECT ON ake_pipeline_failures TO authenticated;
GRANT SELECT ON ake_source_health_events TO authenticated;
GRANT SELECT ON ake_daily_reports TO authenticated;
GRANT SELECT ON ake_notification_preferences TO authenticated;

GRANT ALL ON ake_cron_runs TO service_role;
GRANT ALL ON ake_pipeline_failures TO service_role;
GRANT ALL ON ake_source_health_events TO service_role;
GRANT ALL ON ake_daily_reports TO service_role;
GRANT ALL ON ake_notification_preferences TO service_role;

NOTIFY pgrst, 'reload schema';
