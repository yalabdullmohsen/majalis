-- Content Production System v1 — Autonomous scheduling, staging, dedup, review, monitoring
-- Phase 4: autonomous content generation & publishing

-- ── Verified pipeline sources ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_pipeline_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('rss', 'sunnah', 'supabase', 'internal', 'web')),
  url text,
  pipeline text NOT NULL CHECK (pipeline IN (
    'questions', 'fawaid', 'hadith', 'rulings', 'stories', 'articles', 'all'
  )),
  active boolean NOT NULL DEFAULT true,
  trust_level smallint NOT NULL DEFAULT 85 CHECK (trust_level BETWEEN 0 AND 100),
  cursor jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_pipeline_sources_pipeline ON content_pipeline_sources(pipeline, active);

-- ── Scheduler jobs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_scheduler_jobs (
  id text PRIMARY KEY,
  name_ar text NOT NULL,
  interval_label text NOT NULL,
  cron_expr text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  last_success_at timestamptz,
  last_duration_ms int,
  last_status text CHECK (last_status IN ('success', 'failed', 'running', 'skipped')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Scheduler runs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_scheduler_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL REFERENCES content_scheduler_jobs(id),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'partial')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms int,
  items_processed int NOT NULL DEFAULT 0,
  items_published int NOT NULL DEFAULT 0,
  items_rejected int NOT NULL DEFAULT 0,
  items_duplicate int NOT NULL DEFAULT 0,
  error_message text,
  report jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_content_scheduler_runs_job ON content_scheduler_runs(job_id, started_at DESC);

-- ── Staging queue ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline text NOT NULL,
  source_slug text,
  source_url text NOT NULL,
  external_key text,
  title text,
  body text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash text NOT NULL,
  title_hash text,
  semantic_fingerprint text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'validated', 'duplicate', 'rejected', 'published', 'review'
  )),
  validation_errors jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pipeline, content_hash)
);

CREATE INDEX IF NOT EXISTS idx_content_staging_pipeline_status ON content_production_staging(pipeline, status, created_at);
CREATE INDEX IF NOT EXISTS idx_content_staging_source ON content_production_staging(source_url);

-- ── Review queue ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staging_id uuid REFERENCES content_production_staging(id) ON DELETE SET NULL,
  pipeline text NOT NULL,
  failure_stage text NOT NULL,
  failure_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_review_status ON content_production_review_queue(status, created_at DESC);

-- ── Dedup registry ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_dedup_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline text NOT NULL,
  content_hash text NOT NULL,
  title_hash text,
  source_url text,
  normalized_preview text,
  published_id text,
  embedding jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pipeline, content_hash)
);

CREATE INDEX IF NOT EXISTS idx_content_dedup_title ON content_dedup_registry(pipeline, title_hash);
CREATE INDEX IF NOT EXISTS idx_content_dedup_source ON content_dedup_registry(pipeline, source_url);

-- ── Published tracking ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_published (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline text NOT NULL,
  staging_id uuid REFERENCES content_production_staging(id) ON DELETE SET NULL,
  target_table text NOT NULL,
  target_id text NOT NULL,
  source_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_published_pipeline ON content_production_published(pipeline, published_at DESC);

-- ── Daily stats ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_daily_stats (
  stat_date date NOT NULL,
  pipeline text NOT NULL,
  produced int NOT NULL DEFAULT 0,
  published int NOT NULL DEFAULT 0,
  rejected int NOT NULL DEFAULT 0,
  duplicate int NOT NULL DEFAULT 0,
  PRIMARY KEY (stat_date, pipeline)
);

-- ── Retry queue ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_retry_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline text,
  job_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  last_error text,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_retry_status ON content_production_retry_queue(status, next_retry_at);

-- ── Dead letter queue ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_dead_letter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline text,
  job_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_dlq_created ON content_production_dead_letter(created_at DESC);

-- ── Execution logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES content_scheduler_runs(id) ON DELETE SET NULL,
  pipeline text,
  stage text NOT NULL,
  level text NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_ms int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_logs_run ON content_production_logs(run_id, created_at);
CREATE INDEX IF NOT EXISTS idx_content_logs_level ON content_production_logs(level, created_at DESC);

-- ── Health checks ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_health_name ON content_production_health(check_name, checked_at DESC);

-- ── Alerts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_production_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  pipeline text,
  acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_alerts_open ON content_production_alerts(acknowledged, created_at DESC);

-- ── Platform quiz questions (4 options, sourced) ───────────────────────────
CREATE TABLE IF NOT EXISTS platform_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index int NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  category text NOT NULL,
  topic text,
  difficulty text NOT NULL DEFAULT 'متوسط' CHECK (difficulty IN ('سهل', 'متوسط', 'صعب')),
  source_name text NOT NULL,
  source_url text,
  keywords text[] DEFAULT '{}',
  external_key text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'review')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (external_key)
);

