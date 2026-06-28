-- Autonomous Daily Question Generation Engine for سؤال وجواب
-- Extends sin_jeem_questions + pipeline tracking tables

ALTER TABLE public.sin_jeem_questions
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_reference text,
  ADD COLUMN IF NOT EXISTS ai_confidence numeric(5,4),
  ADD COLUMN IF NOT EXISTS generation_job_id uuid,
  ADD COLUMN IF NOT EXISTS pipeline_status text DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS embedding jsonb;

CREATE INDEX IF NOT EXISTS idx_sin_jeem_questions_pipeline_status
  ON public.sin_jeem_questions(pipeline_status);

CREATE INDEX IF NOT EXISTS idx_sin_jeem_questions_generation_job
  ON public.sin_jeem_questions(generation_job_id)
  WHERE generation_job_id IS NOT NULL;

INSERT INTO public.sin_jeem_categories (slug, name_ar, name_en, icon, sort_order, is_active)
VALUES
  ('names-attributes', 'أسماء الله الحسنى', 'Names of Allah', '✨', 41, true),
  ('adab', 'الآداب الإسلامية', 'Islamic Etiquette', '🤝', 42, true),
  ('akhlaq', 'الأخلاق', 'Islamic Ethics', '💎', 43, true),
  ('islamic-culture', 'الثقافة الإسلامية', 'Islamic Culture', '🌍', 44, true)
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  is_active = true;

CREATE TABLE IF NOT EXISTS public.question_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_key date NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  target_count integer NOT NULL DEFAULT 50,
  generated_count integer NOT NULL DEFAULT 0,
  approved_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  duplicate_count integer NOT NULL DEFAULT 0,
  resume_cursor integer NOT NULL DEFAULT 0,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_qgen_jobs_day_key
  ON public.question_generation_jobs(day_key);

CREATE INDEX IF NOT EXISTS idx_qgen_jobs_status
  ON public.question_generation_jobs(status);

CREATE TABLE IF NOT EXISTS public.question_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.question_generation_jobs(id) ON DELETE CASCADE,
  question_id uuid,
  category_slug text,
  stage text NOT NULL,
  status text,
  message text,
  payload jsonb DEFAULT '{}'::jsonb,
  confidence numeric(5,4),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qgen_logs_job
  ON public.question_generation_logs(job_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.question_generation_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_key date NOT NULL,
  total_generated integer NOT NULL DEFAULT 0,
  total_approved integer NOT NULL DEFAULT 0,
  total_rejected integer NOT NULL DEFAULT 0,
  total_duplicates integer NOT NULL DEFAULT 0,
  avg_confidence numeric(5,4),
  duplicate_rate numeric(5,4),
  category_distribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  execution_ms integer,
  db_total_questions integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_qgen_metrics_day_key
  ON public.question_generation_metrics(day_key);

CREATE TABLE IF NOT EXISTS public.question_generation_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.question_generation_jobs(id) ON DELETE CASCADE,
  category_slug text,
  reason_code text NOT NULL,
  reason_detail text,
  candidate jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qgen_failures_job
  ON public.question_generation_failures(job_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.daily_generation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.question_generation_jobs(id) ON DELETE SET NULL,
  day_key date NOT NULL,
  generated integer NOT NULL DEFAULT 0,
  approved integer NOT NULL DEFAULT 0,
  rejected integer NOT NULL DEFAULT 0,
  duplicates integer NOT NULL DEFAULT 0,
  categories jsonb NOT NULL DEFAULT '{}'::jsonb,
  avg_confidence numeric(5,4),
  execution_ms integer,
  db_total integer,
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_gen_reports_day_key
  ON public.daily_generation_reports(day_key);

ALTER TABLE public.question_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_generation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_generation_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_generation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qgen_jobs_service" ON public.question_generation_jobs;
CREATE POLICY "qgen_jobs_service" ON public.question_generation_jobs
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "qgen_logs_service" ON public.question_generation_logs;
CREATE POLICY "qgen_logs_service" ON public.question_generation_logs
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "qgen_metrics_service" ON public.question_generation_metrics;
CREATE POLICY "qgen_metrics_service" ON public.question_generation_metrics
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "qgen_failures_service" ON public.question_generation_failures;
CREATE POLICY "qgen_failures_service" ON public.question_generation_failures
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "qgen_reports_service" ON public.daily_generation_reports;
CREATE POLICY "qgen_reports_service" ON public.daily_generation_reports
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "qgen_reports_admin_read" ON public.daily_generation_reports;
CREATE POLICY "qgen_reports_admin_read" ON public.daily_generation_reports
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "qgen_jobs_admin_read" ON public.question_generation_jobs;
CREATE POLICY "qgen_jobs_admin_read" ON public.question_generation_jobs
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "qgen_failures_admin_read" ON public.question_generation_failures;
CREATE POLICY "qgen_failures_admin_read" ON public.question_generation_failures
  FOR SELECT USING (auth.role() = 'authenticated');
