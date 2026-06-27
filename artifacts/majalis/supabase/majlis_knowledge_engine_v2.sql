-- =====================================================================
--  Majlis Knowledge Engine v2 — Autonomous Platform 2.0 extensions
--  نفّذ بعد: majlis_knowledge_engine_v1.sql
-- =====================================================================

-- Source intelligence scores (adaptive discovery)
CREATE TABLE IF NOT EXISTS mke_source_scores (
  source_id         UUID NOT NULL,
  source_url        TEXT,
  trust_score       INTEGER NOT NULL DEFAULT 70 CHECK (trust_score BETWEEN 0 AND 100),
  popularity_score  INTEGER NOT NULL DEFAULT 50 CHECK (popularity_score BETWEEN 0 AND 100),
  activity_score    INTEGER NOT NULL DEFAULT 50 CHECK (activity_score BETWEEN 0 AND 100),
  freshness_score   INTEGER NOT NULL DEFAULT 50 CHECK (freshness_score BETWEEN 0 AND 100),
  health_score      INTEGER NOT NULL DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  latency_ms        INTEGER,
  crawl_interval_min INTEGER NOT NULL DEFAULT 60,
  last_crawl_at     TIMESTAMPTZ,
  last_success_at   TIMESTAMPTZ,
  last_error        TEXT,
  items_found_7d    INTEGER NOT NULL DEFAULT 0,
  metadata          JSONB NOT NULL DEFAULT '{}',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id)
);

CREATE INDEX IF NOT EXISTS mke_source_scores_crawl_idx
  ON mke_source_scores (last_crawl_at ASC NULLS FIRST, health_score DESC);

-- Priority discovery queue
CREATE TABLE IF NOT EXISTS mke_discovery_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID,
  source_url      TEXT NOT NULL,
  priority        INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  composite_score NUMERIC(6, 3) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'scheduled', 'running', 'completed', 'failed', 'skipped')),
  scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  result          JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mke_discovery_queue_pending_idx
  ON mke_discovery_queue (status, priority DESC, scheduled_at ASC);

-- Multi-stage decision scores
CREATE TABLE IF NOT EXISTS mke_decision_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id     UUID REFERENCES mke_decisions(id) ON DELETE SET NULL,
  source_url      TEXT,
  stage           TEXT NOT NULL
    CHECK (stage IN ('vision', 'ocr', 'source', 'quality', 'duplicate', 'reasoning', 'final')),
  score           NUMERIC(5, 3) NOT NULL,
  weight          NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
  weighted_score  NUMERIC(6, 3) NOT NULL,
  details         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mke_decision_scores_url_idx ON mke_decision_scores (source_url, created_at DESC);

-- Quality rejection reports
CREATE TABLE IF NOT EXISTS mke_quality_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID,
  source_url      TEXT,
  draft_id        UUID,
  lesson_id       UUID,
  verdict         TEXT NOT NULL CHECK (verdict IN ('pass', 'review', 'reject')),
  blockers        JSONB NOT NULL DEFAULT '[]',
  warnings        JSONB NOT NULL DEFAULT '[]',
  checks          JSONB NOT NULL DEFAULT '{}',
  report          JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mke_quality_reports_verdict_idx ON mke_quality_reports (verdict, created_at DESC);

-- Self-healing audit log
CREATE TABLE IF NOT EXISTS mke_self_heal_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component       TEXT NOT NULL,
  action          TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('ok', 'failed', 'skipped')),
  details         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mke_self_heal_log_component_idx ON mke_self_heal_log (component, created_at DESC);

-- Notification jobs (multi-channel)
CREATE TABLE IF NOT EXISTS mke_notification_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel         TEXT NOT NULL
    CHECK (channel IN ('push', 'email', 'telegram', 'whatsapp', 'rss', 'web', 'mobile')),
  user_id         UUID,
  lesson_id       UUID,
  payload         JSONB NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  error           TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mke_notification_jobs_pending_idx ON mke_notification_jobs (status, created_at ASC);

-- Extend source plugins with connector metadata (no code change for new sources)
ALTER TABLE mke_source_plugins
  ADD COLUMN IF NOT EXISTS connector_type TEXT DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT,
  ADD COLUMN IF NOT EXISTS fallback_connector TEXT,
  ADD COLUMN IF NOT EXISTS email_filter TEXT,
  ADD COLUMN IF NOT EXISTS api_config JSONB NOT NULL DEFAULT '{}';

-- Extend runs with v2 metadata
ALTER TABLE mke_runs
  ADD COLUMN IF NOT EXISTS engine_version TEXT DEFAULT '2.0.0';

COMMENT ON TABLE mke_source_scores IS 'MKE v2 — adaptive crawl scores per source';
COMMENT ON TABLE mke_discovery_queue IS 'MKE v2 — priority discovery queue';
COMMENT ON TABLE mke_decision_scores IS 'MKE v2 — multi-stage decision scoring';
COMMENT ON TABLE mke_quality_reports IS 'MKE v2 — structured quality rejection reports';
COMMENT ON TABLE mke_self_heal_log IS 'MKE v2 — self-healing actions audit';
COMMENT ON TABLE mke_notification_jobs IS 'MKE v2 — multi-channel notification queue';

-- RLS (admin only)
ALTER TABLE mke_source_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mke_discovery_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE mke_decision_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mke_quality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mke_self_heal_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mke_notification_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mke_v2_admin_scores ON mke_source_scores;
CREATE POLICY mke_v2_admin_scores ON mke_source_scores FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS mke_v2_admin_discovery ON mke_discovery_queue;
CREATE POLICY mke_v2_admin_discovery ON mke_discovery_queue FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS mke_v2_admin_decision_scores ON mke_decision_scores;
CREATE POLICY mke_v2_admin_decision_scores ON mke_decision_scores FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS mke_v2_admin_quality_reports ON mke_quality_reports;
CREATE POLICY mke_v2_admin_quality_reports ON mke_quality_reports FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS mke_v2_admin_self_heal ON mke_self_heal_log;
CREATE POLICY mke_v2_admin_self_heal ON mke_self_heal_log FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS mke_v2_admin_notifications ON mke_notification_jobs;
CREATE POLICY mke_v2_admin_notifications ON mke_notification_jobs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
