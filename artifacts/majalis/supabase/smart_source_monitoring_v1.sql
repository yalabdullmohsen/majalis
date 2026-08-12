-- =====================================================================
--  Phase 3 — Smart Source Monitoring & Auto Draft Pipeline
--  نفّذ بعد: trusted_lesson_sources_v1.sql + lesson_import_drafts_v1.sql
-- =====================================================================

-- ── trusted_content_sources (مركز المصادر الموثوقة) ─────────────────────
CREATE TABLE IF NOT EXISTS trusted_content_sources (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  source_type         TEXT NOT NULL DEFAULT 'website'
    CHECK (source_type IN (
      'website', 'rss', 'youtube', 'telegram', 'instagram', 'x',
      'mosque', 'ministry', 'association', 'scholarly', 'manual'
    )),
  platform            TEXT NOT NULL DEFAULT 'website',
  url                 TEXT NOT NULL,
  rss_url             TEXT,
  instagram_username  TEXT,
  youtube_channel_id  TEXT,
  telegram_channel    TEXT,
  website             TEXT,
  priority            INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  trust_score         INTEGER NOT NULL DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
  category            TEXT,
  country             TEXT DEFAULT 'الكويت',
  language            TEXT DEFAULT 'ar',
  active              BOOLEAN NOT NULL DEFAULT true,
  auto_publish_allowed BOOLEAN NOT NULL DEFAULT false,
  last_checked_at     TIMESTAMPTZ,
  last_success_at     TIMESTAMPTZ,
  failure_count       INTEGER NOT NULL DEFAULT 0,
  last_error          TEXT,
  config              JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS trusted_content_sources_url_uidx
  ON trusted_content_sources (url);
CREATE INDEX IF NOT EXISTS trusted_content_sources_active_idx
  ON trusted_content_sources (active, priority DESC);

-- Migrate from trusted_lesson_sources (preserve IDs for source_id FKs)
INSERT INTO trusted_content_sources (
  id, name, source_type, platform, url, rss_url,
  instagram_username, website, priority, trust_score,
  category, country, language, active, auto_publish_allowed,
  last_checked_at, last_success_at, failure_count, last_error, config,
  created_at, updated_at
)
SELECT
  tls.id,
  tls.name,
  CASE
    WHEN tls.source_type IN ('website','rss','youtube','telegram','instagram','x','manual') THEN tls.source_type
    WHEN tls.config->>'source_subtype' LIKE '%mosque%' THEN 'mosque'
    WHEN tls.config->>'source_subtype' LIKE '%scholar%' THEN 'scholarly'
    WHEN tls.config->>'source_subtype' LIKE '%course%' THEN 'association'
    ELSE 'website'
  END,
  tls.platform,
  tls.url,
  tls.feed_url,
  COALESCE(tls.config->>'handle', NULL),
  COALESCE(tls.config->>'website_url', NULL),
  COALESCE((tls.config->>'priority')::int, 5),
  CASE tls.trust_level
    WHEN 'official' THEN 100
    WHEN 'trusted' THEN 80
    WHEN 'community' THEN 50
    ELSE 30
  END,
  tls.category,
  tls.country,
  COALESCE(tls.config->>'language', 'ar'),
  tls.active,
  tls.auto_publish_allowed,
  tls.last_checked_at,
  tls.last_success_at,
  tls.failure_count,
  tls.last_error,
  tls.config,
  tls.created_at,
  tls.updated_at
FROM trusted_lesson_sources tls
ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  source_type = EXCLUDED.source_type,
  platform = EXCLUDED.platform,
  trust_score = EXCLUDED.trust_score,
  active = EXCLUDED.active,
  config = EXCLUDED.config,
  updated_at = now();

-- ── automation_runs (سجل عمليات المراقبة) ─────────────────────────────
CREATE TABLE IF NOT EXISTS automation_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type          TEXT NOT NULL DEFAULT 'source_monitor'
    CHECK (run_type IN ('source_monitor', 'manual_trigger', 're_analyze')),
  source_id         UUID REFERENCES trusted_content_sources(id) ON DELETE SET NULL,
  items_scanned     INTEGER NOT NULL DEFAULT 0,
  items_new         INTEGER NOT NULL DEFAULT 0,
  items_duplicate   INTEGER NOT NULL DEFAULT 0,
  items_skipped     INTEGER NOT NULL DEFAULT 0,
  items_errors      INTEGER NOT NULL DEFAULT 0,
  duration_ms       INTEGER,
  status            TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('running', 'completed', 'failed')),
  error_message     TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}',
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS automation_runs_started_idx
  ON automation_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS automation_runs_type_idx
  ON automation_runs (run_type, started_at DESC);

-- Track processed URLs per source (avoid re-import)
ALTER TABLE trusted_content_sources
  ADD COLUMN IF NOT EXISTS last_seen_urls JSONB NOT NULL DEFAULT '[]';

-- RLS
ALTER TABLE trusted_content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trusted_content_sources_admin_all ON trusted_content_sources;
CREATE POLICY trusted_content_sources_admin_all ON trusted_content_sources
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS automation_runs_admin_all ON automation_runs;
CREATE POLICY automation_runs_admin_all ON automation_runs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

COMMENT ON TABLE trusted_content_sources IS 'Phase 3 — مصادر محتوى موثوقة للمراقبة الذكية';
COMMENT ON TABLE automation_runs IS 'Phase 3 — سجل تشغيلات مراقبة المصادر';
