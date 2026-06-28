-- =====================================================================
--  Autonomous Knowledge Platform v3 — Zero Manual Operation
--  نفّذ بعد: autonomous_platform_v1.sql
-- =====================================================================

-- Extend content sources with health + performance metrics
ALTER TABLE akp_content_sources
  ADD COLUMN IF NOT EXISTS health_score          SMALLINT NOT NULL DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS items_extracted_total BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS items_extracted_last  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_fetch_ms          INTEGER,
  ADD COLUMN IF NOT EXISTS error_rate_pct        NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_http_status      INTEGER,
  ADD COLUMN IF NOT EXISTS last_response_ms      INTEGER,
  ADD COLUMN IF NOT EXISTS auto_disabled_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_disable_reason   TEXT,
  ADD COLUMN IF NOT EXISTS health_checked_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS supported_languages   TEXT[] NOT NULL DEFAULT '{ar}',
  ADD COLUMN IF NOT EXISTS fallback_source_id    UUID REFERENCES akp_content_sources(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS akp_sources_health_idx
  ON akp_content_sources (active, health_score DESC, priority DESC);

-- Health snapshots for trend analysis
CREATE TABLE IF NOT EXISTS akp_source_health_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID NOT NULL REFERENCES akp_content_sources(id) ON DELETE CASCADE,
  health_score    SMALLINT NOT NULL CHECK (health_score BETWEEN 0 AND 100),
  http_status     INTEGER,
  response_ms     INTEGER,
  items_found     INTEGER NOT NULL DEFAULT 0,
  quality_score   SMALLINT,
  error_rate_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_health_snapshots_source_idx
  ON akp_source_health_snapshots (source_id, created_at DESC);

-- Automatic source discovery suggestions
CREATE TABLE IF NOT EXISTS akp_source_discoveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovered_url  TEXT NOT NULL,
  feed_type       TEXT NOT NULL,
  title           TEXT,
  confidence      SMALLINT NOT NULL DEFAULT 70 CHECK (confidence BETWEEN 0 AND 100),
  parent_url      TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'added')),
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ,
  UNIQUE (discovered_url)
);

CREATE INDEX IF NOT EXISTS akp_discoveries_status_idx
  ON akp_source_discoveries (status, created_at DESC);

-- Daily analytics rollup
CREATE TABLE IF NOT EXISTS akp_platform_analytics_daily (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day             DATE NOT NULL UNIQUE,
  items_fetched   INTEGER NOT NULL DEFAULT 0,
  items_published INTEGER NOT NULL DEFAULT 0,
  items_rejected  INTEGER NOT NULL DEFAULT 0,
  items_duplicate INTEGER NOT NULL DEFAULT 0,
  pipeline_stats  JSONB NOT NULL DEFAULT '{}',
  source_stats    JSONB NOT NULL DEFAULT '{}',
  top_sources     JSONB NOT NULL DEFAULT '[]',
  slow_sources    JSONB NOT NULL DEFAULT '[]',
  goal_progress   JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily content goal tracking
CREATE TABLE IF NOT EXISTS akp_daily_goal_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day             DATE NOT NULL,
  content_type    TEXT NOT NULL,
  target_count    INTEGER NOT NULL DEFAULT 0,
  produced_count  INTEGER NOT NULL DEFAULT 0,
  published_count INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'met', 'failed')),
  metadata        JSONB NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (day, content_type)
);

-- Self-healing event log
CREATE TABLE IF NOT EXISTS akp_self_healing_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL,
  component       TEXT NOT NULL,
  source_id       UUID REFERENCES akp_content_sources(id) ON DELETE SET NULL,
  action_taken    TEXT NOT NULL,
  success         BOOLEAN NOT NULL DEFAULT false,
  attempt         INTEGER NOT NULL DEFAULT 1,
  error           TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_self_healing_created_idx
  ON akp_self_healing_events (created_at DESC);

-- Platform audit log (security)
CREATE TABLE IF NOT EXISTS akp_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID,
  actor_label     TEXT,
  action          TEXT NOT NULL,
  resource_type   TEXT,
  resource_id     TEXT,
  ip_address      TEXT,
  user_agent      TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_audit_log_created_idx
  ON akp_audit_log (created_at DESC);

-- Backup snapshot registry
CREATE TABLE IF NOT EXISTS akp_backup_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_type   TEXT NOT NULL DEFAULT 'daily',
  tables_included TEXT[] NOT NULL DEFAULT '{}',
  row_counts      JSONB NOT NULL DEFAULT '{}',
  storage_path    TEXT,
  size_bytes      BIGINT,
  status          TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('running', 'completed', 'failed', 'restored')),
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Semantic index entries (extends fingerprints with searchable metadata)
CREATE TABLE IF NOT EXISTS akp_semantic_index (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type    TEXT NOT NULL,
  content_id      TEXT NOT NULL,
  title           TEXT,
  body_excerpt    TEXT,
  keywords        TEXT[] NOT NULL DEFAULT '{}',
  language        TEXT NOT NULL DEFAULT 'ar',
  embedding       vector(1536),
  trust_score     SMALLINT NOT NULL DEFAULT 80,
  metadata        JSONB NOT NULL DEFAULT '{}',
  indexed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_type, content_id)
);

CREATE INDEX IF NOT EXISTS akp_semantic_index_type_idx
  ON akp_semantic_index (content_type, indexed_at DESC);

-- Smart scheduler state
CREATE TABLE IF NOT EXISTS akp_scheduler_state (
  id              TEXT PRIMARY KEY DEFAULT 'default',
  next_runs       JSONB NOT NULL DEFAULT '{}',
  load_factor     NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  error_budget    NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  metadata        JSONB NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO akp_scheduler_state (id) VALUES ('default') ON CONFLICT DO NOTHING;

ALTER TABLE akp_source_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_source_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_platform_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_daily_goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_self_healing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_backup_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_semantic_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_scheduler_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS akp_v3_admin_health ON akp_source_health_snapshots;
CREATE POLICY akp_v3_admin_health ON akp_source_health_snapshots FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_v3_admin_discoveries ON akp_source_discoveries;
CREATE POLICY akp_v3_admin_discoveries ON akp_source_discoveries FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_v3_admin_analytics ON akp_platform_analytics_daily;
CREATE POLICY akp_v3_admin_analytics ON akp_platform_analytics_daily FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_v3_admin_goals ON akp_daily_goal_progress;
CREATE POLICY akp_v3_admin_goals ON akp_daily_goal_progress FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_v3_admin_healing ON akp_self_healing_events;
CREATE POLICY akp_v3_admin_healing ON akp_self_healing_events FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_v3_admin_audit ON akp_audit_log;
CREATE POLICY akp_v3_admin_audit ON akp_audit_log FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_v3_admin_backup ON akp_backup_snapshots;
CREATE POLICY akp_v3_admin_backup ON akp_backup_snapshots FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_v3_admin_semantic ON akp_semantic_index;
CREATE POLICY akp_v3_admin_semantic ON akp_semantic_index FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_v3_admin_scheduler ON akp_scheduler_state;
CREATE POLICY akp_v3_admin_scheduler ON akp_scheduler_state FOR ALL USING (is_admin()) WITH CHECK (is_admin());

COMMENT ON TABLE akp_source_health_snapshots IS 'AKP v3 — per-source health history';
COMMENT ON TABLE akp_source_discoveries IS 'AKP v3 — auto-discovered feed suggestions';
COMMENT ON TABLE akp_platform_analytics_daily IS 'AKP v3 — daily production analytics rollup';
