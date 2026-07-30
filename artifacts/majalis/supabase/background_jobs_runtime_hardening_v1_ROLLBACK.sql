-- Rollback: background_jobs_runtime_hardening_v1
-- Safe to run only if no application code depends on these columns.

DROP INDEX IF EXISTS idx_background_jobs_next_retry;
DROP INDEX IF EXISTS idx_background_jobs_type_running_lease;

ALTER TABLE background_jobs DROP COLUMN IF EXISTS completed_at;
ALTER TABLE background_jobs DROP COLUMN IF EXISTS next_retry_at;
