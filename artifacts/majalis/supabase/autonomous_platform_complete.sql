-- =====================================================================
--  Autonomous Knowledge Platform — COMPLETE MIGRATION (v1 + v2)
--  آمن للتشغيل مرات متعددة (IF NOT EXISTS في كل مكان)
--  شغّل هذا الملف في Supabase SQL Editor لتهيئة كل الجداول
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ── CORE TABLES (v1) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS akp_content_sources (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  source_type         TEXT NOT NULL DEFAULT 'rss',
  source_url          TEXT NOT NULL,
  priority            INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  trust_score         INTEGER NOT NULL DEFAULT 70 CHECK (trust_score BETWEEN 0 AND 100),
  language            TEXT NOT NULL DEFAULT 'ar',
  category            TEXT NOT NULL DEFAULT 'general',
  content_types       TEXT[] NOT NULL DEFAULT '{}',
  fetch_interval_hours INTEGER NOT NULL DEFAULT 1 CHECK (fetch_interval_hours >= 1),
  dedup_rules         JSONB NOT NULL DEFAULT '{"hash":true,"title_match":true,"source_match":true,"semantic_threshold":0.85}',
  parser              TEXT NOT NULL DEFAULT 'rss',
  validator           TEXT NOT NULL DEFAULT 'scholarly_v1',
  publication_policy  JSONB NOT NULL DEFAULT '{"auto_publish":false,"min_trust":80,"review_on_fail":true}',
  active              BOOLEAN NOT NULL DEFAULT true,
  last_fetch_at       TIMESTAMPTZ,
  last_success_at     TIMESTAMPTZ,
  last_error          TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_content_sources_active_idx
  ON akp_content_sources (active, priority DESC, last_fetch_at ASC NULLS FIRST);

CREATE TABLE IF NOT EXISTS akp_content_fingerprints (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type        TEXT NOT NULL,
  fingerprint_hash    TEXT NOT NULL,
  normalized_text     TEXT,
  title_normalized    TEXT,
  source_slug         TEXT,
  target_table        TEXT,
  target_id           TEXT,
  embedding           vector(1536),
  similarity_group    TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_type, fingerprint_hash)
);

CREATE INDEX IF NOT EXISTS akp_fingerprints_type_hash_idx
  ON akp_content_fingerprints (content_type, fingerprint_hash);
CREATE INDEX IF NOT EXISTS akp_fingerprints_source_idx
  ON akp_content_fingerprints (source_slug, created_at DESC);

