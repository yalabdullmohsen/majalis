-- =====================================================================
--  Phase 7 — Autonomous Content Engines Expansion
--  Unified orchestration, review queue, audit trail, derived content
--  Run after: content_production_v1.sql, lesson_intelligence_v6.sql
-- =====================================================================

-- Engine registry (enabled/disabled per engine)
CREATE TABLE IF NOT EXISTS content_engine_config (
  id              TEXT PRIMARY KEY,
  label_ar        TEXT NOT NULL,
  enabled         BOOLEAN NOT NULL DEFAULT true,
  last_run_at     TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error      TEXT,
  health_score    SMALLINT NOT NULL DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  config          JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO content_engine_config (id, label_ar) VALUES
  ('lesson-intelligence', 'محرك ذكاء الدروس'),
  ('benefits', 'محرك استخراج الفوائد'),
  ('quiz', 'محرك توليد الأسئلة'),
  ('lesson-notes', 'محرك ملاحظات الدروس'),
  ('sheikh-enrichment', 'محرك إثراء الشيوخ'),
  ('instagram', 'محرك إنستغرام'),
  ('youtube', 'محرك يوتيوب'),
  ('articles', 'محرك المقالات'),
  ('review-queue', 'محرك مركز المراجعة'),
  ('recommendations', 'محرك التوصيات'),
  ('notifications', 'محرك الإشعارات'),
  ('backfill', 'محرك التعبئة الأولية')
ON CONFLICT (id) DO NOTHING;

-- Per-engine run records
CREATE TABLE IF NOT EXISTS content_engine_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id       TEXT NOT NULL REFERENCES content_engine_config(id),
  run_type        TEXT NOT NULL DEFAULT 'incremental'
    CHECK (run_type IN ('incremental', 'backfill', 'manual', 'retry', 'cron')),
  status          TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  items_fetched   INTEGER NOT NULL DEFAULT 0,
  items_parsed    INTEGER NOT NULL DEFAULT 0,
  items_enriched  INTEGER NOT NULL DEFAULT 0,
  items_duplicate INTEGER NOT NULL DEFAULT 0,
  items_rejected  INTEGER NOT NULL DEFAULT 0,
  items_review    INTEGER NOT NULL DEFAULT 0,
  items_published INTEGER NOT NULL DEFAULT 0,
  items_indexed   INTEGER NOT NULL DEFAULT 0,
  health_score    SMALLINT,
  error_message   TEXT,
  report          JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  duration_ms     INTEGER
);

CREATE INDEX IF NOT EXISTS content_engine_runs_engine_idx
  ON content_engine_runs (engine_id, started_at DESC);

-- Structured logs per pipeline stage
CREATE TABLE IF NOT EXISTS content_engine_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID REFERENCES content_engine_runs(id) ON DELETE CASCADE,
  engine_id       TEXT NOT NULL,
  stage           TEXT NOT NULL,
  level           TEXT NOT NULL DEFAULT 'info'
    CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message         TEXT NOT NULL,
  source_url      TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_engine_logs_run_idx
  ON content_engine_logs (run_id, created_at DESC);

-- Unified review queue
CREATE TABLE IF NOT EXISTS content_engine_review_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id       TEXT NOT NULL,
  run_id          UUID REFERENCES content_engine_runs(id) ON DELETE SET NULL,
  source_type     TEXT,
  source_url      TEXT,
  source_name     TEXT,
  title           TEXT,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason          TEXT NOT NULL
    CHECK (reason IN (
      'missing_source', 'low_quality', 'duplicate', 'weak_extraction',
      'unknown_sheikh', 'unclear_category', 'needs_manual_approval'
    )),
  reason_detail   TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_engine_review_queue_status_idx
  ON content_engine_review_queue (status, created_at DESC);

-- Source fingerprints for deduplication
CREATE TABLE IF NOT EXISTS content_engine_source_fingerprints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id       TEXT NOT NULL,
  source_url      TEXT NOT NULL,
  external_key    TEXT,
  content_hash    TEXT NOT NULL,
  target_table    TEXT,
  target_id       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (engine_id, content_hash)
);

CREATE INDEX IF NOT EXISTS content_engine_fingerprints_url_idx
  ON content_engine_source_fingerprints (source_url);

-- Backfill status per engine + month
CREATE TABLE IF NOT EXISTS content_engine_backfill_status (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id       TEXT NOT NULL,
  month_key       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  items_processed INTEGER NOT NULL DEFAULT 0,
  items_published INTEGER NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  error_message   TEXT,
  report          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (engine_id, month_key)
);

