-- Background jobs runtime hardening v1
-- Apply manually (staging first). Never via Cron/API/runtime DDL.
-- Adds completed_at + next_retry_at; strengthens claim indexes.

ALTER TABLE background_jobs
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

ALTER TABLE background_jobs
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Keep next_retry_at aligned with historical next_run_at for queued retries
UPDATE background_jobs
SET next_retry_at = next_run_at
WHERE status = 'queued'
  AND last_error_code IS NOT NULL
  AND next_retry_at IS NULL;

UPDATE background_jobs
SET completed_at = finished_at
WHERE status = 'succeeded'
  AND finished_at IS NOT NULL
  AND completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_background_jobs_type_running_lease
  ON background_jobs (job_type, lease_expires_at)
  WHERE status = 'running';

CREATE INDEX IF NOT EXISTS idx_background_jobs_next_retry
  ON background_jobs (status, next_retry_at)
  WHERE status = 'queued' AND next_retry_at IS NOT NULL;

COMMENT ON COLUMN background_jobs.next_retry_at IS
  'When set, mirrors scheduled retry time (also stored in next_run_at).';
COMMENT ON COLUMN background_jobs.completed_at IS
  'Set when status becomes succeeded; distinct from finished_at on dead_letter.';
