-- =====================================================================
--  موسوعة الأحكام الشرعية v1 — توسّع المخطط والبحث والاستيراد
--  آمن — لا يحذف البيانات الحالية
--  نفّذ بعد: cms_platform_v4.sql
-- =====================================================================

-- ── 1. إزالة قيد التصنيف القديم (13 تصنيفاً) ───────────────────────────
ALTER TABLE sharia_rulings DROP CONSTRAINT IF EXISTS sharia_rulings_category_check;

-- ── 2. أعمدة موسوعة الأحكام ───────────────────────────────────────────
ALTER TABLE sharia_rulings
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS subcategories TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS quran_evidence JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS sunnah_evidence JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS scholar_opinions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS prevailing_view TEXT,
  ADD COLUMN IF NOT EXISTS hadith_grade TEXT,
  ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS importance_score INT NOT NULL DEFAULT 50
    CHECK (importance_score BETWEEN 1 AND 100),
  ADD COLUMN IF NOT EXISTS popularity_score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS search_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS related_ids TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linked_qa_ids TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linked_lesson_ids TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linked_fatwa_ids TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linked_fiqh_ids TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_origin TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (verification_status IN ('draft', 'pending', 'approved', 'rejected', 'archived')),
  ADD COLUMN IF NOT EXISTS import_batch_id UUID,
  ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES sharia_rulings(id) ON DELETE SET NULL;

-- ── 3. فهارس الأداء ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS sharia_rulings_subcategory_idx ON sharia_rulings (subcategory);
CREATE INDEX IF NOT EXISTS sharia_rulings_importance_idx ON sharia_rulings (importance_score DESC);
CREATE INDEX IF NOT EXISTS sharia_rulings_popularity_idx ON sharia_rulings (popularity_score DESC);
CREATE INDEX IF NOT EXISTS sharia_rulings_search_count_idx ON sharia_rulings (search_count DESC);
CREATE INDEX IF NOT EXISTS sharia_rulings_published_idx ON sharia_rulings (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS sharia_rulings_verification_idx ON sharia_rulings (verification_status, status);
CREATE INDEX IF NOT EXISTS sharia_rulings_keywords_gin ON sharia_rulings USING gin (keywords);
CREATE INDEX IF NOT EXISTS sharia_rulings_subcategories_gin ON sharia_rulings USING gin (subcategories);

-- ── 4. جدول التصنيفات الهرمي ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sharia_ruling_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  parent_slug TEXT,
  icon        TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  ruling_count INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sharia_ruling_categories_parent_idx ON sharia_ruling_categories (parent_slug);

-- ── 5. سجل الاستيراد الجماعي ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sharia_ruling_imports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      TEXT,
  format        TEXT NOT NULL CHECK (format IN ('csv', 'json', 'markdown', 'script')),
  total_rows    INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0,
  skipped_rows  INT NOT NULL DEFAULT 0,
  error_rows    INT NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  errors        JSONB DEFAULT '[]',
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

-- ── 6. تحديث search_vector ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sharia_rulings_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(normalize_ar(NEW.title), '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(normalize_ar(NEW.summary), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(normalize_ar(NEW.body), '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(normalize_ar(NEW.category), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(normalize_ar(NEW.subcategory), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(normalize_ar(NEW.prevailing_view), '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(normalize_ar(NEW.hadith_grade), '')), 'D') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.keywords, ' '), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.subcategories, ' '), '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.references::text, '')), 'D') ||
    setweight(to_tsvector('simple', coalesce(NEW.quran_evidence::text, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.sunnah_evidence::text, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.scholar_opinions::text, '')), 'D');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sharia_rulings_search_vector_trigger ON sharia_rulings;
CREATE TRIGGER sharia_rulings_search_vector_trigger
  BEFORE INSERT OR UPDATE ON sharia_rulings
  FOR EACH ROW EXECUTE FUNCTION sharia_rulings_search_vector_update();

-- ── 7. RPC: بحث الأحكام مع ترقيم ───────────────────────────────────────
CREATE OR REPLACE FUNCTION search_sharia_rulings(
  q TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_subcategory TEXT DEFAULT NULL,
  p_sort TEXT DEFAULT 'newest',
  p_limit INT DEFAULT 24,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  external_key TEXT,
  title TEXT,
  summary TEXT,
  body TEXT,
  category TEXT,
  subcategory TEXT,
  keywords TEXT[],
  view_count INT,
  importance_score INT,
  popularity_score INT,
  search_count INT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total BIGINT;
BEGIN
  SELECT count(*) INTO v_total
  FROM sharia_rulings r
  WHERE r.status = 'approved'
    AND r.archived_at IS NULL
    AND r.verification_status = 'approved'
    AND (p_category IS NULL OR p_category = '' OR p_category = 'الكل' OR r.category = p_category)
    AND (p_subcategory IS NULL OR p_subcategory = '' OR r.subcategory = p_subcategory)
    AND (
      q IS NULL OR q = '' OR
      r.search_vector @@ plainto_tsquery('simple', normalize_ar(q)) OR
      r.title ILIKE '%' || q || '%' OR
      r.summary ILIKE '%' || q || '%'
    );

  RETURN QUERY
  SELECT
    r.id, r.external_key, r.title, r.summary, r.body, r.category, r.subcategory,
    r.keywords, r.view_count, r.importance_score, r.popularity_score, r.search_count,
    r.published_at, r.created_at, v_total
  FROM sharia_rulings r
  WHERE r.status = 'approved'
    AND r.archived_at IS NULL
    AND r.verification_status = 'approved'
    AND (p_category IS NULL OR p_category = '' OR p_category = 'الكل' OR r.category = p_category)
    AND (p_subcategory IS NULL OR p_subcategory = '' OR r.subcategory = p_subcategory)
    AND (
      q IS NULL OR q = '' OR
      r.search_vector @@ plainto_tsquery('simple', normalize_ar(q)) OR
      r.title ILIKE '%' || q || '%' OR
      r.summary ILIKE '%' || q || '%'
    )
  ORDER BY
    CASE WHEN p_sort = 'views' THEN r.view_count END DESC NULLS LAST,
    CASE WHEN p_sort = 'importance' THEN r.importance_score END DESC NULLS LAST,
    CASE WHEN p_sort = 'search' THEN r.search_count END DESC NULLS LAST,
    CASE WHEN p_sort = 'newest' OR p_sort IS NULL THEN extract(epoch FROM coalesce(r.published_at, r.created_at)) END DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- ── 8. RPC: إحصائيات التصنيفات ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION sharia_rulings_category_stats()
RETURNS TABLE (category TEXT, subcategory TEXT, cnt BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT category, subcategory, count(*) AS cnt
  FROM sharia_rulings
  WHERE status = 'approved' AND archived_at IS NULL AND verification_status = 'approved'
  GROUP BY category, subcategory
  ORDER BY cnt DESC;
$$;

GRANT EXECUTE ON FUNCTION search_sharia_rulings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION sharia_rulings_category_stats TO anon, authenticated;
