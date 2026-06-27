-- =====================================================================
--  Smart CMS v5 — مسودات ذكية + سجل مراجعات + مصادر مراقبة
--  نفّذ بعد: cms_platform_v4.sql (enums inlined below for bootstrap)
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE cms_content_kind AS ENUM (
    'lesson', 'lecture', 'course', 'sheikh', 'book', 'fatwa', 'article',
    'news', 'announcement', 'fawaid', 'qa', 'miracle',
    'fiqh_decision', 'sharia_ruling', 'annual_course'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cms_workflow_status AS ENUM (
    'draft', 'pending', 'approved', 'published', 'archived', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS content_drafts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_kind      cms_content_kind NOT NULL DEFAULT 'lesson',
  source_type       TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('manual', 'image', 'url', 'rss', 'ocr', 'cron')),
  source_url        TEXT,
  image_url         TEXT,
  raw_text          TEXT,
  extracted_data    JSONB NOT NULL DEFAULT '{}',
  ai_suggestions    JSONB NOT NULL DEFAULT '{}',
  validation_errors JSONB NOT NULL DEFAULT '[]',
  validation_warnings JSONB NOT NULL DEFAULT '[]',
  matched_sheikh_id UUID REFERENCES sheikhs(id) ON DELETE SET NULL,
  proposed_sheikh   JSONB,
  workflow_status   cms_workflow_status NOT NULL DEFAULT 'pending',
  target_table      TEXT,
  target_record_id  UUID,
  created_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_drafts_status_idx ON content_drafts (workflow_status, created_at DESC);
CREATE INDEX IF NOT EXISTS content_drafts_kind_idx ON content_drafts (content_kind);
CREATE INDEX IF NOT EXISTS content_drafts_source_idx ON content_drafts (source_type);

CREATE TABLE IF NOT EXISTS content_revision_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name    TEXT NOT NULL,
  record_id     UUID NOT NULL,
  field_name    TEXT NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  changed_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  draft_id      UUID REFERENCES content_drafts(id) ON DELETE SET NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_revision_log_record_idx
  ON content_revision_log (table_name, record_id, changed_at DESC);

-- Extend admin_audit_logs with old/new snapshots when missing
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_audit_logs'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'table_name'
    ) THEN
      ALTER TABLE admin_audit_logs ADD COLUMN table_name TEXT NOT NULL DEFAULT 'unknown';
    END IF;
    ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS old_values JSONB;
    ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS new_values JSONB;
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Trusted monitoring sources (Phase 3 table — skip if not deployed yet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'trusted_content_sources'
  ) THEN
    INSERT INTO trusted_content_sources (name, source_type, platform, url, config, active)
    VALUES
      ('Instagram — دروس الكويت', 'api', 'instagram', 'https://www.instagram.com', '{"platform":"instagram"}'::jsonb, false),
      ('YouTube — قنوات علمية', 'rss', 'youtube', 'https://www.youtube.com', '{"platform":"youtube"}'::jsonb, false),
      ('Telegram — قنوات علمية', 'api', 'telegram', 'https://t.me', '{"platform":"telegram"}'::jsonb, false),
      ('مواقع المساجد الرسمية', 'rss', 'website', 'https://example.com/mosques', '{"platform":"website"}'::jsonb, false)
    ON CONFLICT DO NOTHING;
  END IF;
EXCEPTION WHEN undefined_column OR undefined_table OR unique_violation THEN NULL;
END $$;

-- RLS
ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_revision_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_drafts_admin_all ON content_drafts;
CREATE POLICY content_drafts_admin_all ON content_drafts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS content_revision_log_admin_read ON content_revision_log;
CREATE POLICY content_revision_log_admin_read ON content_revision_log
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS content_revision_log_admin_write ON content_revision_log;
CREATE POLICY content_revision_log_admin_write ON content_revision_log
  FOR INSERT WITH CHECK (is_admin());

COMMENT ON TABLE content_drafts IS 'مسودات محتوى مستخرجة بالذكاء الاصطناعي — بانتظار المراجعة';
COMMENT ON TABLE content_revision_log IS 'سجل تفصيلي للتغييرات — من عدّل وماذا ومتى';
