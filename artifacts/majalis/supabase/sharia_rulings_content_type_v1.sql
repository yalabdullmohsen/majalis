-- =====================================================================
-- content_type لموسوعة الأحكام + عزل أسئلة المسابقة عن /rulings
-- آمن: لا يحذف صفوفًا. خذ نسخة احتياطية قبل التنفيذ.
-- =====================================================================

ALTER TABLE sharia_rulings
  ADD COLUMN IF NOT EXISTS content_type TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sharia_rulings_content_type_check'
  ) THEN
    ALTER TABLE sharia_rulings
      ADD CONSTRAINT sharia_rulings_content_type_check
      CHECK (
        content_type IS NULL OR content_type IN (
          'ruling',
          'fiqhIssue',
          'quizQuestion',
          'educationalQA',
          'legacyFatwa'
        )
      );
  END IF;
END $$;

UPDATE sharia_rulings
SET content_type = 'quizQuestion'
WHERE content_type IS NULL
  AND (
    coalesce(external_key, '') ~* '^(qa-ruling|qa-|quiz-)'
    OR title ~ '[؟?]\s*$'
    OR title ~ '^(هل|كيف|متى|أين|لماذا|كم)\y'
  );

UPDATE sharia_rulings
SET content_type = 'ruling'
WHERE content_type IS NULL;

CREATE INDEX IF NOT EXISTS sharia_rulings_content_type_idx
  ON sharia_rulings (content_type);

-- تحديث دالة البحث لاستبعاد غير الأحكام مع الحفاظ على التوقيع الحالي
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
    AND coalesce(r.content_type, 'ruling') IN ('ruling', 'fiqhIssue', 'legacyFatwa')
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
    AND coalesce(r.content_type, 'ruling') IN ('ruling', 'fiqhIssue', 'legacyFatwa')
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

CREATE OR REPLACE FUNCTION sharia_rulings_category_stats()
RETURNS TABLE (category TEXT, subcategory TEXT, cnt BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT category, subcategory, count(*) AS cnt
  FROM sharia_rulings
  WHERE status = 'approved'
    AND archived_at IS NULL
    AND verification_status = 'approved'
    AND coalesce(content_type, 'ruling') IN ('ruling', 'fiqhIssue', 'legacyFatwa')
  GROUP BY category, subcategory
  ORDER BY cnt DESC;
$$;

COMMENT ON COLUMN sharia_rulings.content_type IS
  'ruling|fiqhIssue|quizQuestion|educationalQA|legacyFatwa — /rulings للأنواع الفقهية فقط';
