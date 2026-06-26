-- Kuwait Lessons Sync — runs & source health
-- Safe to re-run (IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS lesson_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'completed',
  new_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  archived_count INTEGER NOT NULL DEFAULT 0,
  ai_used_count INTEGER NOT NULL DEFAULT 0,
  sources JSONB DEFAULT '[]'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,
  summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_sync_runs_started_idx ON lesson_sync_runs (started_at DESC);

CREATE TABLE IF NOT EXISTS lesson_sync_sources (
  source_id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  last_sync_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  items_fetched INTEGER NOT NULL DEFAULT 0,
  items_published INTEGER NOT NULL DEFAULT 0,
  items_review INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_sync_sources_status_idx ON lesson_sync_sources (status);

ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

COMMENT ON TABLE lesson_sync_runs IS 'سجل عمليات مزامنة إعلانات الدروس الكويتية';
COMMENT ON TABLE lesson_sync_sources IS 'حالة كل مصدر بيانات للدروس';
