-- AKE publisher prerequisite — fiqh_council_items (idempotent, safe)
CREATE TABLE IF NOT EXISTS fiqh_council_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL DEFAULT 'resolution'
    CHECK (type IN ('resolution', 'fatwa', 'research', 'recommendation', 'ruling')),
  category        TEXT NOT NULL DEFAULT 'القضايا المعاصرة'
    CHECK (category IN (
      'العبادات', 'المعاملات', 'الأسرة', 'الطب والنوازل',
      'الاقتصاد الإسلامي', 'الأقليات المسلمة', 'القضايا المعاصرة',
      'الأطعمة والأشربة', 'الزكاة والوقف', 'الحج والعمرة'
    )),
  summary         TEXT,
  content         TEXT,
  ruling_text     TEXT,
  evidence        JSONB NOT NULL DEFAULT '[]',
  source_name     TEXT,
  source_url      TEXT,
  council_name    TEXT DEFAULT 'المجمع الفقهي الإسلامي',
  session_number  TEXT,
  session_date    DATE,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'published', 'archived')),
  views_count     INT NOT NULL DEFAULT 0,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE INDEX IF NOT EXISTS fiqh_items_slug_idx ON fiqh_council_items (slug);
CREATE INDEX IF NOT EXISTS fiqh_items_status_idx ON fiqh_council_items (status);
CREATE INDEX IF NOT EXISTS fiqh_items_external_id_idx ON fiqh_council_items (external_id);
CREATE UNIQUE INDEX IF NOT EXISTS fiqh_items_external_id_uidx
  ON fiqh_council_items (external_id)
  WHERE external_id IS NOT NULL AND external_id <> '';

ALTER TABLE fiqh_council_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fiqh_items_public_read ON fiqh_council_items;
CREATE POLICY fiqh_items_public_read ON fiqh_council_items
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS fiqh_items_service_all ON fiqh_council_items;
CREATE POLICY fiqh_items_service_all ON fiqh_council_items
  FOR ALL USING (auth.role() = 'service_role');

GRANT SELECT ON fiqh_council_items TO anon, authenticated;
GRANT ALL ON fiqh_council_items TO service_role;

NOTIFY pgrst, 'reload schema';
