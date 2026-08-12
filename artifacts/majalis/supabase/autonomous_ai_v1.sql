-- Autonomous AI Knowledge Platform v1
-- Unified audit, daily content cache, job queue activation, RLS hardening

-- ── Unified pipeline audit stream ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autonomous_pipeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid,
  pipeline text NOT NULL DEFAULT 'autonomous',
  stage text NOT NULL,
  event_type text NOT NULL DEFAULT 'info',
  content_id text,
  content_kind text,
  source_slug text,
  message text,
  metadata jsonb DEFAULT '{}',
  duration_ms int,
  success boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_autonomous_events_run ON autonomous_pipeline_events(run_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_autonomous_events_stage ON autonomous_pipeline_events(stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_autonomous_events_created ON autonomous_pipeline_events(created_at DESC);

-- ── Pipeline runs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autonomous_pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type text NOT NULL DEFAULT 'cron',
  status text NOT NULL DEFAULT 'running',
  stages_completed text[] DEFAULT '{}',
  items_discovered int DEFAULT 0,
  items_published int DEFAULT 0,
  items_rejected int DEFAULT 0,
  items_updated int DEFAULT 0,
  error_count int DEFAULT 0,
  duration_ms int,
  report jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_autonomous_runs_started ON autonomous_pipeline_runs(started_at DESC);

-- ── Daily content rotation cache ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autonomous_daily_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_date date NOT NULL,
  content_type text NOT NULL CHECK (content_type IN (
    'hadith', 'ayah', 'dhikr', 'dua', 'faida', 'question',
    'book_week', 'scholar_week', 'lesson_week'
  )),
  content_id text NOT NULL,
  title text,
  body text NOT NULL,
  metadata jsonb DEFAULT '{}',
  source_name text,
  source_url text,
  verification_status text DEFAULT 'verified',
  created_at timestamptz DEFAULT now(),
  UNIQUE(content_date, content_type)
);

CREATE INDEX IF NOT EXISTS idx_daily_content_date ON autonomous_daily_content(content_date DESC);

-- ── Daily rotation tracking (no-repeat until cycle complete) ───────────────
CREATE TABLE IF NOT EXISTS autonomous_daily_rotation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL UNIQUE,
  pool_size int DEFAULT 0,
  last_index int DEFAULT 0,
  cycle_completed int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- ── Retry queue for failed jobs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autonomous_retry_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  last_error text,
  next_retry_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_retry_queue_status ON autonomous_retry_queue(status, next_retry_at);

-- ── Security audit log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autonomous_security_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  passed boolean DEFAULT true,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ── Periodic reports cache ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autonomous_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  report jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(report_type, period_start)
);

-- ── RLS hardening for scholarly provenance ─────────────────────────────────
ALTER TABLE IF EXISTS content_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_revision_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scholarly_verification_runs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY content_provenance_admin ON content_provenance
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY content_provenance_public_read ON content_provenance
    FOR SELECT USING (verification_status = 'verified');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Grants ─────────────────────────────────────────────────────────────────
GRANT SELECT ON autonomous_pipeline_events TO authenticated, anon;
GRANT SELECT ON autonomous_daily_content TO authenticated, anon;
GRANT SELECT ON autonomous_pipeline_runs TO authenticated;

-- ── Stats RPC ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION autonomous_platform_stats(days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE result jsonb;
DECLARE since timestamptz := now() - (days || ' days')::interval;
BEGIN
  SELECT jsonb_build_object(
    'runs_total', (SELECT count(*) FROM autonomous_pipeline_runs WHERE started_at >= since),
    'runs_success', (SELECT count(*) FROM autonomous_pipeline_runs WHERE status = 'completed' AND started_at >= since),
    'items_published', (SELECT coalesce(sum(items_published), 0) FROM autonomous_pipeline_runs WHERE started_at >= since),
    'items_rejected', (SELECT coalesce(sum(items_rejected), 0) FROM autonomous_pipeline_runs WHERE started_at >= since),
    'events_total', (SELECT count(*) FROM autonomous_pipeline_events WHERE created_at >= since),
    'events_failed', (SELECT count(*) FROM autonomous_pipeline_events WHERE success = false AND created_at >= since),
    'daily_content_count', (SELECT count(*) FROM autonomous_daily_content WHERE content_date >= (now() - interval '1 day')::date),
    'retry_pending', (SELECT count(*) FROM autonomous_retry_queue WHERE status = 'pending')
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION autonomous_platform_stats(int) TO authenticated, anon;
