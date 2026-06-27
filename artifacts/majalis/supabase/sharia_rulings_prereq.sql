-- Prerequisite for sharia_rulings_encyclopedia_v1.sql when platform_expansion_v3 was not applied.
-- Safe to re-run (IF NOT EXISTS / duplicate_object guards).

DO $$ BEGIN
  CREATE TYPE platform_content_status AS ENUM ('draft', 'pending', 'approved', 'archived', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS sharia_rulings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key    TEXT UNIQUE,
  title           TEXT NOT NULL,
  summary         TEXT,
  body            TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'فقه عام',
  evidence        JSONB DEFAULT '[]',
  "references"    JSONB DEFAULT '[]',
  keywords        TEXT[] DEFAULT '{}',
  status          platform_content_status NOT NULL DEFAULT 'approved',
  view_count      INT NOT NULL DEFAULT 0,
  search_vector   TSVECTOR,
  published_at    TIMESTAMPTZ,
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sharia_rulings_category_idx ON sharia_rulings (category);
CREATE INDEX IF NOT EXISTS sharia_rulings_status_idx ON sharia_rulings (status);

-- normalize_ar used by encyclopedia search triggers (no-op if already exists)
CREATE OR REPLACE FUNCTION normalize_ar(input TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(regexp_replace(coalesce(input, ''), '\s+', ' ', 'g'));
$$;
