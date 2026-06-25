-- =====================================================================
--  المجلس العلمي — Platform Expansion v3
--  المجمع الفقهي | الفتاوى | الأحكام الشرعية | الدورات العلمية | المستجدات
--  شغّل بعد platform_v2_schema_fixed.sql و search_fts.sql
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE platform_content_status AS ENUM ('draft', 'pending', 'approved', 'archived', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 1. fiqh_council_decisions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_decisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key    TEXT UNIQUE,
  title           TEXT NOT NULL,
  summary         TEXT,
  body            TEXT,
  decision_type   TEXT NOT NULL DEFAULT 'قرار'
    CHECK (decision_type IN ('قرار', 'بحث', 'توصية', 'بيان', 'فتوى جماعية')),
  category        TEXT NOT NULL DEFAULT 'قضايا معاصرة'
    CHECK (category IN ('العبادات', 'المعاملات', 'الأسرة', 'الطب', 'الاقتصاد', 'قضايا معاصرة', 'الأقليات المسلمة')),
  session_number  TEXT,
  decision_date   DATE,
  source_urls     TEXT[] DEFAULT '{}',
  references      JSONB DEFAULT '[]',
  keywords        TEXT[] DEFAULT '{}',
  status          platform_content_status NOT NULL DEFAULT 'approved',
  view_count      INT NOT NULL DEFAULT 0,
  search_count    INT NOT NULL DEFAULT 0,
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiqh_decisions_category_idx ON fiqh_council_decisions (category);
CREATE INDEX IF NOT EXISTS fiqh_decisions_status_idx ON fiqh_council_decisions (status);
CREATE INDEX IF NOT EXISTS fiqh_decisions_date_idx ON fiqh_council_decisions (decision_date DESC NULLS LAST);

-- ── 2. fatwas ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fatwas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key    TEXT UNIQUE,
  question        TEXT NOT NULL,
  answer          TEXT NOT NULL,
  summary         TEXT,
  category        TEXT NOT NULL DEFAULT 'فقه عام',
  format          TEXT NOT NULL DEFAULT 'written'
    CHECK (format IN ('written', 'audio', 'both')),
  audio_url       TEXT,
  mufti_name      TEXT,
  source_urls     TEXT[] DEFAULT '{}',
  references      JSONB DEFAULT '[]',
  keywords        TEXT[] DEFAULT '{}',
  status          platform_content_status NOT NULL DEFAULT 'approved',
  view_count      INT NOT NULL DEFAULT 0,
  search_count    INT NOT NULL DEFAULT 0,
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fatwas_category_idx ON fatwas (category);
CREATE INDEX IF NOT EXISTS fatwas_status_idx ON fatwas (status);
CREATE INDEX IF NOT EXISTS fatwas_view_count_idx ON fatwas (view_count DESC);

-- ── 3. sharia_rulings ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sharia_rulings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key    TEXT UNIQUE,
  title           TEXT NOT NULL,
  summary         TEXT,
  body            TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'فقه عام'
    CHECK (category IN (
      'العبادات', 'الطهارة', 'الصلاة', 'الزكاة', 'الصيام', 'الحج',
      'الأسرة', 'البيوت', 'المعاملات', 'القضاء', 'المواريث', 'النوازل', 'السياسة الشرعية'
    )),
  evidence        JSONB DEFAULT '[]',
  references      JSONB DEFAULT '[]',
  keywords        TEXT[] DEFAULT '{}',
  status          platform_content_status NOT NULL DEFAULT 'approved',
  view_count      INT NOT NULL DEFAULT 0,
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sharia_rulings_category_idx ON sharia_rulings (category);
CREATE INDEX IF NOT EXISTS sharia_rulings_status_idx ON sharia_rulings (status);

-- ── 4. annual_courses ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS annual_courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key    TEXT UNIQUE,
  title           TEXT NOT NULL,
  summary         TEXT,
  body            TEXT,
  course_type     TEXT NOT NULL DEFAULT 'سنوية'
    CHECK (course_type IN ('سنوية', 'موسمية', 'برنامج', 'متن')),
  season          TEXT,
  year            INT,
  sheikh_names    TEXT[] DEFAULT '{}',
  mutoon          TEXT[] DEFAULT '{}',
  schedule        JSONB DEFAULT '[]',
  venue_name      TEXT,
  venue_address   TEXT,
  venue_city      TEXT,
  map_url         TEXT,
  registration_url TEXT,
  registration_open BOOLEAN NOT NULL DEFAULT true,
  start_date      DATE,
  end_date        DATE,
  keywords        TEXT[] DEFAULT '{}',
  status          platform_content_status NOT NULL DEFAULT 'approved',
  view_count      INT NOT NULL DEFAULT 0,
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS annual_courses_type_idx ON annual_courses (course_type);
CREATE INDEX IF NOT EXISTS annual_courses_year_idx ON annual_courses (year DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS annual_courses_status_idx ON annual_courses (status);

-- ── 5. platform_updates ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_updates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key    TEXT UNIQUE,
  title           TEXT NOT NULL,
  summary         TEXT,
  body            TEXT,
  update_type     TEXT NOT NULL DEFAULT 'إعلان'
    CHECK (update_type IN (
      'قرار', 'فتوى', 'درس', 'دورة', 'كتاب', 'إعلان', 'خبر علمي'
    )),
  source_type     TEXT,
  source_id       TEXT,
  source_url      TEXT,
  published_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          platform_content_status NOT NULL DEFAULT 'approved',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_updates_type_idx ON platform_updates (update_type);
CREATE INDEX IF NOT EXISTS platform_updates_published_idx ON platform_updates (published_at DESC);

-- ── 6. search vectors ───────────────────────────────────────────────────
ALTER TABLE fiqh_council_decisions ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE fatwas ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE sharia_rulings ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE annual_courses ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION fiqh_decisions_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', normalize_ar(NEW.title)), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.summary, ''))), 'B') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.body, ''))), 'C') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(array_to_string(NEW.keywords, ' '), ''))), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fiqh_decisions_search_vector ON fiqh_council_decisions;
CREATE TRIGGER trg_fiqh_decisions_search_vector
  BEFORE INSERT OR UPDATE ON fiqh_council_decisions
  FOR EACH ROW EXECUTE FUNCTION fiqh_decisions_search_vector_update();

CREATE OR REPLACE FUNCTION fatwas_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', normalize_ar(NEW.question)), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.answer, ''))), 'B') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(array_to_string(NEW.keywords, ' '), ''))), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fatwas_search_vector ON fatwas;
CREATE TRIGGER trg_fatwas_search_vector
  BEFORE INSERT OR UPDATE ON fatwas
  FOR EACH ROW EXECUTE FUNCTION fatwas_search_vector_update();

CREATE OR REPLACE FUNCTION sharia_rulings_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', normalize_ar(NEW.title)), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.summary, ''))), 'B') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.body, ''))), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sharia_rulings_search_vector ON sharia_rulings;
CREATE TRIGGER trg_sharia_rulings_search_vector
  BEFORE INSERT OR UPDATE ON sharia_rulings
  FOR EACH ROW EXECUTE FUNCTION sharia_rulings_search_vector_update();

CREATE OR REPLACE FUNCTION annual_courses_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', normalize_ar(NEW.title)), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.summary, ''))), 'B') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(array_to_string(NEW.sheikh_names, ' '), ''))), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(array_to_string(NEW.mutoon, ' '), ''))), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_annual_courses_search_vector ON annual_courses;
CREATE TRIGGER trg_annual_courses_search_vector
  BEFORE INSERT OR UPDATE ON annual_courses
  FOR EACH ROW EXECUTE FUNCTION annual_courses_search_vector_update();

CREATE INDEX IF NOT EXISTS fiqh_decisions_search_vector_idx ON fiqh_council_decisions USING gin (search_vector);
CREATE INDEX IF NOT EXISTS fatwas_search_vector_idx ON fatwas USING gin (search_vector);
CREATE INDEX IF NOT EXISTS sharia_rulings_search_vector_idx ON sharia_rulings USING gin (search_vector);
CREATE INDEX IF NOT EXISTS annual_courses_search_vector_idx ON annual_courses USING gin (search_vector);

-- ── 7. RLS policies ─────────────────────────────────────────────────────
ALTER TABLE fiqh_council_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fatwas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharia_rulings ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fiqh_decisions_public_read ON fiqh_council_decisions;
CREATE POLICY fiqh_decisions_public_read ON fiqh_council_decisions
  FOR SELECT USING (status = 'approved' AND archived_at IS NULL);

DROP POLICY IF EXISTS fatwas_public_read ON fatwas;
CREATE POLICY fatwas_public_read ON fatwas
  FOR SELECT USING (status = 'approved' AND archived_at IS NULL);

DROP POLICY IF EXISTS sharia_rulings_public_read ON sharia_rulings;
CREATE POLICY sharia_rulings_public_read ON sharia_rulings
  FOR SELECT USING (status = 'approved' AND archived_at IS NULL);

DROP POLICY IF EXISTS annual_courses_public_read ON annual_courses;
CREATE POLICY annual_courses_public_read ON annual_courses
  FOR SELECT USING (status = 'approved' AND archived_at IS NULL);

DROP POLICY IF EXISTS platform_updates_public_read ON platform_updates;
CREATE POLICY platform_updates_public_read ON platform_updates
  FOR SELECT USING (status = 'approved');

-- Admin full access (authenticated admins via service role in app)
DROP POLICY IF EXISTS fiqh_decisions_admin_all ON fiqh_council_decisions;
CREATE POLICY fiqh_decisions_admin_all ON fiqh_council_decisions
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fatwas_admin_all ON fatwas;
CREATE POLICY fatwas_admin_all ON fatwas
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS sharia_rulings_admin_all ON sharia_rulings;
CREATE POLICY sharia_rulings_admin_all ON sharia_rulings
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS annual_courses_admin_all ON annual_courses;
CREATE POLICY annual_courses_admin_all ON annual_courses
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS platform_updates_admin_all ON platform_updates;
CREATE POLICY platform_updates_admin_all ON platform_updates
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ── 8. Extend search_platform RPC ───────────────────────────────────────
CREATE OR REPLACE FUNCTION search_platform(query text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  q_norm text := normalize_ar(trim(coalesce(query, '')));
  q_like text := '%' || q_norm || '%';
BEGIN
  IF length(q_norm) < 1 THEN
    RETURN json_build_object(
      'lessons', '[]'::json,
      'sheikhs', '[]'::json,
      'library', '[]'::json,
      'miracles', '[]'::json,
      'qa', '[]'::json,
      'fawaid', '[]'::json,
      'fiqh_decisions', '[]'::json,
      'fatwas', '[]'::json,
      'rulings', '[]'::json,
      'courses', '[]'::json,
      'updates', '[]'::json
    );
  END IF;

  RETURN json_build_object(
    'lessons', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, category, speaker_name
        FROM lessons
        WHERE status = 'approved'
          AND (
            normalize_ar(title) LIKE q_like
            OR normalize_ar(coalesce(description, '')) LIKE q_like
            OR normalize_ar(coalesce(speaker_name, '')) LIKE q_like
            OR search_vector @@ plainto_tsquery('simple', q_norm)
          )
        ORDER BY created_at DESC
        LIMIT 30
      ) t
    ), '[]'::json),
    'sheikhs', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, name FROM sheikhs
        WHERE normalize_ar(name) LIKE q_like OR search_vector @@ plainto_tsquery('simple', q_norm)
        ORDER BY name LIMIT 20
      ) t
    ), '[]'::json),
    'library', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, type FROM library_items
        WHERE status = 'approved'
          AND (normalize_ar(title) LIKE q_like OR search_vector @@ plainto_tsquery('simple', q_norm))
        ORDER BY created_at DESC LIMIT 20
      ) t
    ), '[]'::json),
    'miracles', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, category FROM scientific_miracles
        WHERE status = 'approved'
          AND (normalize_ar(title) LIKE q_like OR normalize_ar(coalesce(body, '')) LIKE q_like)
        ORDER BY created_at DESC LIMIT 15
      ) t
    ), '[]'::json),
    'qa', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT q.id, q.question, json_build_object('name', c.name) AS qa_categories
        FROM qa_questions q
        LEFT JOIN qa_categories c ON c.id = q.category_id
        WHERE q.status = 'published'
          AND (normalize_ar(q.question) LIKE q_like OR search_vector @@ plainto_tsquery('simple', q_norm))
        ORDER BY q.created_at DESC LIMIT 20
      ) t
    ), '[]'::json),
    'fawaid', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, text, author_name FROM fawaid
        WHERE status = 'approved' AND normalize_ar(text) LIKE q_like
        ORDER BY created_at DESC LIMIT 15
      ) t
    ), '[]'::json),
    'fiqh_decisions', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, category, decision_type, summary
        FROM fiqh_council_decisions
        WHERE status = 'approved' AND archived_at IS NULL
          AND (
            normalize_ar(title) LIKE q_like
            OR normalize_ar(coalesce(summary, '')) LIKE q_like
            OR search_vector @@ plainto_tsquery('simple', q_norm)
          )
        ORDER BY decision_date DESC NULLS LAST, created_at DESC LIMIT 20
      ) t
    ), '[]'::json),
    'fatwas', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, question, category, format, mufti_name
        FROM fatwas
        WHERE status = 'approved' AND archived_at IS NULL
          AND (
            normalize_ar(question) LIKE q_like
            OR normalize_ar(coalesce(answer, '')) LIKE q_like
            OR search_vector @@ plainto_tsquery('simple', q_norm)
          )
        ORDER BY created_at DESC LIMIT 20
      ) t
    ), '[]'::json),
    'rulings', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, category, summary
        FROM sharia_rulings
        WHERE status = 'approved' AND archived_at IS NULL
          AND (
            normalize_ar(title) LIKE q_like
            OR normalize_ar(coalesce(body, '')) LIKE q_like
            OR search_vector @@ plainto_tsquery('simple', q_norm)
          )
        ORDER BY created_at DESC LIMIT 20
      ) t
    ), '[]'::json),
    'courses', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, course_type, season, year, venue_city
        FROM annual_courses
        WHERE status = 'approved' AND archived_at IS NULL
          AND (
            normalize_ar(title) LIKE q_like
            OR normalize_ar(coalesce(summary, '')) LIKE q_like
            OR search_vector @@ plainto_tsquery('simple', q_norm)
          )
        ORDER BY year DESC NULLS LAST, created_at DESC LIMIT 20
      ) t
    ), '[]'::json),
    'updates', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, update_type, summary, published_at
        FROM platform_updates
        WHERE status = 'approved'
          AND normalize_ar(title) LIKE q_like
        ORDER BY published_at DESC LIMIT 15
      ) t
    ), '[]'::json)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION search_platform(text) TO anon, authenticated;

-- =====================================================================
--  انتهى platform_expansion_v3.sql
-- =====================================================================
