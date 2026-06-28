-- Auto Content Jobs — async sync pipeline (Vercel-safe)
-- Apply in Supabase SQL Editor or via platform bootstrap / apply-migrations cron.

CREATE TABLE IF NOT EXISTS auto_content_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'sync',
  status TEXT NOT NULL DEFAULT 'queued',
  phase TEXT NOT NULL DEFAULT 'queued',
  progress INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_by UUID,
  error_message TEXT,
  result JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auto_content_jobs_status ON auto_content_jobs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_content_jobs_running ON auto_content_jobs (status, updated_at)
  WHERE status = 'running';

ALTER TABLE auto_content_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auto_content_jobs_admin ON auto_content_jobs;
CREATE POLICY auto_content_jobs_admin ON auto_content_jobs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Recover jobs stuck in running > 10 minutes (self-healing on migration apply)
UPDATE auto_content_jobs
SET status = 'failed',
    phase = 'failed',
    error_message = 'Job timed out — exceeded 10 minute watchdog (migration recovery)',
    finished_at = now(),
    updated_at = now()
WHERE status = 'running'
  AND updated_at < now() - interval '10 minutes';
