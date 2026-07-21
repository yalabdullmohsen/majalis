-- =====================================================================
--  المجلس العلمي — Auto Engine Production Complete Migration
--  Idempotent — safe to run multiple times
--  Includes: auto_content v2 + AKE v13 + supplementary tracking tables
-- =====================================================================

-- ── Part 1: Auto Content Pipeline v2 (required for imports) ─────────────
ALTER TABLE auto_imported_content
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS structured_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS error_details JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS auto_imported_content_slug_uidx
  ON auto_imported_content(slug);
CREATE INDEX IF NOT EXISTS idx_auto_content_slug ON auto_imported_content(slug);
CREATE INDEX IF NOT EXISTS idx_auto_content_published_at ON auto_imported_content(published_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS auto_import_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL DEFAULT 'cron',
  status TEXT NOT NULL DEFAULT 'running',
  sources_total INTEGER DEFAULT 0,
  sources_ok INTEGER DEFAULT 0,
  sources_failed INTEGER DEFAULT 0,
  imported_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_summary TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_auto_import_runs_started ON auto_import_runs(started_at DESC);

ALTER TABLE auto_import_logs
  ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES auto_import_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT,
  ADD COLUMN IF NOT EXISTS error_details JSONB,
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS item_title TEXT,
  ADD COLUMN IF NOT EXISTS item_external_key TEXT;
CREATE INDEX IF NOT EXISTS idx_auto_import_logs_run ON auto_import_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_auto_import_logs_status ON auto_import_logs(status);

ALTER TABLE auto_import_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auto_import_runs_admin ON auto_import_runs;
CREATE POLICY auto_import_runs_admin ON auto_import_runs
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS auto_import_runs_service ON auto_import_runs;
CREATE POLICY auto_import_runs_service ON auto_import_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION get_published_auto_content_by_slug(p_slug text)
RETURNS SETOF auto_imported_content LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT * FROM auto_imported_content
  WHERE slug = p_slug AND status = 'published' AND verification_status = 'verified' LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION get_published_auto_content_by_slug(text) TO authenticated, anon;

CREATE OR REPLACE FUNCTION get_published_auto_content(p_limit int DEFAULT 20, p_content_type text DEFAULT NULL)
RETURNS SETOF auto_imported_content LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT * FROM auto_imported_content
  WHERE status = 'published' AND verification_status = 'verified'
    AND (p_content_type IS NULL OR content_type = p_content_type)
  ORDER BY published_at DESC NULLS LAST, created_at DESC LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION get_published_auto_content(int, text) TO authenticated, anon;

-- Fix official source URLs (dedupe-safe — avoid trusted_sources_url_uidx violation)
UPDATE trusted_sources SET is_active = false
  WHERE (name ILIKE '%IIFA%' OR name ILIKE '%الأكاديمية الإسلامية%' OR url LIKE '%iifa-aifi%')
    AND url <> 'https://www.iifa-aifi.org/ar/feed';

UPDATE trusted_sources SET url = 'https://www.iifa-aifi.org/ar/feed', is_active = true, trust_level = 95
  WHERE id = (
    SELECT id FROM trusted_sources
    WHERE name ILIKE '%IIFA%' OR name ILIKE '%الأكاديمية الإسلامية%' OR url LIKE '%iifa-aifi%'
    ORDER BY CASE WHEN url = 'https://www.iifa-aifi.org/ar/feed' THEN 0 ELSE 1 END, created_at NULLS LAST
    LIMIT 1
  );

UPDATE trusted_sources SET is_active = false WHERE url LIKE '%islamweb%';

-- ── Part 2: Supplementary tracking tables ───────────────────────────────
CREATE TABLE IF NOT EXISTS ai_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'analyze',
  model TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_generation_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_content_key ON ai_generation_jobs(content_key);

CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  external_key TEXT,
  verification_status TEXT NOT NULL,
  trust_score INTEGER,
  quality_score INTEGER,
  checks JSONB DEFAULT '{}',
  errors TEXT[] DEFAULT '{}',
  verified_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_verification_logs_entity ON verification_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_key ON verification_logs(external_key);

CREATE TABLE IF NOT EXISTS duplicate_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash TEXT NOT NULL UNIQUE,
  external_key TEXT,
  source_name TEXT,
  title TEXT,
  detected_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_duplicate_cache_hash ON duplicate_cache(content_hash);

CREATE TABLE IF NOT EXISTS publishing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID,
  content_type TEXT NOT NULL,
  slug TEXT,
  action TEXT NOT NULL DEFAULT 'publish',
  status TEXT NOT NULL,
  quality_score INTEGER,
  trust_level INTEGER,
  published_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_publishing_history_content ON publishing_history(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_publishing_history_published ON publishing_history(published_at DESC);

CREATE TABLE IF NOT EXISTS source_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES trusted_sources(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_url TEXT,
  health_status TEXT NOT NULL DEFAULT 'unknown',
  http_status INTEGER,
  items_found INTEGER DEFAULT 0,
  last_checked TIMESTAMPTZ DEFAULT now(),
  last_success TIMESTAMPTZ,
  error_message TEXT,
  UNIQUE(source_id)
);
CREATE INDEX IF NOT EXISTS idx_source_health_status ON source_health(health_status);

CREATE TABLE IF NOT EXISTS source_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES trusted_sources(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  items_fetched INTEGER DEFAULT 0,
  items_imported INTEGER DEFAULT 0,
  items_published INTEGER DEFAULT 0,
  items_skipped INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  avg_quality REAL DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  UNIQUE(source_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS auto_publish_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID,
  external_key TEXT,
  priority INTEGER DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','published','failed','cancelled')),
  quality_score INTEGER,
  trust_level INTEGER,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_auto_publish_queue_status ON auto_publish_queue(status, scheduled_at);

-- Compatibility views (aliases for monitoring)
CREATE OR REPLACE VIEW auto_sources AS SELECT * FROM trusted_sources;
CREATE OR REPLACE VIEW auto_content AS SELECT * FROM auto_imported_content;

-- ── Part 3: AKE v13 tables (if not exist) ────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  connector_type TEXT NOT NULL DEFAULT 'rss',
  official_url TEXT NOT NULL,
  feed_url TEXT,
  api_config JSONB NOT NULL DEFAULT '{}',
  trust_level SMALLINT NOT NULL DEFAULT 3,
  allowed_kinds TEXT[] NOT NULL DEFAULT ARRAY['article','news'],
  auto_publish BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  health_status TEXT NOT NULL DEFAULT 'unknown',
  last_health_check TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  items_published INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ake_job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID REFERENCES ake_connectors(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL DEFAULT 'sync',
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  priority INT NOT NULL DEFAULT 5,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ake_queue_status_idx ON ake_job_queue(status, scheduled_at);

CREATE TABLE IF NOT EXISTS ake_engine_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL DEFAULT 'cron',
  status TEXT NOT NULL DEFAULT 'running',
  fetched_count INT DEFAULT 0,
  published_count INT DEFAULT 0,
  duration_ms INT,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ake_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'info',
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ake_link_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  is_alive BOOLEAN NOT NULL DEFAULT true,
  last_checked TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ake_cache (
  cache_key TEXT PRIMARY KEY,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ake_seo_cache (
  content_key TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  json_ld JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ake_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  items_published INT DEFAULT 0,
  items_review INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service role bypass policies for cron operations
ALTER TABLE ai_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_publish_queue ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS service_all ON ai_generation_jobs';
  EXECUTE 'CREATE POLICY service_all ON ai_generation_jobs FOR ALL TO service_role USING (true) WITH CHECK (true)';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Migration audit
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO schema_migrations (migration_name) VALUES ('auto_engine_production_complete_v1')
  ON CONFLICT (migration_name) DO NOTHING;