CREATE INDEX IF NOT EXISTS idx_platform_quiz_status ON platform_quiz_questions(status, category);
CREATE INDEX IF NOT EXISTS idx_platform_quiz_keywords ON platform_quiz_questions USING gin(keywords);

-- ── Seed scheduler jobs ───────────────────────────────────────────────────────
INSERT INTO content_scheduler_jobs (id, name_ar, interval_label, cron_expr, config) VALUES
  ('source-check', 'فحص المصادر', 'كل ساعة', '0 * * * *', '{"description":"Check verified sources and ingest to staging"}'),
  ('content-update', 'تحديث المحتوى', 'كل ساعتين', '0 */2 * * *', '{"description":"Process staging through validation and publishing"}'),
  ('reindex', 'إعادة الفهرسة', 'كل 6 ساعات', '0 */6 * * *', '{"description":"Rebuild search indexes and sitemap flags"}'),
  ('daily-production', 'إنتاج محتوى جديد', 'يومي', '0 4 * * *', '{"description":"Run all pipelines to daily quotas"}'),
  ('quality-review', 'مراجعة الجودة', 'أسبوعي', '0 5 * * 0', '{"description":"Audit published content quality"}'),
  ('cleanup', 'تنظيف البيانات', 'شهري', '0 6 1 * *', '{"description":"Archive old logs and purge completed DLQ items"}')
ON CONFLICT (id) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  interval_label = EXCLUDED.interval_label,
  cron_expr = EXCLUDED.cron_expr,
  config = EXCLUDED.config,
  updated_at = now();

-- ── Seed verified sources (registry only — no fabricated content) ───────────────
INSERT INTO content_pipeline_sources (slug, name, source_type, url, pipeline, active, trust_level, metadata) VALUES
  ('sunnah-bukhari', 'صحيح البخاري — sunnah.com', 'sunnah', 'https://sunnah.com/bukhari', 'hadith', true, 98, '{"collection":"bukhari"}'),
  ('sunnah-muslim', 'صحيح مسلم — sunnah.com', 'sunnah', 'https://sunnah.com/muslim', 'hadith', true, 98, '{"collection":"muslim"}'),
  ('sunnah-nawawi40', 'الأربعون النووية — sunnah.com', 'sunnah', 'https://sunnah.com/nawawi40', 'hadith', true, 97, '{"collection":"nawawi40"}'),
  ('verified-hadith-db', 'مكتبة الأحاديث الموثقة', 'supabase', 'verified_hadith_items', 'hadith', true, 95, '{"table":"verified_hadith_items"}'),
  ('verified-qa-db', 'الأسئلة والأجوبة المنشورة', 'supabase', 'qa_questions', 'questions', true, 92, '{"table":"qa_questions"}'),
  ('verified-fawaid-db', 'الفوائد المعتمدة', 'supabase', 'fawaid', 'fawaid', true, 90, '{"table":"fawaid"}'),
  ('rulings-encyclopedia', 'موسوعة الأحكام', 'internal', 'sharia_rulings', 'rulings', true, 93, '{"generator":"rulings-encyclopedia"}'),
  ('surah-stories-seed', 'قصص السور', 'internal', 'surah-stories', 'stories', true, 92, '{"module":"surah-stories"}'),
  ('iifa-rss', 'المجمع الفقهي — RSS', 'rss', 'https://www.iifa-aifi.org/ar/feed', 'articles', true, 95, '{"category":"قرارات"}'),
  ('auto-content-rss', 'مقالات RSS المعتمدة', 'supabase', 'auto_imported_content', 'articles', true, 88, '{"table":"auto_imported_content"}')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  active = EXCLUDED.active,
  trust_level = EXCLUDED.trust_level,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- ── RLS (service role + admin) ────────────────────────────────────────────────
ALTER TABLE content_pipeline_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_scheduler_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_scheduler_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_production_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_production_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_dedup_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_production_published ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_production_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_production_retry_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_production_dead_letter ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_production_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_production_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_quiz_questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY content_production_service ON content_production_staging
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY platform_quiz_public_read ON platform_quiz_questions
    FOR SELECT USING (status = 'published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY platform_quiz_admin ON platform_quiz_questions
    FOR ALL USING (
      auth.jwt() ->> 'role' = 'service_role'
      OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE content_production_staging IS 'Phase 4 — staged content awaiting validation and publishing';
COMMENT ON TABLE content_scheduler_jobs IS 'Phase 4 — autonomous content scheduler registry';
