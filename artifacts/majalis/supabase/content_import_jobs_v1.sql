-- Content Import Jobs — async staging pipeline (Vercel-safe)
-- Apply in Supabase SQL Editor or via platform bootstrap / apply-migrations cron.

CREATE TABLE IF NOT EXISTS content_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  phase TEXT NOT NULL DEFAULT 'pending',
  filename TEXT,
  total_rows INT NOT NULL DEFAULT 0,
  processed_rows INT NOT NULL DEFAULT 0,
  imported INT NOT NULL DEFAULT 0,
  skipped INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  progress_pct REAL NOT NULL DEFAULT 0,
  validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  import_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  report JSONB,
  timings JSONB,
  execution_mode TEXT,
  created_by UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_import_staging (
  job_id UUID NOT NULL REFERENCES content_import_jobs(id) ON DELETE CASCADE,
  row_index INT NOT NULL,
  payload JSONB NOT NULL,
  PRIMARY KEY (job_id, row_index)
);

CREATE INDEX IF NOT EXISTS idx_content_import_staging_job ON content_import_staging (job_id);
CREATE INDEX IF NOT EXISTS idx_content_import_jobs_status ON content_import_jobs (status);
CREATE INDEX IF NOT EXISTS idx_content_import_jobs_started ON content_import_jobs (started_at DESC);

-- Idempotent column adds for deployments that ran an older ENSURE_IMPORT_JOBS_SQL
ALTER TABLE content_import_jobs ADD COLUMN IF NOT EXISTS phase TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE content_import_jobs ADD COLUMN IF NOT EXISTS timings JSONB;
ALTER TABLE content_import_jobs ADD COLUMN IF NOT EXISTS execution_mode TEXT;
ALTER TABLE content_import_jobs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE content_import_jobs ADD COLUMN IF NOT EXISTS stack_trace TEXT;
ALTER TABLE content_import_jobs ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE content_import_jobs ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE content_import_jobs ADD COLUMN IF NOT EXISTS worker TEXT;
ALTER TABLE content_import_jobs ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0;

-- Remove orphan staging rows (partial failures / crashed jobs)
DELETE FROM content_import_staging s
WHERE NOT EXISTS (SELECT 1 FROM content_import_jobs j WHERE j.id = s.job_id);
