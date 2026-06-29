-- GKE Phase 2 — Trusted Source Registry, Reputation, Shadow Mode, Metrics
-- Single SSOT for production data acquisition (no example.com fixtures).

CREATE TABLE IF NOT EXISTS gke_trusted_sources (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  category_type         TEXT NOT NULL DEFAULT 'rss'
    CHECK (category_type IN (
      'government', 'awqaf_ministry', 'university', 'sheikh_official',
      'islamic_center', 'scientific_journal', 'university_site',
      'rss', 'youtube_official', 'telegram_official', 'website'
    )),
  source_type           TEXT NOT NULL DEFAULT 'rss',
  source_url            TEXT NOT NULL,
  feed_url              TEXT,
  official_site         TEXT,
  country               TEXT NOT NULL DEFAULT 'KW',
  language              TEXT NOT NULL DEFAULT 'ar',
  trust_score           SMALLINT NOT NULL DEFAULT 70 CHECK (trust_score BETWEEN 0 AND 100),
  reputation_score      SMALLINT NOT NULL DEFAULT 70 CHECK (reputation_score BETWEEN 0 AND 100),
  content_types         TEXT[] NOT NULL DEFAULT ARRAY['lesson'],
  refresh_interval_hours INT NOT NULL DEFAULT 24,
  publish_policy        TEXT NOT NULL DEFAULT 'shadow'
    CHECK (publish_policy IN ('shadow', 'review', 'auto')),
  is_active             BOOLEAN NOT NULL DEFAULT true,
  is_official           BOOLEAN NOT NULL DEFAULT true,
  last_sync_at          TIMESTAMPTZ,
  last_success_at       TIMESTAMPTZ,
  last_error            TEXT,
  items_imported        INTEGER NOT NULL DEFAULT 0,
  items_accepted        INTEGER NOT NULL DEFAULT 0,
  items_rejected        INTEGER NOT NULL DEFAULT 0,
  items_duplicate       INTEGER NOT NULL DEFAULT 0,
  avg_processing_ms     INTEGER,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gke_source_reputation_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID NOT NULL REFERENCES gke_trusted_sources(id) ON DELETE CASCADE,
  previous_score  SMALLINT NOT NULL,
  new_score       SMALLINT NOT NULL,
  delta           SMALLINT NOT NULL,
  reason          TEXT NOT NULL,
  signals         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gke_shadow_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID REFERENCES gke_trusted_sources(id) ON DELETE SET NULL,
  external_key    TEXT NOT NULL,
  content_kind    TEXT NOT NULL DEFAULT 'lesson',
  title           TEXT NOT NULL,
  body            TEXT,
  summary         TEXT,
  category        TEXT,
  quality_score   SMALLINT,
  is_duplicate    BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'accepted', 'rejected', 'duplicate')),
  rejection_reason TEXT,
  source_url      TEXT,
  raw_payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  processing_ms   INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (external_key)
);

CREATE TABLE IF NOT EXISTS gke_acquisition_metrics (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  period                TEXT NOT NULL DEFAULT 'daily' CHECK (period IN ('daily', 'weekly')),
  source_id             UUID REFERENCES gke_trusted_sources(id) ON DELETE SET NULL,
  success_rate          NUMERIC(5,2),
  duplicate_rate        NUMERIC(5,2),
  validation_rate       NUMERIC(5,2),
  avg_processing_ms     INTEGER,
  source_reliability    NUMERIC(5,2),
  queue_size            INTEGER NOT NULL DEFAULT 0,
  items_fetched         INTEGER NOT NULL DEFAULT 0,
  items_accepted        INTEGER NOT NULL DEFAULT 0,
  items_rejected        INTEGER NOT NULL DEFAULT 0,
  items_duplicate       INTEGER NOT NULL DEFAULT 0,
  error_count           INTEGER NOT NULL DEFAULT 0,
  payload               JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (metric_date, period, source_id)
);

CREATE TABLE IF NOT EXISTS gke_integration_phases (
  phase_order   SMALLINT PRIMARY KEY,
  content_kind  TEXT NOT NULL UNIQUE,
  label_ar      TEXT NOT NULL,
  enabled       BOOLEAN NOT NULL DEFAULT false,
  shadow_only   BOOLEAN NOT NULL DEFAULT true,
  enabled_at    TIMESTAMPTZ,
  notes         TEXT
);

INSERT INTO gke_integration_phases (phase_order, content_kind, label_ar, enabled, shadow_only) VALUES
  (1, 'lesson', 'الدروس', true, true),
  (2, 'circle', 'الحلقات', false, true),
  (3, 'course', 'الفرص العلمية', false, true),
  (4, 'calendar', 'التقويم', false, true),
  (5, 'library', 'الكتب', false, true),
  (6, 'article', 'المقالات', false, true),
  (7, 'research', 'الأبحاث', false, true)
ON CONFLICT (content_kind) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_gke_sources_category ON gke_trusted_sources (category_type, is_active);
CREATE INDEX IF NOT EXISTS idx_gke_sources_reputation ON gke_trusted_sources (reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_gke_shadow_status ON gke_shadow_items (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gke_shadow_source ON gke_shadow_items (source_id);
CREATE INDEX IF NOT EXISTS idx_gke_metrics_date ON gke_acquisition_metrics (metric_date DESC, period);

ALTER TABLE gke_trusted_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE gke_shadow_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gke_sources_admin ON gke_trusted_sources;
CREATE POLICY gke_sources_admin ON gke_trusted_sources FOR ALL USING (true);

DROP POLICY IF EXISTS gke_shadow_admin ON gke_shadow_items;
CREATE POLICY gke_shadow_admin ON gke_shadow_items FOR ALL USING (true);

COMMENT ON TABLE gke_trusted_sources IS 'GKE unified trusted source registry — production URLs only';
COMMENT ON COLUMN gke_trusted_sources.publish_policy IS 'shadow = no auto-publish; review = human gate; auto = disabled until production criteria met';
