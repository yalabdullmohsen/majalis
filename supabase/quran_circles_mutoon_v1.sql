-- Quran circles + Mutoon texts (UX completion v1)

CREATE TABLE IF NOT EXISTS quran_circles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key    TEXT UNIQUE,
  name            TEXT NOT NULL,
  sheikh_name     TEXT NOT NULL,
  level           TEXT,
  city            TEXT,
  days            TEXT,
  time            TEXT,
  age_group       TEXT,
  registration_method TEXT,
  seats_total     INT,
  seats_available INT,
  start_date      DATE,
  end_date        DATE,
  image_url       TEXT,
  description     TEXT,
  categories      TEXT[] DEFAULT '{}',
  mosque_name     TEXT,
  registration_url TEXT,
  status          TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'closed')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quran_circles_city_idx ON quran_circles (city);
CREATE INDEX IF NOT EXISTS quran_circles_categories_idx ON quran_circles USING gin (categories);

CREATE TABLE IF NOT EXISTS mutoon_texts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key    TEXT UNIQUE,
  name            TEXT NOT NULL,
  author          TEXT NOT NULL,
  category        TEXT NOT NULL,
  level           TEXT,
  summary         TEXT,
  text_excerpt    TEXT,
  audio_url       TEXT,
  video_url       TEXT,
  pdf_url         TEXT,
  has_quiz        BOOLEAN DEFAULT true,
  verses_count    INT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mutoon_texts_category_idx ON mutoon_texts (category);

CREATE TABLE IF NOT EXISTS contact_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT,
  subject         TEXT,
  message         TEXT NOT NULL,
  status          TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE quran_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutoon_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read quran_circles" ON quran_circles;
CREATE POLICY "public read quran_circles" ON quran_circles FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin manage quran_circles" ON quran_circles;
CREATE POLICY "admin manage quran_circles" ON quran_circles FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public read mutoon" ON mutoon_texts;
CREATE POLICY "public read mutoon" ON mutoon_texts FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin manage mutoon" ON mutoon_texts;
CREATE POLICY "admin manage mutoon" ON mutoon_texts FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin read contact_messages" ON contact_messages;
CREATE POLICY "admin read contact_messages" ON contact_messages FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "admin manage contact_messages" ON contact_messages;
CREATE POLICY "admin manage contact_messages" ON contact_messages FOR ALL USING (is_admin()) WITH CHECK (is_admin());
