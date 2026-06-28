-- AKE v15 — near real-time (15-min) continuous publishing (idempotent)

-- ── Connector incremental crawl state ─────────────────────────────────────
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS poll_interval_minutes INT NOT NULL DEFAULT 15;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS last_published_item_id TEXT;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS last_etag TEXT;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS last_modified TEXT;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS last_cursor TEXT;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS last_feed_hash TEXT;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS consecutive_failures INT NOT NULL DEFAULT 0;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS auto_disabled_at TIMESTAMPTZ;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS avg_response_ms INT;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS failure_rate_pct NUMERIC(5,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS ake_connectors_poll_idx
  ON ake_connectors (is_active, last_checked_at, poll_interval_minutes);

-- ── Cycle metrics (live dashboard) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_cycle_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES ake_engine_runs(id) ON DELETE SET NULL,
  cycle_type TEXT NOT NULL DEFAULT 'continuous'
    CHECK (cycle_type IN ('continuous', 'recovery', 'queue_drain')),
  discovered INT NOT NULL DEFAULT 0,
  fetched INT NOT NULL DEFAULT 0,
  parsed INT NOT NULL DEFAULT 0,
  published INT NOT NULL DEFAULT 0,
  rejected INT NOT NULL DEFAULT 0,
  recovered INT NOT NULL DEFAULT 0,
  retried INT NOT NULL DEFAULT 0,
  duplicates INT NOT NULL DEFAULT 0,
  queue_size INT NOT NULL DEFAULT 0,
  avg_latency_ms INT,
  connectors_checked INT NOT NULL DEFAULT 0,
  connectors_due INT NOT NULL DEFAULT 0,
  success_rate NUMERIC(5,2),
  duration_ms INT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_cycle_metrics_created_idx ON ake_cycle_metrics (created_at DESC);

-- ── Alerts ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  connector_slug TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_alerts_open_idx ON ake_alerts (resolved, created_at DESC);

-- ── Scheduler heartbeat ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_scheduler_state (
  id TEXT PRIMARY KEY DEFAULT 'global',
  last_cycle_at TIMESTAMPTZ,
  last_cycle_duration_ms INT,
  last_published_at TIMESTAMPTZ,
  last_queue_drain_at TIMESTAMPTZ,
  missed_cycles INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO ake_scheduler_state (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- ── Queue: checkpoint + higher retry cap ────────────────────────────────────
ALTER TABLE ake_job_queue ADD COLUMN IF NOT EXISTS checkpoint JSONB NOT NULL DEFAULT '{}';
ALTER TABLE ake_job_queue ADD COLUMN IF NOT EXISTS knowledge_item_id UUID;

ALTER TABLE ake_engine_runs ADD COLUMN IF NOT EXISTS cycle_type TEXT DEFAULT 'batch';

ALTER TABLE ake_cycle_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_scheduler_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ake_cycle_metrics_admin ON ake_cycle_metrics;
CREATE POLICY ake_cycle_metrics_admin ON ake_cycle_metrics FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_alerts_admin ON ake_alerts;
CREATE POLICY ake_alerts_admin ON ake_alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_scheduler_state_admin ON ake_scheduler_state;
CREATE POLICY ake_scheduler_state_admin ON ake_scheduler_state FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

GRANT SELECT ON ake_cycle_metrics TO authenticated;
GRANT SELECT ON ake_alerts TO authenticated;
GRANT SELECT ON ake_scheduler_state TO authenticated;
GRANT ALL ON ake_cycle_metrics TO service_role;
GRANT ALL ON ake_alerts TO service_role;
GRANT ALL ON ake_scheduler_state TO service_role;

NOTIFY pgrst, 'reload schema';
