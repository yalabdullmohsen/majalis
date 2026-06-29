-- اللجنة الدائمة للبحوث العلمية والإفتاء — official fatwa reference
-- Apply in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS permanent_committee_fatwas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key      TEXT UNIQUE,
  fatwa_number      TEXT,
  title             TEXT NOT NULL,
  question          TEXT NOT NULL,
  answer            TEXT NOT NULL,
  summary           TEXT,
  category          TEXT NOT NULL DEFAULT 'فقه عام',
  subcategory       TEXT,
  keywords          TEXT[] NOT NULL DEFAULT '{}',
  reference         TEXT,
  source_url        TEXT,
  source_name       TEXT NOT NULL DEFAULT 'اللجنة الدائمة للبحوث العلمية والإفتاء',
  issued_at         TIMESTAMPTZ,
  status            content_status NOT NULL DEFAULT 'approved',
  view_count        INTEGER NOT NULL DEFAULT 0,
  search_count      INTEGER NOT NULL DEFAULT 0,
  linked_lesson_ids UUID[] NOT NULL DEFAULT '{}',
  linked_book_ids   UUID[] NOT NULL DEFAULT '{}',
  linked_research_ids UUID[] NOT NULL DEFAULT '{}',
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  search_vector     TSVECTOR,
  published_at      TIMESTAMPTZ,
  archived_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permanent_committee_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  parent_slug TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 100,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permanent_committee_import_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key TEXT,
  action       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending_review',
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION permanent_committee_fatwa_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.question, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.answer, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.category, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.keywords, ' '), '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.fatwa_number, '')), 'A');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pc_fatwa_search_vector ON permanent_committee_fatwas;
CREATE TRIGGER trg_pc_fatwa_search_vector
  BEFORE INSERT OR UPDATE ON permanent_committee_fatwas
  FOR EACH ROW EXECUTE FUNCTION permanent_committee_fatwa_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_pc_fatwas_category ON permanent_committee_fatwas (category, status);
CREATE INDEX IF NOT EXISTS idx_pc_fatwas_status ON permanent_committee_fatwas (status) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pc_fatwas_search ON permanent_committee_fatwas USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_pc_fatwas_number ON permanent_committee_fatwas (fatwa_number) WHERE fatwa_number IS NOT NULL;

ALTER TABLE permanent_committee_fatwas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pc_fatwas_public_read ON permanent_committee_fatwas;
CREATE POLICY pc_fatwas_public_read ON permanent_committee_fatwas
  FOR SELECT USING (status = 'approved' AND archived_at IS NULL);

COMMENT ON TABLE permanent_committee_fatwas IS 'Official Permanent Committee fatwas — original text preserved';
COMMENT ON COLUMN permanent_committee_fatwas.answer IS 'Immutable official answer text from alifta.gov.sa';

-- Seed main categories
INSERT INTO permanent_committee_categories (slug, name, parent_slug, sort_order) VALUES
  ('aqeedah', 'العقيدة', NULL, 1),
  ('tawheed', 'التوحيد', 'aqeedah', 2),
  ('quran', 'القرآن وعلومه', NULL, 3),
  ('tafsir', 'التفسير', 'quran', 4),
  ('hadith', 'الحديث', NULL, 5),
  ('fiqh', 'الفقه', NULL, 6),
  ('ibadat', 'العبادات', 'fiqh', 7),
  ('muamalat', 'المعاملات', 'fiqh', 8),
  ('family', 'الأسرة', NULL, 9),
  ('nawazil', 'النوازل', NULL, 10),
  ('dawah', 'الدعوة', NULL, 11),
  ('akhlaq', 'الأخلاق', NULL, 12),
  ('adab', 'الآداب', NULL, 13),
  ('hajj', 'الحج والعمرة', 'ibadat', 14),
  ('zakat', 'الزكاة', 'ibadat', 15),
  ('siyam', 'الصيام', 'ibadat', 16),
  ('salah', 'الصلاة', 'ibadat', 17),
  ('janazah', 'الجنائز', 'ibadat', 18),
  ('buyu', 'البيوت', 'muamalat', 19),
  ('qada', 'القضاء', 'muamalat', 20)
ON CONFLICT (slug) DO NOTHING;
