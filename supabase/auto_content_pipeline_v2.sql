-- =====================================================================
--  المجلس العلمي — Auto Content Pipeline v2
--  SEO metadata · pipeline runs · error logs · slug uniqueness
--  نفّذ بعد auto_content_pipeline.sql
-- =====================================================================

-- ── SEO & pipeline metadata on imported content ──────────────────────────
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

-- ── Pipeline run tracking ────────────────────────────────────────────────
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

-- ── Enhanced per-item / per-source logs ──────────────────────────────────
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
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ── Public RPC: published feed by slug ───────────────────────────────────
CREATE OR REPLACE FUNCTION get_published_auto_content_by_slug(p_slug text)
RETURNS SETOF auto_imported_content
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT *
  FROM auto_imported_content
  WHERE slug = p_slug
    AND status = 'published'
    AND verification_status = 'verified'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_published_auto_content_by_slug(text) TO authenticated, anon;

-- Refresh published feed RPC (includes new columns)
CREATE OR REPLACE FUNCTION get_published_auto_content(
  p_limit int DEFAULT 20,
  p_content_type text DEFAULT NULL
)
RETURNS SETOF auto_imported_content
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT *
  FROM auto_imported_content
  WHERE status = 'published'
    AND verification_status = 'verified'
    AND (p_content_type IS NULL OR content_type = p_content_type)
  ORDER BY published_at DESC NULLS LAST, created_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_published_auto_content(int, text) TO authenticated, anon;
