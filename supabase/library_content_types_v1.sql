-- Library content type separation (books | articles | research)
-- Apply in Supabase SQL Editor or via migration runner.

DO $$ BEGIN
  CREATE TYPE library_content_type AS ENUM ('book', 'article');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE library_items
  ADD COLUMN IF NOT EXISTS content_type library_content_type,
  ADD COLUMN IF NOT EXISTS author text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS publisher text,
  ADD COLUMN IF NOT EXISTS publish_year integer,
  ADD COLUMN IF NOT EXISTS page_count integer,
  ADD COLUMN IF NOT EXISTS parts_count integer,
  ADD COLUMN IF NOT EXISTS reading_minutes integer,
  ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT '{}';

-- Auto-classify existing rows (non-destructive)
UPDATE library_items SET content_type = 'article'
WHERE content_type IS NULL AND (type = 'مقال' OR type ILIKE '%مقال%');

UPDATE library_items SET content_type = 'article'
WHERE content_type IS NULL AND (type IN ('تفريغ', 'ملخص'));

UPDATE library_items SET content_type = 'book'
WHERE content_type IS NULL;

-- Backfill author from description patterns if empty (no-op safe)
UPDATE library_items SET author = COALESCE(author, '')
WHERE author IS NULL;

-- Prevent publishing without content_type
CREATE OR REPLACE FUNCTION library_items_require_content_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.content_type IS NULL THEN
    RAISE EXCEPTION 'content_type is required before publishing (book | article | research)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_library_items_content_type ON library_items;
CREATE TRIGGER trg_library_items_content_type
  BEFORE INSERT OR UPDATE ON library_items
  FOR EACH ROW EXECUTE FUNCTION library_items_require_content_type();

CREATE INDEX IF NOT EXISTS idx_library_items_content_type ON library_items (content_type);
CREATE INDEX IF NOT EXISTS idx_library_items_content_type_status ON library_items (content_type, status);

-- Reject unknown / null types on approved rows (belt-and-suspenders with trigger)
ALTER TABLE library_items DROP CONSTRAINT IF EXISTS library_items_content_type_allowed;
ALTER TABLE library_items ADD CONSTRAINT library_items_content_type_allowed
  CHECK (content_type IS NULL OR content_type IN ('book', 'article'));

COMMENT ON COLUMN library_items.content_type IS 'Mandatory: book | article (research uses research_papers)';
COMMENT ON COLUMN library_items.metadata IS 'Extended fields: university, supervisor, faculty, department, citations, etc.';
