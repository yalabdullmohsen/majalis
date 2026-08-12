-- =====================================================================
--  Lesson Import Drafts — مسودات استيراد الدروس من صورة/رابط
--  نفّذ بعد: smart_cms_v5.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS lesson_import_drafts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type         TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('image', 'url', 'manual')),
  source_url          TEXT,
  image_url           TEXT,
  extracted_text      TEXT,
  parsed_payload      JSONB NOT NULL DEFAULT '{}',
  confidence_score    NUMERIC(5, 3),
  status              TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'needs_review', 'approved', 'rejected')),
  warnings            JSONB NOT NULL DEFAULT '[]',
  missing_fields      JSONB NOT NULL DEFAULT '[]',
  matched_sheikh_id   UUID REFERENCES sheikhs(id) ON DELETE SET NULL,
  suggested_sheikh    JSONB,
  notes               TEXT,
  created_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_lesson_id  UUID REFERENCES lessons(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_import_drafts_status_idx
  ON lesson_import_drafts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS lesson_import_drafts_creator_idx
  ON lesson_import_drafts (created_by, created_at DESC);

-- Extra lesson columns for imported metadata
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS organizer TEXT,
  ADD COLUMN IF NOT EXISTS cooperative_org TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE sheikhs
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS needs_verification BOOLEAN DEFAULT false;

-- Supabase Storage bucket for lesson poster images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-posters',
  'lesson-posters',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS lesson_posters_public_read ON storage.objects;
CREATE POLICY lesson_posters_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'lesson-posters');

DROP POLICY IF EXISTS lesson_posters_admin_insert ON storage.objects;
CREATE POLICY lesson_posters_admin_insert ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'lesson-posters' AND is_admin());

DROP POLICY IF EXISTS lesson_posters_admin_update ON storage.objects;
CREATE POLICY lesson_posters_admin_update ON storage.objects
  FOR UPDATE USING (bucket_id = 'lesson-posters' AND is_admin());

DROP POLICY IF EXISTS lesson_posters_admin_delete ON storage.objects;
CREATE POLICY lesson_posters_admin_delete ON storage.objects
  FOR DELETE USING (bucket_id = 'lesson-posters' AND is_admin());

ALTER TABLE lesson_import_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lesson_import_drafts_admin_all ON lesson_import_drafts;
CREATE POLICY lesson_import_drafts_admin_all ON lesson_import_drafts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

COMMENT ON TABLE lesson_import_drafts IS 'مسودات استيراد الدروس — صورة/رابط — بانتظار مراجعة المشرف';
