-- =====================================================================
--  Majlis Knowledge Engine v1 — Autonomous Platform 1.0
--  نفّذ بعد: instagram_graph_phase7_v1.sql
-- =====================================================================

-- Plugin registry — add sources without code changes
CREATE TABLE IF NOT EXISTS mke_source_plugins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  source_type     TEXT NOT NULL DEFAULT 'website',
  platform        TEXT NOT NULL DEFAULT 'website',
  source_url      TEXT NOT NULL,
  trust_score     INTEGER NOT NULL DEFAULT 70 CHECK (trust_score BETWEEN 0 AND 100),
  auto_publish    BOOLEAN NOT NULL DEFAULT false,
  active          BOOLEAN NOT NULL DEFAULT true,
  country         TEXT DEFAULT 'الكويت',
  city            TEXT,
  priority        INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  config          JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS mke_source_plugins_url_uidx ON mke_source_plugins (source_url);
CREATE INDEX IF NOT EXISTS mke_source_plugins_active_idx ON mke_source_plugins (active, priority DESC);

-- Engine run log
CREATE TABLE IF NOT EXISTS mke_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type      TEXT NOT NULL DEFAULT 'cron',
  mode              TEXT NOT NULL DEFAULT 'full',
  status            TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  sources_scanned   INTEGER NOT NULL DEFAULT 0,
  items_discovered  INTEGER NOT NULL DEFAULT 0,
  items_analyzed    INTEGER NOT NULL DEFAULT 0,
  items_published   INTEGER NOT NULL DEFAULT 0,
  items_pending     INTEGER NOT NULL DEFAULT 0,
  items_duplicate   INTEGER NOT NULL DEFAULT 0,
  items_rejected    INTEGER NOT NULL DEFAULT 0,
  items_updated     INTEGER NOT NULL DEFAULT 0,
  items_expired     INTEGER NOT NULL DEFAULT 0,
  errors            INTEGER NOT NULL DEFAULT 0,
  duration_ms       INTEGER,
  metadata          JSONB NOT NULL DEFAULT '{}',
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS mke_runs_started_idx ON mke_runs (started_at DESC);

-- AI decisions audit
CREATE TABLE IF NOT EXISTS mke_decisions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id         UUID,
  source_url        TEXT,
  draft_id          UUID,
  lesson_id         UUID,
  decision          TEXT NOT NULL
    CHECK (decision IN ('approved', 'pending_review', 'duplicate', 'rejected', 'archived', 'expired')),
  confidence_score  NUMERIC(5, 3),
  reasons           JSONB NOT NULL DEFAULT '[]',
  checks            JSONB NOT NULL DEFAULT '{}',
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mke_decisions_decision_idx ON mke_decisions (decision, created_at DESC);

-- Vision analysis log
CREATE TABLE IF NOT EXISTS mke_vision_analyses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id         UUID,
  source_url        TEXT,
  methods           JSONB NOT NULL DEFAULT '[]',
  ocr_confidence    NUMERIC(5, 3),
  vision_confidence NUMERIC(5, 3),
  parsed_fields     JSONB NOT NULL DEFAULT '[]',
  entities          JSONB NOT NULL DEFAULT '{}',
  duration_ms       INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mke_vision_analyses_created_idx ON mke_vision_analyses (created_at DESC);

-- Knowledge graph link audit
CREATE TABLE IF NOT EXISTS mke_graph_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE,
  nodes_created   INTEGER NOT NULL DEFAULT 0,
  edges_created   INTEGER NOT NULL DEFAULT 0,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Change log (updates, cancellations, expiry)
CREATE TABLE IF NOT EXISTS mke_change_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       UUID REFERENCES lessons(id) ON DELETE SET NULL,
  source_id       UUID,
  source_url      TEXT,
  change_type     TEXT NOT NULL
    CHECK (change_type IN ('updated', 'cancelled', 'expired', 'media_linked')),
  changes         JSONB NOT NULL DEFAULT '[]',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mke_change_log_lesson_idx ON mke_change_log (lesson_id, created_at DESC);

-- Quality flags
CREATE TABLE IF NOT EXISTS mke_quality_flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID,
  lesson_id       UUID,
  draft_id        UUID,
  flag_type       TEXT NOT NULL DEFAULT 'warning'
    CHECK (flag_type IN ('warning', 'blocker', 'info')),
  message         TEXT NOT NULL,
  metadata        JSONB NOT NULL DEFAULT '{}',
  resolved        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Async job queue
CREATE TABLE IF NOT EXISTS mke_queue_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type        TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  priority        INTEGER NOT NULL DEFAULT 5,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'retry')),
  retry_count     INTEGER NOT NULL DEFAULT 0,
  max_retries     INTEGER NOT NULL DEFAULT 3,
  last_error      TEXT,
  result          JSONB,
  next_run_at     TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mke_queue_jobs_status_idx ON mke_queue_jobs (status, next_run_at);

-- RLS
ALTER TABLE mke_source_plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE mke_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mke_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mke_vision_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mke_graph_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE mke_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mke_quality_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE mke_queue_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mke_admin_all ON mke_runs;
CREATE POLICY mke_admin_all ON mke_runs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS mke_source_plugins_admin ON mke_source_plugins;
CREATE POLICY mke_source_plugins_admin ON mke_source_plugins FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS mke_decisions_admin ON mke_decisions;
CREATE POLICY mke_decisions_admin ON mke_decisions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS mke_vision_admin ON mke_vision_analyses;
CREATE POLICY mke_vision_admin ON mke_vision_analyses FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS mke_graph_admin ON mke_graph_links;
CREATE POLICY mke_graph_admin ON mke_graph_links FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS mke_change_admin ON mke_change_log;
CREATE POLICY mke_change_admin ON mke_change_log FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS mke_quality_admin ON mke_quality_flags;
CREATE POLICY mke_quality_admin ON mke_quality_flags FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS mke_queue_admin ON mke_queue_jobs;
CREATE POLICY mke_queue_admin ON mke_queue_jobs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

COMMENT ON TABLE mke_source_plugins IS 'Majlis Knowledge Engine — plugin registry for new sources without code deploy';
