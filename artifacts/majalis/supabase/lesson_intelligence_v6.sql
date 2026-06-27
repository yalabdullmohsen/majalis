-- =====================================================================
--  Phase 6 — Unified Lesson Intelligence Engine
--  نفّذ بعد: automation_phase5_v1.sql + kuwait_instagram_sources_v2.sql
-- =====================================================================

-- Unified source registry (extends trusted_content_sources, does not replace)
CREATE TABLE IF NOT EXISTS lesson_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name     TEXT NOT NULL,
  source_type     TEXT NOT NULL DEFAULT 'website'
    CHECK (source_type IN (
      'instagram', 'x', 'facebook', 'telegram', 'whatsapp', 'youtube',
      'youtube_live', 'youtube_community', 'rss', 'website', 'wordpress',
      'ghost', 'drupal', 'blogger', 'google_calendar', 'ics', 'pdf',
      'image', 'png', 'jpg', 'jpeg', 'webp', 'manual'
    )),
  source_url      TEXT NOT NULL,
  platform        TEXT NOT NULL DEFAULT 'website',
  country         TEXT DEFAULT 'الكويت',
  city            TEXT,
  language        TEXT DEFAULT 'ar',
  trust_score     INTEGER NOT NULL DEFAULT 80 CHECK (trust_score BETWEEN 0 AND 100),
  active          BOOLEAN NOT NULL DEFAULT true,
  auto_publish    BOOLEAN NOT NULL DEFAULT false,
  scan_interval   INTEGER NOT NULL DEFAULT 15 CHECK (scan_interval BETWEEN 5 AND 1440),
  last_scan       TIMESTAMPTZ,
  next_scan       TIMESTAMPTZ,
  total_lessons   INTEGER NOT NULL DEFAULT 0,
  total_imported  INTEGER NOT NULL DEFAULT 0,
  last_success    TIMESTAMPTZ,
  last_error      TEXT,
  config          JSONB NOT NULL DEFAULT '{}',
  legacy_source_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lesson_sources_url_uidx ON lesson_sources (source_url);
CREATE INDEX IF NOT EXISTS lesson_sources_active_idx ON lesson_sources (active, next_scan);
CREATE INDEX IF NOT EXISTS lesson_sources_type_idx ON lesson_sources (source_type, trust_score DESC);

-- Intelligence run log (per scan cycle)
CREATE TABLE IF NOT EXISTS lesson_intelligence_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID REFERENCES lesson_sources(id) ON DELETE SET NULL,
  run_type        TEXT NOT NULL DEFAULT 'scan'
    CHECK (run_type IN ('scan', 'manual', 'reprocess', 'cron')),
  status          TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  items_discovered INTEGER NOT NULL DEFAULT 0,
  items_extracted  INTEGER NOT NULL DEFAULT 0,
  items_published  INTEGER NOT NULL DEFAULT 0,
  items_duplicate  INTEGER NOT NULL DEFAULT 0,
  items_pending    INTEGER NOT NULL DEFAULT 0,
  items_errors     INTEGER NOT NULL DEFAULT 0,
  avg_confidence   NUMERIC(5, 3),
  duration_ms      INTEGER,
  metadata         JSONB NOT NULL DEFAULT '{}',
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS lesson_intelligence_runs_source_idx
  ON lesson_intelligence_runs (source_id, started_at DESC);

