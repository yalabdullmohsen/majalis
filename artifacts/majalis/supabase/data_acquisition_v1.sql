-- Autonomous AI Data Acquisition Engine v1
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.da_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'rss', 'web', 'youtube_playlist', 'telegram', 'instagram', 'pdf',
    'csv', 'excel', 'json', 'google_drive', 'official', 'university', 'journal', 'mosque'
  )),
  country TEXT DEFAULT 'KW',
  category TEXT NOT NULL,
  content_types TEXT[] NOT NULL DEFAULT '{}',
  trust_score INTEGER NOT NULL DEFAULT 70 CHECK (trust_score >= 0 AND trust_score <= 100),
  publish_policy TEXT NOT NULL DEFAULT 'review' CHECK (publish_policy IN ('auto_safe', 'review', 'blocked')),
  requires_human_review BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled', 'error')),
  last_checked_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  items_extracted_total INTEGER NOT NULL DEFAULT 0,
  items_published_total INTEGER NOT NULL DEFAULT 0,
  fetch_interval_minutes INTEGER NOT NULL DEFAULT 60,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_da_sources_status ON public.da_sources(status);
CREATE INDEX IF NOT EXISTS idx_da_sources_type ON public.da_sources(source_type);

CREATE TABLE IF NOT EXISTS public.da_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.da_sources(id) ON DELETE SET NULL,
  external_id TEXT,
  source_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL,
  scholar_name TEXT,
  author_name TEXT,
  event_date DATE,
  event_day TEXT,
  event_time TEXT,
  time_period TEXT,
  location TEXT,
  mosque_name TEXT,
  region TEXT,
  governorate TEXT,
  country TEXT,
  organizer TEXT,
  stream_url TEXT,
  map_url TEXT,
  file_url TEXT,
  original_url TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'ar',
  quality_score INTEGER DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
  status TEXT NOT NULL DEFAULT 'extracted' CHECK (status IN (
    'extracted', 'review', 'published', 'rejected', 'duplicate', 'merged'
  )),
  title_hash TEXT,
  content_hash TEXT,
  normalized_title TEXT,
  needs_review BOOLEAN NOT NULL DEFAULT true,
  review_reasons TEXT[] DEFAULT '{}',
  conflict_flags TEXT[] DEFAULT '{}',
  attribution TEXT,
  pipeline_stage TEXT,
  published_at TIMESTAMPTZ,
  merged_into_id UUID REFERENCES public.da_items(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_da_items_status ON public.da_items(status);
CREATE INDEX IF NOT EXISTS idx_da_items_title_hash ON public.da_items(title_hash);
CREATE INDEX IF NOT EXISTS idx_da_items_content_hash ON public.da_items(content_hash);
CREATE INDEX IF NOT EXISTS idx_da_items_source ON public.da_items(source_id);

CREATE TABLE IF NOT EXISTS public.da_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL DEFAULT 'cron' CHECK (trigger_type IN ('cron', 'manual', 'admin')),
  run_mode TEXT NOT NULL DEFAULT 'hourly' CHECK (run_mode IN ('hourly', 'daily', 'weekly', 'source', 'retry')),
  source_id UUID REFERENCES public.da_sources(id),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  fetched INTEGER NOT NULL DEFAULT 0,
  extracted INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 0,
  duplicates INTEGER NOT NULL DEFAULT 0,
  rejected INTEGER NOT NULL DEFAULT 0,
  review_queued INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  error_log JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.da_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.da_items(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.da_merge_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kept_item_id UUID NOT NULL REFERENCES public.da_items(id),
  merged_item_id UUID,
  merge_reason TEXT NOT NULL,
  similarity_score NUMERIC(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.da_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
  source_id UUID REFERENCES public.da_sources(id),
  run_id UUID REFERENCES public.da_runs(id),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.da_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.da_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.da_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.da_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.da_merge_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.da_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "da_sources_admin" ON public.da_sources;
CREATE POLICY "da_sources_admin" ON public.da_sources FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "da_items_admin" ON public.da_items;
CREATE POLICY "da_items_admin" ON public.da_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "da_items_published_read" ON public.da_items;
CREATE POLICY "da_items_published_read" ON public.da_items FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "da_runs_admin" ON public.da_runs;
CREATE POLICY "da_runs_admin" ON public.da_runs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "da_review_admin" ON public.da_review_queue;
CREATE POLICY "da_review_admin" ON public.da_review_queue FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
