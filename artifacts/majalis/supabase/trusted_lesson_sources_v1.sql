-- =====================================================================
--  Phase 4 — Auto-Publish from trusted lesson sources (Kuwait)
--  نفّذ بعد: lesson_import_drafts_v1.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS trusted_lesson_sources (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  platform              TEXT NOT NULL,
  url                   TEXT NOT NULL,
  source_type           TEXT NOT NULL DEFAULT 'website'
    CHECK (source_type IN ('instagram', 'website', 'rss', 'telegram', 'youtube', 'x', 'manual')),
  trust_level           TEXT NOT NULL DEFAULT 'unknown'
    CHECK (trust_level IN ('official', 'trusted', 'community', 'unknown')),
  auto_publish_allowed  BOOLEAN NOT NULL DEFAULT false,
  country               TEXT DEFAULT 'الكويت',
  city                  TEXT,
  category              TEXT,
  active                BOOLEAN NOT NULL DEFAULT true,
  feed_url              TEXT,
  last_checked_at       TIMESTAMPTZ,
  last_success_at       TIMESTAMPTZ,
  failure_count         INTEGER NOT NULL DEFAULT 0,
  last_error            TEXT,
  config                JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trusted_lesson_sources_active_idx
  ON trusted_lesson_sources (active, trust_level);
CREATE UNIQUE INDEX IF NOT EXISTS trusted_lesson_sources_url_uidx
  ON trusted_lesson_sources (url);

CREATE TABLE IF NOT EXISTS lesson_automation_audit (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id         UUID REFERENCES trusted_lesson_sources(id) ON DELETE SET NULL,
  source_url        TEXT NOT NULL,
  extracted_text    TEXT,
  parsed_payload    JSONB NOT NULL DEFAULT '{}',
  confidence_score  NUMERIC(5, 3),
  decision          TEXT NOT NULL
    CHECK (decision IN ('approved', 'pending_review', 'rejected', 'duplicate')),
  reason            TEXT,
  lesson_id         UUID REFERENCES lessons(id) ON DELETE SET NULL,
  draft_id          UUID REFERENCES lesson_import_drafts(id) ON DELETE SET NULL,
  image_hash        TEXT,
  similarity_score  NUMERIC(5, 3),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_automation_audit_source_idx
  ON lesson_automation_audit (source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lesson_automation_audit_decision_idx
  ON lesson_automation_audit (decision, created_at DESC);

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES trusted_lesson_sources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5, 3),
  ADD COLUMN IF NOT EXISTS imported_by TEXT,
  ADD COLUMN IF NOT EXISTS poster_image_hash TEXT;

ALTER TABLE lesson_import_drafts
  ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES trusted_lesson_sources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS automation_status TEXT DEFAULT 'manual'
    CHECK (automation_status IN ('manual', 'auto_published', 'pending_review', 'rejected', 'duplicate')),
  ADD COLUMN IF NOT EXISTS decision_reason TEXT,
  ADD COLUMN IF NOT EXISTS image_hash TEXT;

-- Seed trusted Kuwait sources (inactive until verified URLs configured)
INSERT INTO trusted_lesson_sources (name, platform, url, source_type, trust_level, auto_publish_allowed, country, city, category, active, feed_url)
VALUES
  ('وزارة الأوقاف — مساجد الكويت', 'website', 'https://www.awqaf.gov.kw', 'website', 'official', true, 'الكويت', 'العاصمة', 'دروس', false, null),
  ('جمعية إحياء التراث الإسلامي', 'website', 'https://www.iico.org', 'website', 'official', true, 'الكويت', 'العاصمة', 'دروس', false, null),
  ('مركز صالح الشيحي', 'instagram', 'https://www.instagram.com', 'instagram', 'trusted', false, 'الكويت', 'العاصمة', 'دروس', false, null),
  ('دروس علمية — RSS تجريبي', 'rss', 'https://majlisilm.com/feed.xml', 'rss', 'trusted', true, 'الكويت', null, 'دروس', false, 'https://majlisilm.com/feed.xml'),
  ('قناة دروس — YouTube', 'youtube', 'https://www.youtube.com', 'youtube', 'trusted', false, 'الكويت', null, 'دروس', false, null),
  ('مجتمع — مصدر تجريبي', 'telegram', 'https://t.me', 'telegram', 'community', false, 'الكويت', null, 'دروس', false, null)
ON CONFLICT (url) DO NOTHING;

ALTER TABLE trusted_lesson_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_automation_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trusted_lesson_sources_admin_all ON trusted_lesson_sources;
CREATE POLICY trusted_lesson_sources_admin_all ON trusted_lesson_sources
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS lesson_automation_audit_admin_all ON lesson_automation_audit;
CREATE POLICY lesson_automation_audit_admin_all ON lesson_automation_audit
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

COMMENT ON TABLE trusted_lesson_sources IS 'مصادر دروس معتمدة — مراقبة تلقائية وAuto-Publish';
COMMENT ON TABLE lesson_automation_audit IS 'سجل قرارات الأتمتة — approved | pending_review | rejected | duplicate';