CREATE TABLE IF NOT EXISTS akp_review_queue (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type        TEXT NOT NULL,
  source_id           UUID REFERENCES akp_content_sources(id) ON DELETE SET NULL,
  source_slug         TEXT,
  payload             JSONB NOT NULL DEFAULT '{}',
  blockers            JSONB NOT NULL DEFAULT '[]',
  warnings            JSONB NOT NULL DEFAULT '[]',
  status              TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  pipeline_run_id     UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS akp_review_queue_status_idx
  ON akp_review_queue (status, created_at DESC);

CREATE TABLE IF NOT EXISTS akp_dead_letter_jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name          TEXT NOT NULL DEFAULT 'akp',
  job_type            TEXT NOT NULL,
  payload             JSONB NOT NULL DEFAULT '{}',
  error               TEXT NOT NULL,
  retry_count         INTEGER NOT NULL DEFAULT 0,
  original_job_id     UUID,
  failure_reason      TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_dlq_created_idx ON akp_dead_letter_jobs (created_at DESC);

CREATE TABLE IF NOT EXISTS akp_pipeline_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline            TEXT NOT NULL,
  trigger_type        TEXT NOT NULL DEFAULT 'cron',
  mode                TEXT NOT NULL DEFAULT 'produce',
  status              TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  quota_daily         INTEGER NOT NULL DEFAULT 0,
  produced            INTEGER NOT NULL DEFAULT 0,
  published           INTEGER NOT NULL DEFAULT 0,
  duplicates          INTEGER NOT NULL DEFAULT 0,
  rejected            INTEGER NOT NULL DEFAULT 0,
  review_queued       INTEGER NOT NULL DEFAULT 0,
  errors              INTEGER NOT NULL DEFAULT 0,
  duration_ms         INTEGER,
  metadata            JSONB NOT NULL DEFAULT '{}',
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS akp_pipeline_runs_pipeline_idx
  ON akp_pipeline_runs (pipeline, started_at DESC);

CREATE TABLE IF NOT EXISTS akp_structured_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level               TEXT NOT NULL DEFAULT 'info'
    CHECK (level IN ('debug', 'info', 'warn', 'error')),
  component           TEXT NOT NULL,
  event               TEXT NOT NULL,
  message             TEXT,
  pipeline            TEXT,
  run_id              UUID,
  duration_ms         INTEGER,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_logs_component_idx
  ON akp_structured_logs (component, created_at DESC);

CREATE TABLE IF NOT EXISTS akp_metrics_snapshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_type       TEXT NOT NULL DEFAULT 'hourly',
  metrics             JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_metrics_type_idx
  ON akp_metrics_snapshots (snapshot_type, created_at DESC);

CREATE TABLE IF NOT EXISTS akp_alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity            TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  component           TEXT NOT NULL,
  title               TEXT NOT NULL,
  message             TEXT,
  resolved            BOOLEAN NOT NULL DEFAULT false,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS akp_alerts_unresolved_idx
  ON akp_alerts (resolved, severity, created_at DESC);

CREATE TABLE IF NOT EXISTS akp_stories (
  id                  TEXT PRIMARY KEY,
  title               TEXT NOT NULL,
  body                TEXT NOT NULL,
  source_name         TEXT,
  source_url          TEXT,
  category            TEXT DEFAULT 'قصص',
  topic               TEXT,
  summary             TEXT,
  verification_status TEXT NOT NULL DEFAULT 'verified'
    CHECK (verification_status IN ('verified', 'needs_review', 'rejected', 'duplicate')),
  trust_level         SMALLINT NOT NULL DEFAULT 90,
  metadata            JSONB NOT NULL DEFAULT '{}',
  published_at        TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_stories_status_idx ON akp_stories (verification_status, created_at DESC);

-- Extend mke_source_plugins (safe if columns already exist)
ALTER TABLE mke_source_plugins
  ADD COLUMN IF NOT EXISTS content_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS fetch_interval_hours INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS dedup_rules JSONB DEFAULT '{"hash":true,"title_match":true,"semantic_threshold":0.85}',
  ADD COLUMN IF NOT EXISTS parser TEXT DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS validator TEXT DEFAULT 'scholarly_v1',
  ADD COLUMN IF NOT EXISTS publication_policy JSONB DEFAULT '{"auto_publish":false,"min_trust":80}';

-- ── V2 TABLES ─────────────────────────────────────────────────────

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

ALTER TABLE akp_pipeline_runs
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

-- ── RLS POLICIES ─────────────────────────────────────────────────

ALTER TABLE akp_content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_content_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_dead_letter_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_structured_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_retry_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_source_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE akp_duplicate_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS akp_admin_sources ON akp_content_sources;
CREATE POLICY akp_admin_sources ON akp_content_sources FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_fingerprints ON akp_content_fingerprints;
CREATE POLICY akp_admin_fingerprints ON akp_content_fingerprints FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_review ON akp_review_queue;
CREATE POLICY akp_admin_review ON akp_review_queue FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_dlq ON akp_dead_letter_jobs;
CREATE POLICY akp_admin_dlq ON akp_dead_letter_jobs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_pipeline_runs ON akp_pipeline_runs;
CREATE POLICY akp_admin_pipeline_runs ON akp_pipeline_runs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_logs ON akp_structured_logs;
CREATE POLICY akp_admin_logs ON akp_structured_logs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_metrics ON akp_metrics_snapshots;
CREATE POLICY akp_admin_metrics ON akp_metrics_snapshots FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_alerts ON akp_alerts;
CREATE POLICY akp_admin_alerts ON akp_alerts FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_stories_public_read ON akp_stories;
CREATE POLICY akp_stories_public_read ON akp_stories FOR SELECT USING (verification_status = 'verified');
DROP POLICY IF EXISTS akp_stories_admin ON akp_stories;
CREATE POLICY akp_stories_admin ON akp_stories FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_retry_queue ON akp_retry_queue;
CREATE POLICY akp_admin_retry_queue ON akp_retry_queue FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_source_health ON akp_source_health;
CREATE POLICY akp_admin_source_health ON akp_source_health FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS akp_admin_duplicate_history ON akp_duplicate_history;
CREATE POLICY akp_admin_duplicate_history ON akp_duplicate_history FOR ALL USING (is_admin()) WITH CHECK (is_admin());
