-- =====================================================================
--  المجلس العلمي — المجمع الفقهي الإسلامي v5
--  جدول fiqh_council_items (موحّد) — آمن، لا يحذف fiqh_council_decisions
--  نفّذ بعد: platform_v2_schema_fixed.sql + platform_expansion_v3.sql
-- =====================================================================

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

CREATE INDEX IF NOT EXISTS fiqh_items_slug_idx ON fiqh_council_items (slug);
CREATE INDEX IF NOT EXISTS fiqh_items_type_idx ON fiqh_council_items (type);
CREATE INDEX IF NOT EXISTS fiqh_items_category_idx ON fiqh_council_items (category);
CREATE INDEX IF NOT EXISTS fiqh_items_status_idx ON fiqh_council_items (status);
CREATE INDEX IF NOT EXISTS fiqh_items_published_idx ON fiqh_council_items (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS fiqh_items_session_date_idx ON fiqh_council_items (session_date DESC NULLS LAST);

ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION fiqh_items_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', normalize_ar(NEW.title)), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.summary, ''))), 'B') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.content, ''))), 'C') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.ruling_text, ''))), 'C') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.source_name, ''))), 'D') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(array_to_string(NEW.tags, ' '), ''))), 'D') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.category, ''))), 'D');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fiqh_items_search_vector ON fiqh_council_items;
CREATE TRIGGER trg_fiqh_items_search_vector
  BEFORE INSERT OR UPDATE ON fiqh_council_items
  FOR EACH ROW EXECUTE FUNCTION fiqh_items_search_vector_update();

CREATE INDEX IF NOT EXISTS fiqh_items_search_vector_idx ON fiqh_council_items USING GIN (search_vector);

-- RLS
ALTER TABLE fiqh_council_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fiqh_items_public_read ON fiqh_council_items;
CREATE POLICY fiqh_items_public_read ON fiqh_council_items
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS fiqh_items_admin_all ON fiqh_council_items;
CREATE POLICY fiqh_items_admin_all ON fiqh_council_items
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Migrate existing fiqh_council_decisions rows (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fiqh_council_decisions'
  ) THEN
    INSERT INTO fiqh_council_items (
      title, slug, type, category, summary, content, ruling_text, evidence,
      source_name, source_url, council_name, session_number, session_date,
      tags, status, views_count, published_at, created_at, updated_at
    )
    SELECT
      d.title,
      COALESCE(NULLIF(d.external_key, ''), d.id::text),
      CASE d.decision_type
        WHEN 'قرار' THEN 'resolution'
        WHEN 'فتوى جماعية' THEN 'fatwa'
        WHEN 'بحث' THEN 'research'
        WHEN 'توصية' THEN 'recommendation'
        WHEN 'بيان' THEN 'ruling'
        ELSE 'resolution'
      END,
      CASE d.category
        WHEN 'الطب' THEN 'الطب والنوازل'
        WHEN 'الاقتصاد' THEN 'الاقتصاد الإسلامي'
        WHEN 'قضايا معاصرة' THEN 'القضايا المعاصرة'
        ELSE d.category
      END,
      d.summary,
      d.body,
      NULL,
      COALESCE(d."references", '[]'::jsonb),
      NULL,
      CASE WHEN array_length(d.source_urls, 1) > 0 THEN d.source_urls[1] ELSE NULL END,
      'المجمع الفقهي الإسلامي',
      d.session_number,
      d.decision_date,
      COALESCE(d.keywords, '{}'),
      CASE d.status::text
        WHEN 'approved' THEN 'published'
        WHEN 'pending' THEN 'review'
        WHEN 'draft' THEN 'draft'
        WHEN 'archived' THEN 'archived'
        WHEN 'rejected' THEN 'archived'
        ELSE 'draft'
      END,
      COALESCE(d.view_count, 0),
      CASE WHEN d.status::text = 'approved' THEN COALESCE(d.updated_at, d.created_at) ELSE NULL END,
      d.created_at,
      d.updated_at
    FROM fiqh_council_decisions d
    WHERE NOT EXISTS (
      SELECT 1 FROM fiqh_council_items i
      WHERE i.slug = COALESCE(NULLIF(d.external_key, ''), d.id::text)
    )
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- View counter RPC (optional — safe if called from app)
CREATE OR REPLACE FUNCTION increment_fiqh_item_views(item_slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE fiqh_council_items
  SET views_count = views_count + 1, updated_at = now()
  WHERE slug = item_slug AND status = 'published';
END;
$$;

-- Extend search_platform to include fiqh_council_items (keeps fiqh_decisions key for compat)
CREATE OR REPLACE FUNCTION search_platform(query text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  q_norm text := normalize_ar(trim(coalesce(query, '')));
  q_like text := '%' || q_norm || '%';
  has_items boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fiqh_council_items'
  ) INTO has_items;

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
    'fiqh_decisions', CASE WHEN has_items THEN coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT slug AS id, title, category, type AS decision_type, summary,
          CASE type
            WHEN 'resolution' THEN 'قرار'
            WHEN 'fatwa' THEN 'فتوى جماعية'
            WHEN 'research' THEN 'بحث'
            WHEN 'recommendation' THEN 'توصية'
            WHEN 'ruling' THEN 'حكم'
            ELSE type
          END AS searchMeta
        FROM fiqh_council_items
        WHERE status = 'published'
          AND (
            normalize_ar(title) LIKE q_like
            OR normalize_ar(coalesce(summary, '')) LIKE q_like
            OR normalize_ar(coalesce(content, '')) LIKE q_like
            OR normalize_ar(coalesce(ruling_text, '')) LIKE q_like
            OR normalize_ar(coalesce(source_name, '')) LIKE q_like
            OR normalize_ar(coalesce(category, '')) LIKE q_like
            OR search_vector @@ plainto_tsquery('simple', q_norm)
          )
        ORDER BY session_date DESC NULLS LAST, published_at DESC NULLS LAST LIMIT 20
      ) t
    ), '[]'::json) ELSE coalesce((
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
    ), '[]'::json) END,
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
        SELECT id, title, course_type, venue_city
        FROM annual_courses
        WHERE status = 'approved' AND archived_at IS NULL
          AND (
            normalize_ar(title) LIKE q_like
            OR normalize_ar(coalesce(summary, '')) LIKE q_like
            OR search_vector @@ plainto_tsquery('simple', q_norm)
          )
        ORDER BY year DESC NULLS LAST LIMIT 20
      ) t
    ), '[]'::json),
    'updates', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT id, title, update_type, summary
        FROM platform_updates
        WHERE status = 'approved'
          AND (normalize_ar(title) LIKE q_like OR normalize_ar(coalesce(summary, '')) LIKE q_like)
        ORDER BY published_at DESC LIMIT 15
      ) t
    ), '[]'::json)
  );
END;
$$;
