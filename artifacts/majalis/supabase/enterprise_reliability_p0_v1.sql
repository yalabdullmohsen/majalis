-- Enterprise P0: distributed AI circuit + durable background jobs + qa_categories.sort_order
-- Apply via authorized admin migration path only (never automatic Production deploy).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── AI provider circuit ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_provider_circuit (
  provider TEXT PRIMARY KEY,
  circuit_state TEXT NOT NULL DEFAULT 'closed'
    CHECK (circuit_state IN ('closed', 'open', 'half-open')),
  opened_reason TEXT,
  opened_at TIMESTAMPTZ,
  retry_after TIMESTAMPTZ,
  daily_request_count INT NOT NULL DEFAULT 0,
  daily_usage_estimate NUMERIC NOT NULL DEFAULT 0,
  concurrency_lease INT NOT NULL DEFAULT 0,
  day_key TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD'),
  last_alert_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_provider_circuit ENABLE ROW LEVEL SECURITY;

-- ── Durable background jobs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS background_jobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'dead_letter', 'cancelled')),
  idempotency_key TEXT NOT NULL,
  cursor JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  lease_expires_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error_code TEXT,
  last_error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT background_jobs_idempotency UNIQUE (job_type, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_background_jobs_claim
  ON background_jobs (status, next_run_at)
  WHERE status IN ('queued', 'running');

CREATE TABLE IF NOT EXISTS background_job_attempts (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES background_jobs(job_id) ON DELETE CASCADE,
  attempt_no INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS background_job_dead_letters (
  job_id UUID PRIMARY KEY REFERENCES background_jobs(job_id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  last_error_code TEXT,
  last_error_message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_job_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_job_dead_letters ENABLE ROW LEVEL SECURITY;

-- ── qa_categories.sort_order (expand-only; skip if table absent) ─────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'qa_categories'
  ) THEN
    ALTER TABLE qa_categories ADD COLUMN IF NOT EXISTS sort_order INT;
    UPDATE qa_categories SET sort_order = COALESCE(sort_order, 0) WHERE sort_order IS NULL;
    ALTER TABLE qa_categories ALTER COLUMN sort_order SET DEFAULT 0;
    IF NOT EXISTS (SELECT 1 FROM qa_categories WHERE sort_order IS NULL) THEN
      ALTER TABLE qa_categories ALTER COLUMN sort_order SET NOT NULL;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_qa_categories_sort_order ON qa_categories (sort_order);
  END IF;
END $$;

-- Prayer times hot path (location + date) — safe IF NOT EXISTS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'prayer_times'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_prayer_times_city_date
      ON prayer_times (city, prayer_date);
  END IF;
END $$;

-- Upcoming lessons hot filters (status + schedule) when columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_lessons_status_created
      ON lessons (status, created_at DESC);
  END IF;
END $$;
