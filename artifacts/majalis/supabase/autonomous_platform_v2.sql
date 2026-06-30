-- =====================================================================
--  Autonomous Knowledge Platform v2 — Missing Tables
--  نفّذ بعد: autonomous_platform_v1.sql
-- =====================================================================

-- Retry queue (exponential backoff for failed pipeline jobs)
CREATE TABLE IF NOT EXISTS akp_retry_queue (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name       TEXT NOT NULL DEFAULT 'akp-pipeline',
  job_type         TEXT NOT NULL,
  payload          JSONB NOT NULL DEFAULT '{}',
  error            TEXT,
  retry_count      INTEGER NOT NULL DEFAULT 0,
  max_retries      INTEGER NOT NULL DEFAULT 3,
  next_retry_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  pipeline_run_id  UUID,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_retry_queue_next_idx
  ON akp_retry_queue (next_retry_at ASC)
  WHERE retry_count < max_retries;

CREATE INDEX IF NOT EXISTS akp_retry_queue_type_idx
  ON akp_retry_queue (queue_name, job_type, created_at DESC);

-- Source health per-probe records
CREATE TABLE IF NOT EXISTS akp_source_health (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_slug    TEXT NOT NULL,
  endpoint_url   TEXT NOT NULL,
  status         TEXT NOT NULL
    CHECK (status IN ('available', 'slow', 'redirect', 'unauthorized', 'blocked', 'dead', 'unknown')),
  http_status    INTEGER,
  latency_ms     INTEGER,
  error_message  TEXT,
  items_found    INTEGER NOT NULL DEFAULT 0,
  metadata       JSONB NOT NULL DEFAULT '{}',
  checked_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_source_health_slug_idx
  ON akp_source_health (source_slug, checked_at DESC);

CREATE INDEX IF NOT EXISTS akp_source_health_status_idx
  ON akp_source_health (status, checked_at DESC);

-- Deduplication history (audit trail of detected duplicates)
CREATE TABLE IF NOT EXISTS akp_duplicate_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type      TEXT NOT NULL,
  fingerprint_hash  TEXT,
  source_slug       TEXT,
  target_id         TEXT,
  duplicate_of      TEXT,
  detection_method  TEXT NOT NULL DEFAULT 'hash'
    CHECK (detection_method IN ('hash', 'title_match', 'semantic', 'source_match')),
  similarity_score  FLOAT,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_duplicate_history_type_idx
  ON akp_duplicate_history (content_type, created_at DESC);

CREATE INDEX IF NOT EXISTS akp_duplicate_history_source_idx
  ON akp_duplicate_history (source_slug, created_at DESC);

-- Add retry_count column to pipeline runs (used by recovery)
ALTER TABLE akp_pipeline_runs
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

-- RLS (admin only)
ALTER TABLE akp_retry_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_source_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_duplicate_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS akp_admin_retry_queue ON akp_retry_queue;
CREATE POLICY akp_admin_retry_queue ON akp_retry_queue FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_source_health ON akp_source_health;
CREATE POLICY akp_admin_source_health ON akp_source_health FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_duplicate_history ON akp_duplicate_history;
CREATE POLICY akp_admin_duplicate_history ON akp_duplicate_history FOR ALL USING (is_admin()) WITH CHECK (is_admin());

COMMENT ON TABLE akp_retry_queue IS 'AKP v2 — exponential backoff retry queue for failed pipeline jobs';
COMMENT ON TABLE akp_source_health IS 'AKP v2 — per-probe source health records with latency and status';
COMMENT ON TABLE akp_duplicate_history IS 'AKP v2 — audit trail for deduplication decisions';
