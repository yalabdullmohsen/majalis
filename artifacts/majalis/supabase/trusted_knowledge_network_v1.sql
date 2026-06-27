-- =====================================================================
--  Trusted Knowledge Network v1 — Phase 5 Production
--  نفّذ بعد: autonomous_platform_v1.sql
-- =====================================================================

-- Configurable daily/weekly quotas (editable from admin dashboard)
CREATE TABLE IF NOT EXISTS tkn_platform_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key     TEXT NOT NULL UNIQUE,
  setting_value   JSONB NOT NULL DEFAULT '{}',
  label           TEXT,
  updated_by      TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO tkn_platform_settings (setting_key, setting_value, label)
VALUES
  ('daily_quotas', '{"benefits":300,"questions":150,"hadith":150,"rulings":50,"stories":20,"articles":10}'::jsonb, 'حصص الإنتاج اليومية'),
  ('weekly_quotas', '{"articles":10}'::jsonb, 'حصص الإنتاج الأسبوعية'),
  ('auto_publish', '{"enabled":false,"min_trust":80}'::jsonb, 'سياسة النشر التلقائي')
ON CONFLICT (setting_key) DO NOTHING;

-- Extend AKP sources with operational metrics
ALTER TABLE akp_content_sources
  ADD COLUMN IF NOT EXISTS success_rate       NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (success_rate BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS items_imported     INTEGER NOT NULL DEFAULT 0 CHECK (items_imported >= 0),
  ADD COLUMN IF NOT EXISTS items_published    INTEGER NOT NULL DEFAULT 0 CHECK (items_published >= 0),
  ADD COLUMN IF NOT EXISTS items_rejected     INTEGER NOT NULL DEFAULT 0 CHECK (items_rejected >= 0),
  ADD COLUMN IF NOT EXISTS fetch_count        INTEGER NOT NULL DEFAULT 0 CHECK (fetch_count >= 0),
  ADD COLUMN IF NOT EXISTS success_count      INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
  ADD COLUMN IF NOT EXISTS last_sync_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS connector_config   JSONB NOT NULL DEFAULT '{}';

-- Source operation audit log
CREATE TABLE IF NOT EXISTS tkn_source_operations_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID REFERENCES akp_content_sources(id) ON DELETE SET NULL,
  source_slug     TEXT,
  operation       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'started',
  items_found     INTEGER NOT NULL DEFAULT 0,
  items_processed INTEGER NOT NULL DEFAULT 0,
  items_published INTEGER NOT NULL DEFAULT 0,
  items_duplicate INTEGER NOT NULL DEFAULT 0,
  items_rejected  INTEGER NOT NULL DEFAULT 0,
  duration_ms     INTEGER,
  error_message   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  triggered_by    TEXT NOT NULL DEFAULT 'system',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS tkn_source_ops_source_idx
  ON tkn_source_operations_log (source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tkn_source_ops_slug_idx
  ON tkn_source_operations_log (source_slug, created_at DESC);

-- Retry queue for failed pipeline jobs
CREATE TABLE IF NOT EXISTS tkn_retry_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name      TEXT NOT NULL DEFAULT 'tkn',
  job_type        TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'pending',
  retry_count     INTEGER NOT NULL DEFAULT 0,
  max_retries     INTEGER NOT NULL DEFAULT 3,
  next_retry_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error      TEXT,
  source_id       UUID,
  source_slug     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tkn_retry_queue_pending_idx
  ON tkn_retry_queue (status, next_retry_at ASC)
  WHERE status IN ('pending', 'retrying');

-- Pipeline stage metrics (per-run timing)
CREATE TABLE IF NOT EXISTS tkn_pipeline_stage_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID,
  pipeline        TEXT NOT NULL,
  stage           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'completed',
  duration_ms     INTEGER,
  items_in        INTEGER NOT NULL DEFAULT 0,
  items_out       INTEGER NOT NULL DEFAULT 0,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tkn_stage_logs_run_idx
  ON tkn_pipeline_stage_logs (run_id, created_at ASC);

-- RLS
ALTER TABLE tkn_platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tkn_source_operations_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tkn_retry_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE tkn_pipeline_stage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tkn_admin_settings ON tkn_platform_settings;
CREATE POLICY tkn_admin_settings ON tkn_platform_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS tkn_admin_ops_log ON tkn_source_operations_log;
CREATE POLICY tkn_admin_ops_log ON tkn_source_operations_log FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS tkn_admin_retry ON tkn_retry_queue;
CREATE POLICY tkn_admin_retry ON tkn_retry_queue FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS tkn_admin_stage_logs ON tkn_pipeline_stage_logs;
CREATE POLICY tkn_admin_stage_logs ON tkn_pipeline_stage_logs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
