-- =====================================================================
--  Phase 5 — AI Source Automation (plugin jobs, step logs, history)
--  نفّذ بعد: smart_source_monitoring_v1.sql
-- =====================================================================

-- Per-source monitor jobs (15-min interval default)
CREATE TABLE IF NOT EXISTS source_monitor_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID NOT NULL,
  interval_minutes INTEGER NOT NULL DEFAULT 15,
  active          BOOLEAN NOT NULL DEFAULT true,
  last_run_at     TIMESTAMPTZ,
  next_run_at     TIMESTAMPTZ,
  last_item_id    TEXT,
  items_processed INTEGER NOT NULL DEFAULT 0,
  config          JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS source_monitor_jobs_source_uidx
  ON source_monitor_jobs (source_id);

-- Step-by-step pipeline logs
CREATE TABLE IF NOT EXISTS automation_step_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        UUID REFERENCES automation_runs(id) ON DELETE SET NULL,
  source_id     UUID,
  draft_id      UUID,
  lesson_id     UUID,
  step          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'ok'
    CHECK (status IN ('ok', 'warn', 'error', 'skip')),
  detail        TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  duration_ms   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automation_step_logs_run_idx
  ON automation_step_logs (run_id, created_at DESC);
CREATE INDEX IF NOT EXISTS automation_step_logs_source_idx
  ON automation_step_logs (source_id, created_at DESC);

-- Lesson content revision history (automation updates)
CREATE TABLE IF NOT EXISTS lesson_content_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     UUID REFERENCES lessons(id) ON DELETE CASCADE,
  source_id     UUID,
  source_url    TEXT,
  action        TEXT NOT NULL
    CHECK (action IN ('create', 'update', 'archive', 'restore')),
  reason        TEXT,
  parsed_payload JSONB NOT NULL DEFAULT '{}',
  image_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_content_history_lesson_idx
  ON lesson_content_history (lesson_id, created_at DESC);

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS archive_reason TEXT,
  ADD COLUMN IF NOT EXISTS mosque_id UUID;

ALTER TABLE source_monitor_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_content_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS source_monitor_jobs_admin ON source_monitor_jobs;
CREATE POLICY source_monitor_jobs_admin ON source_monitor_jobs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS automation_step_logs_admin ON automation_step_logs;
CREATE POLICY automation_step_logs_admin ON automation_step_logs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS lesson_content_history_admin ON lesson_content_history;
CREATE POLICY lesson_content_history_admin ON lesson_content_history
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

COMMENT ON TABLE source_monitor_jobs IS 'Phase 5 — job per trusted source (15-min poll)';
COMMENT ON TABLE automation_step_logs IS 'Phase 5 — pipeline step logs (download, vision, publish, seo)';