-- Per-item extraction record
CREATE TABLE IF NOT EXISTS lesson_intelligence_extractions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID REFERENCES lesson_intelligence_runs(id) ON DELETE CASCADE,
  source_id       UUID REFERENCES lesson_sources(id) ON DELETE SET NULL,
  source_url      TEXT NOT NULL,
  extractor       TEXT NOT NULL,
  parsed_payload  JSONB NOT NULL DEFAULT '{}',
  confidence_score NUMERIC(5, 3),
  trust_score     INTEGER,
  image_hash      TEXT,
  perceptual_hash TEXT,
  duplicate_score NUMERIC(5, 3),
  is_duplicate    BOOLEAN NOT NULL DEFAULT false,
  decision        TEXT
    CHECK (decision IN ('published', 'pending_review', 'duplicate', 'error', 'skipped')),
  lesson_id       UUID REFERENCES lessons(id) ON DELETE SET NULL,
  draft_id        UUID REFERENCES lesson_import_drafts(id) ON DELETE SET NULL,
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_intelligence_extractions_run_idx
  ON lesson_intelligence_extractions (run_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lesson_intelligence_extractions_source_idx
  ON lesson_intelligence_extractions (source_id, created_at DESC);

-- Confidence stored on lessons
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS intelligence_confidence NUMERIC(5, 3),
  ADD COLUMN IF NOT EXISTS intelligence_trust_score INTEGER,
  ADD COLUMN IF NOT EXISTS lesson_source_id UUID REFERENCES lesson_sources(id) ON DELETE SET NULL;

-- Migrate existing trusted_content_sources → lesson_sources
INSERT INTO lesson_sources (
  source_name, source_type, source_url, platform, country, city, language,
  trust_score, active, auto_publish, scan_interval, config, legacy_source_id,
  last_scan, last_success, last_error, created_at, updated_at
)
SELECT
  tcs.name,
  CASE
    WHEN tcs.source_type IN (
      'instagram','x','facebook','telegram','whatsapp','youtube',
      'youtube_live','youtube_community','rss','website','wordpress',
      'ghost','drupal','blogger','google_calendar','ics','pdf',
      'image','png','jpg','jpeg','webp','manual'
    ) THEN tcs.source_type
    WHEN tcs.platform = 'instagram' THEN 'instagram'
    WHEN tcs.source_type = 'mosque' THEN 'instagram'
    WHEN tcs.source_type = 'scholarly' THEN 'instagram'
    WHEN tcs.source_type = 'association' THEN 'instagram'
    ELSE 'website'
  END,
  tcs.url,
  COALESCE(tcs.platform, tcs.source_type, 'website'),
  COALESCE(tcs.country, 'الكويت'),
  COALESCE(tcs.config->>'city', NULL),
  COALESCE(tcs.language, 'ar'),
  COALESCE(tcs.trust_score, 80),
  tcs.active,
  tcs.auto_publish_allowed,
  15,
  tcs.config || jsonb_build_object(
    'rss_url', tcs.rss_url,
    'instagram_username', tcs.instagram_username,
    'website_url', tcs.website
  ),
  tcs.id,
  tcs.last_checked_at,
  tcs.last_success_at,
  tcs.last_error,
  tcs.created_at,
  now()
FROM trusted_content_sources tcs
WHERE NOT EXISTS (
  SELECT 1 FROM lesson_sources ls WHERE ls.source_url = tcs.url
);

-- Sync Kuwait Instagram sources from legacy table if content table empty
INSERT INTO lesson_sources (
  source_name, source_type, source_url, platform, country, city, language,
  trust_score, active, auto_publish, scan_interval, config, legacy_source_id
)
SELECT
  tls.name, 'instagram', tls.url, 'instagram', tls.country, tls.city, 'ar',
  CASE tls.trust_level WHEN 'official' THEN 100 WHEN 'trusted' THEN 98 ELSE 80 END,
  tls.active, tls.auto_publish_allowed, 15, tls.config, tls.id
FROM trusted_lesson_sources tls
WHERE tls.platform = 'instagram'
  AND NOT EXISTS (SELECT 1 FROM lesson_sources ls WHERE ls.source_url = tls.url);

ALTER TABLE lesson_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_intelligence_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_intelligence_extractions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lesson_sources_admin ON lesson_sources;
CREATE POLICY lesson_sources_admin ON lesson_sources
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS lesson_intelligence_runs_admin ON lesson_intelligence_runs;
CREATE POLICY lesson_intelligence_runs_admin ON lesson_intelligence_runs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS lesson_intelligence_extractions_admin ON lesson_intelligence_extractions;
CREATE POLICY lesson_intelligence_extractions_admin ON lesson_intelligence_extractions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

COMMENT ON TABLE lesson_sources IS 'Phase 6 — Unified source registry for Lesson Intelligence Engine';
COMMENT ON TABLE lesson_intelligence_runs IS 'Phase 6 — Intelligence scan run log';
COMMENT ON TABLE lesson_intelligence_extractions IS 'Phase 6 — Per-item extraction + dedup + publish decision';