-- Publish audit trail
CREATE TABLE IF NOT EXISTS content_engine_publish_audit (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID REFERENCES content_engine_runs(id) ON DELETE SET NULL,
  engine_id       TEXT NOT NULL,
  target_table    TEXT NOT NULL,
  target_id       TEXT NOT NULL,
  source_url      TEXT,
  action          TEXT NOT NULL DEFAULT 'publish'
    CHECK (action IN ('publish', 'update', 'skip', 'review')),
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_engine_publish_audit_target_idx
  ON content_engine_publish_audit (target_table, target_id);

-- Generated benefits (linked to source lesson/article)
CREATE TABLE IF NOT EXISTS content_engine_generated_benefits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID REFERENCES content_engine_runs(id) ON DELETE SET NULL,
  source_type     TEXT NOT NULL DEFAULT 'lesson',
  source_id       UUID,
  source_url      TEXT NOT NULL,
  text            TEXT NOT NULL,
  author_name     TEXT,
  category        TEXT,
  quality_score   SMALLINT NOT NULL DEFAULT 75,
  fawaid_id       UUID,
  status          TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'review', 'rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_url, text)
);

CREATE INDEX IF NOT EXISTS content_engine_benefits_source_idx
  ON content_engine_generated_benefits (source_id, created_at DESC);

-- Generated quiz questions
CREATE TABLE IF NOT EXISTS content_engine_generated_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID REFERENCES content_engine_runs(id) ON DELETE SET NULL,
  source_type     TEXT NOT NULL DEFAULT 'lesson',
  source_id       UUID,
  source_url      TEXT NOT NULL,
  question        TEXT NOT NULL,
  options         JSONB NOT NULL,
  correct_index   SMALLINT NOT NULL DEFAULT 0,
  category        TEXT,
  difficulty      TEXT DEFAULT 'متوسط',
  quiz_id         UUID,
  status          TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'review', 'rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_url, question)
);

CREATE INDEX IF NOT EXISTS content_engine_questions_source_idx
  ON content_engine_generated_questions (source_id, created_at DESC);

-- Structured lesson notes
CREATE TABLE IF NOT EXISTS content_engine_lesson_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID REFERENCES content_engine_runs(id) ON DELETE SET NULL,
  lesson_id       UUID NOT NULL,
  source_url      TEXT,
  main_points     JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtopics       JSONB NOT NULL DEFAULT '[]'::jsonb,
  practical       JSONB NOT NULL DEFAULT '[]'::jsonb,
  quotes          JSONB NOT NULL DEFAULT '[]'::jsonb,
  follow_up       JSONB NOT NULL DEFAULT '[]'::jsonb,
  status          TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'review', 'rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lesson_id)
);

-- Recommendation links
CREATE TABLE IF NOT EXISTS content_engine_recommendations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table    TEXT NOT NULL,
  source_id       TEXT NOT NULL,
  target_table    TEXT NOT NULL,
  target_id       TEXT NOT NULL,
  score           NUMERIC(6, 2) NOT NULL DEFAULT 0,
  algorithm       TEXT NOT NULL DEFAULT 'hybrid',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_table, source_id, target_table, target_id)
);

CREATE INDEX IF NOT EXISTS content_engine_recommendations_source_idx
  ON content_engine_recommendations (source_table, source_id);

-- Structured notes on lessons (optional denormalized cache)
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS structured_notes JSONB,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- RPC: aggregate engine stats for dashboard
CREATE OR REPLACE FUNCTION content_engine_stats(p_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'engines', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'label_ar', c.label_ar,
        'enabled', c.enabled,
        'last_run_at', c.last_run_at,
        'last_success_at', c.last_success_at,
        'last_error', c.last_error,
        'health_score', c.health_score
      ) ORDER BY c.id), '[]'::jsonb)
      FROM content_engine_config c
    ),
    'recent_runs', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', r.id,
        'engine_id', r.engine_id,
        'run_type', r.run_type,
        'status', r.status,
        'items_fetched', r.items_fetched,
        'items_parsed', r.items_parsed,
        'items_published', r.items_published,
        'items_review', r.items_review,
        'items_rejected', r.items_rejected,
        'items_duplicate', r.items_duplicate,
        'started_at', r.started_at,
        'duration_ms', r.duration_ms
      ) ORDER BY r.started_at DESC), '[]'::jsonb)
      FROM (
        SELECT * FROM content_engine_runs
        WHERE started_at >= now() - (p_days || ' days')::interval
        ORDER BY started_at DESC
        LIMIT 50
      ) r
    ),
    'review_pending', (
      SELECT count(*)::int FROM content_engine_review_queue WHERE status = 'pending'
    ),
    'totals', (
      SELECT jsonb_build_object(
        'published_benefits', (SELECT count(*)::int FROM content_engine_generated_benefits WHERE status = 'published'),
        'published_questions', (SELECT count(*)::int FROM content_engine_generated_questions WHERE status = 'published'),
        'lesson_notes', (SELECT count(*)::int FROM content_engine_lesson_notes WHERE status = 'published'),
        'recommendations', (SELECT count(*)::int FROM content_engine_recommendations),
        'audit_entries', (SELECT count(*)::int FROM content_engine_publish_audit)
      )
    )
  ) INTO result;
  RETURN result;
END;
$$;
