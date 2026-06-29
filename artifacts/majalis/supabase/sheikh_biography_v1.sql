-- Scholar Biography System v1 — structured verified fields + audit log
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

ALTER TABLE sheikhs ADD COLUMN IF NOT EXISTS kunya TEXT;
ALTER TABLE sheikhs ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE sheikhs ADD COLUMN IF NOT EXISTS life_status TEXT
  CHECK (life_status IS NULL OR life_status IN ('alive', 'deceased', 'unknown'));
ALTER TABLE sheikhs ADD COLUMN IF NOT EXISTS biography_data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE sheikhs ADD COLUMN IF NOT EXISTS biography_status TEXT NOT NULL DEFAULT 'draft'
  CHECK (biography_status IN ('draft', 'review', 'published', 'archived'));
ALTER TABLE sheikhs ADD COLUMN IF NOT EXISTS biography_sources JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE sheikhs ADD COLUMN IF NOT EXISTS biography_published_at TIMESTAMPTZ;
ALTER TABLE sheikhs ADD COLUMN IF NOT EXISTS biography_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS sheikhs_biography_status_idx ON sheikhs (biography_status);
CREATE INDEX IF NOT EXISTS sheikhs_kunya_idx ON sheikhs (kunya) WHERE kunya IS NOT NULL;
CREATE INDEX IF NOT EXISTS sheikhs_country_city_idx ON sheikhs (country, city);

CREATE TABLE IF NOT EXISTS sheikh_biography_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheikh_id UUID NOT NULL REFERENCES sheikhs(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'publish', 'archive', 'delete')),
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sheikh_biography_revisions_sheikh_idx
  ON sheikh_biography_revisions (sheikh_id, created_at DESC);

ALTER TABLE sheikh_biography_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sheikh_bio_revisions_admin ON sheikh_biography_revisions;
CREATE POLICY sheikh_bio_revisions_admin ON sheikh_biography_revisions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

COMMENT ON COLUMN sheikhs.biography_data IS 'Structured scholar CV — each key: { value, verified, source? }';
COMMENT ON COLUMN sheikhs.biography_status IS 'draft | review | published | archived';
