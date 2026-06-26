-- Scholarly Verification & Editorial System v1
-- Idempotent — safe to re-run

-- ── Unified provenance (one row per content item) ──
CREATE TABLE IF NOT EXISTS content_provenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  external_key TEXT,
  source_name TEXT NOT NULL,
  source_title TEXT,
  source_author TEXT,
  source_type TEXT NOT NULL DEFAULT 'website',
  source_url TEXT NOT NULL,
  published_at_source TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  trust_level SMALLINT NOT NULL DEFAULT 50 CHECK (trust_level BETWEEN 0 AND 100),
  verification_status TEXT NOT NULL DEFAULT 'needs_review'
    CHECK (verification_status IN ('verified','needs_review','rejected','duplicate','archived')),
  quality_score SMALLINT NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  completeness_score SMALLINT NOT NULL DEFAULT 0 CHECK (completeness_score BETWEEN 0 AND 100),
  link_status TEXT DEFAULT 'unknown'
    CHECK (link_status IN ('ok','broken','redirect','unknown','skipped')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_type, content_id)
);

CREATE INDEX IF NOT EXISTS content_provenance_status_idx ON content_provenance (verification_status);
CREATE INDEX IF NOT EXISTS content_provenance_type_idx ON content_provenance (content_type);
CREATE INDEX IF NOT EXISTS content_provenance_trust_idx ON content_provenance (trust_level DESC);
CREATE INDEX IF NOT EXISTS content_provenance_external_key_idx ON content_provenance (external_key)
  WHERE external_key IS NOT NULL AND external_key <> '';

-- ── Revision history ──
CREATE TABLE IF NOT EXISTS content_revision_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL DEFAULT 1,
  change_reason TEXT,
  change_source TEXT NOT NULL DEFAULT 'system'
    CHECK (change_source IN ('manual','auto_import','sync','ai','cron','admin')),
  is_automated BOOLEAN NOT NULL DEFAULT true,
  changed_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  diff_summary TEXT,
  actor_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_revision_log_item_idx
  ON content_revision_log (content_type, content_id, created_at DESC);

-- ── Version snapshots (rollback) ──
CREATE TABLE IF NOT EXISTS content_version_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  provenance JSONB,
  verification_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT DEFAULT 'system',
  UNIQUE (content_type, content_id, version_number)
);

CREATE INDEX IF NOT EXISTS content_version_snapshots_item_idx
  ON content_version_snapshots (content_type, content_id, version_number DESC);

-- ── Periodic verification runs ──
CREATE TABLE IF NOT EXISTS scholarly_verification_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL DEFAULT 'cron',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  items_scanned INTEGER NOT NULL DEFAULT 0,
  items_verified INTEGER NOT NULL DEFAULT 0,
  items_needs_review INTEGER NOT NULL DEFAULT 0,
  links_checked INTEGER NOT NULL DEFAULT 0,
  links_broken INTEGER NOT NULL DEFAULT 0,
  duplicates_found INTEGER NOT NULL DEFAULT 0,
  stale_items INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  summary JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS scholarly_verification_runs_started_idx
  ON scholarly_verification_runs (started_at DESC);

-- Extend verification_logs for scholarly system
ALTER TABLE IF EXISTS verification_logs
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS checks_passed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS checks_failed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES scholarly_verification_runs(id) ON DELETE SET NULL;

-- Extend publishing_history
ALTER TABLE IF EXISTS publishing_history
  ADD COLUMN IF NOT EXISTS revision_number INTEGER,
  ADD COLUMN IF NOT EXISTS verification_status TEXT,
  ADD COLUMN IF NOT EXISTS actor_id UUID,
  ADD COLUMN IF NOT EXISTS is_automated BOOLEAN DEFAULT false;

-- Provenance columns on core CMS tables (optional backfill)
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'needs_review';
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS trust_level SMALLINT DEFAULT 50;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS fawaid ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE IF EXISTS fawaid ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE IF EXISTS fawaid ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'needs_review';
ALTER TABLE IF EXISTS fawaid ADD COLUMN IF NOT EXISTS trust_level SMALLINT DEFAULT 50;

ALTER TABLE IF EXISTS library_items ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE IF EXISTS library_items ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'needs_review';
ALTER TABLE IF EXISTS library_items ADD COLUMN IF NOT EXISTS trust_level SMALLINT DEFAULT 50;

ALTER TABLE IF EXISTS qa_questions ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE IF EXISTS qa_questions ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'needs_review';

ALTER TABLE IF EXISTS fatwas ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'needs_review';
ALTER TABLE IF EXISTS fatwas ADD COLUMN IF NOT EXISTS trust_level SMALLINT DEFAULT 50;

COMMENT ON TABLE content_provenance IS 'مصدر موحد لكل عنصر — لا نشر بدون source_url وsource_name';
COMMENT ON TABLE content_revision_log IS 'سجل تعديلات كامل لكل عنصر';
COMMENT ON TABLE content_version_snapshots IS 'نسخ متعددة للرجوع لأي إصدار سابق';

-- Scholarly search RPC
CREATE OR REPLACE FUNCTION search_scholarly_content(
  p_query TEXT DEFAULT NULL,
  p_source_name TEXT DEFAULT NULL,
  p_author TEXT DEFAULT NULL,
  p_content_type TEXT DEFAULT NULL,
  p_verification_status TEXT DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_limit INT DEFAULT 30
)
RETURNS TABLE (
  content_type TEXT,
  content_id TEXT,
  title TEXT,
  source_name TEXT,
  source_url TEXT,
  verification_status TEXT,
  trust_level SMALLINT,
  quality_score SMALLINT,
  updated_at TIMESTAMPTZ,
  rank REAL
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    cp.content_type,
    cp.content_id,
    COALESCE(cp.source_title, cp.source_name, cp.content_id) AS title,
    cp.source_name,
    cp.source_url,
    cp.verification_status,
    cp.trust_level,
    cp.quality_score,
    cp.updated_at,
    CASE
      WHEN p_query IS NULL OR p_query = '' THEN 1.0
      WHEN cp.source_name ILIKE '%' || p_query || '%' THEN 2.0
      WHEN cp.source_title ILIKE '%' || p_query || '%' THEN 1.5
      ELSE 0.5
    END AS rank
  FROM content_provenance cp
  WHERE (p_content_type IS NULL OR cp.content_type = p_content_type)
    AND (p_verification_status IS NULL OR cp.verification_status = p_verification_status)
    AND (p_source_name IS NULL OR cp.source_name ILIKE '%' || p_source_name || '%')
    AND (p_author IS NULL OR cp.source_author ILIKE '%' || p_author || '%')
    AND (p_date_from IS NULL OR cp.updated_at::date >= p_date_from)
    AND (p_date_to IS NULL OR cp.updated_at::date <= p_date_to)
    AND (
      p_query IS NULL OR p_query = ''
      OR cp.source_name ILIKE '%' || p_query || '%'
      OR cp.source_title ILIKE '%' || p_query || '%'
      OR cp.source_url ILIKE '%' || p_query || '%'
    )
  ORDER BY rank DESC, cp.trust_level DESC, cp.updated_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION search_scholarly_content TO authenticated, anon;
