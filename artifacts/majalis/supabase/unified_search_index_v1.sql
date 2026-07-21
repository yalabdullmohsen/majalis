-- ====================================================================
--  مجالس العلم — فهرس البحث الموحد (unified_search_index_v1.sql)
--  المرحلة 2 من مشروع محرك البحث العربي الموحد
--  2026-07-12
-- ====================================================================
--
--  هذا الملف:
--  1. يحدّث دالة normalize_ar() لتشمل علامات الوقف القرآنية والمدّات
--  2. يضيف عمود search_text للجداول غير المغطاة
--  3. ينشئ quran_search_index (view على search_index)
--  4. ينشئ فهارس GIN/trgm على search_text
--
--  الجداول المغطاة مسبقاً (search_ar — arabic_search_upgrade_v1.sql):
--    lessons, qa_questions, fawaid, akp_stories
--
--  الجداول الجديدة (search_text):
--    sheikhs, library_items, scientific_miracles,
--    verified_hadith_items, fiqh_council_items
-- ====================================================================

-- ─── 0. تأكيد تفعيل pg_trgm ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── 1. تحديث دالة normalize_ar() لتشمل علامات الوقف القرآنية ───────
--
--  التحسينات عن الإصدار السابق:
--   - إزالة علامات الوقف القرآنية U+06D6–U+06DC و U+06DF–U+06E4 و U+06E7–U+06ED
--   - إزالة الكشيدة ـ (U+0640)
--   - إزالة المدّات U+0653–U+0655
--   - إزالة الحروف العالية U+0610–U+061A
--   - توحيد المسافات
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION normalize_ar(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE STRICT
AS $$
  SELECT TRIM(REGEXP_REPLACE(
    LOWER(
      TRANSLATE(
        -- 1. إزالة التشكيل الكامل بما يشمل علامات الوقف القرآنية والمدّات
        REGEXP_REPLACE(
          COALESCE(input, ''),
          -- الحركات U+064B-U+065F | ألف خنجرية U+0670 | مدّات U+0653-U+0655
          -- الحروف العالية U+0610-U+061A | وقف قرآني U+06D6-U+06ED
          -- الكشيدة U+0640
          '[ً-ٟٓ-ٕؐ-ؚۖ-ۜ۟-ۤۧ-ٰۭـ]',
          '',
          'g'
        ),
        -- 2. توحيد حروف مختلفة بشكلها الأساسي
        'أإآٱؤئةى',
        'ااааوييهي'
      )
    ),
    -- 3. توحيد المسافات المتعددة
    '\s+', ' ', 'g'
  ));
$$;

-- ─── 2. إضافة search_text لجدول sheikhs ─────────────────────────────
ALTER TABLE sheikhs
  ADD COLUMN IF NOT EXISTS search_text text
    GENERATED ALWAYS AS (
      normalize_ar(
        COALESCE(name, '') || ' ' ||
        COALESCE(bio, '') || ' ' ||
        COALESCE(city, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_sheikhs_search_trgm
  ON sheikhs USING GIN (search_text gin_trgm_ops);

-- ─── 3. إضافة search_text لجدول library_items ───────────────────────
ALTER TABLE library_items
  ADD COLUMN IF NOT EXISTS search_text text
    GENERATED ALWAYS AS (
      normalize_ar(
        COALESCE(title, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(category, '') || ' ' ||
        COALESCE(author_name, '') || ' ' ||
        COALESCE(type, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_library_items_search_trgm
  ON library_items USING GIN (search_text gin_trgm_ops);

-- ─── 4. إضافة search_text لجدول scientific_miracles ────────────────
ALTER TABLE scientific_miracles
  ADD COLUMN IF NOT EXISTS search_text text
    GENERATED ALWAYS AS (
      normalize_ar(
        COALESCE(title, '') || ' ' ||
        COALESCE(body, '') || ' ' ||
        COALESCE(category, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_scientific_miracles_search_trgm
  ON scientific_miracles USING GIN (search_text gin_trgm_ops);

-- ─── 5. إضافة search_text لجدول verified_hadith_items ───────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'verified_hadith_items'
  ) THEN
    ALTER TABLE verified_hadith_items
      ADD COLUMN IF NOT EXISTS search_text text
        GENERATED ALWAYS AS (
          normalize_ar(
            COALESCE(title, '') || ' ' ||
            COALESCE(text, '') || ' ' ||
            COALESCE(narrator, '') || ' ' ||
            COALESCE(collection, '')
          )
        ) STORED;

    CREATE INDEX IF NOT EXISTS idx_verified_hadith_search_trgm
      ON verified_hadith_items USING GIN (search_text gin_trgm_ops);
  END IF;
END $$;

-- ─── 6. إضافة search_text لجدول fiqh_council_items ─────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'fiqh_council_items'
  ) THEN
    ALTER TABLE fiqh_council_items
      ADD COLUMN IF NOT EXISTS search_text text
        GENERATED ALWAYS AS (
          normalize_ar(
            COALESCE(title, '') || ' ' ||
            COALESCE(summary, '') || ' ' ||
            COALESCE(category, '') || ' ' ||
            COALESCE(body, '')
          )
        ) STORED;

    CREATE INDEX IF NOT EXISTS idx_fiqh_council_search_trgm
      ON fiqh_council_items USING GIN (search_text gin_trgm_ops);
  END IF;
END $$;

-- ─── 7. إضافة search_text لجداول lessons/qa/fawaid/akp_stories ──────
--  (إضافة عمود search_text مقابل search_ar الموجود — للتوافق الأمامي)
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS search_text text
    GENERATED ALWAYS AS (
      normalize_ar(
        COALESCE(title, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(speaker_name, '') || ' ' ||
        COALESCE(category, '') || ' ' ||
        COALESCE(mosque, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_lessons_search_text_trgm
  ON lessons USING GIN (search_text gin_trgm_ops);

ALTER TABLE qa_questions
  ADD COLUMN IF NOT EXISTS search_text text
    GENERATED ALWAYS AS (
      normalize_ar(
        COALESCE(question, '') || ' ' ||
        COALESCE(answer, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_qa_search_text_trgm
  ON qa_questions USING GIN (search_text gin_trgm_ops);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'fawaid'
  ) THEN
    ALTER TABLE fawaid
      ADD COLUMN IF NOT EXISTS search_text text
        GENERATED ALWAYS AS (
          normalize_ar(
            COALESCE(title, '') || ' ' ||
            COALESCE(text, '') || ' ' ||
            COALESCE(source, '') || ' ' ||
            COALESCE(author_name, '')
          )
        ) STORED;
    CREATE INDEX IF NOT EXISTS idx_fawaid_search_text_trgm
      ON fawaid USING GIN (search_text gin_trgm_ops);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'akp_stories'
  ) THEN
    ALTER TABLE akp_stories
      ADD COLUMN IF NOT EXISTS search_text text
        GENERATED ALWAYS AS (
          normalize_ar(
            COALESCE(title, '') || ' ' ||
            COALESCE(summary, '') || ' ' ||
            COALESCE(category, '') || ' ' ||
            COALESCE(topic, '')
          )
        ) STORED;
    CREATE INDEX IF NOT EXISTS idx_akp_stories_search_text_trgm
      ON akp_stories USING GIN (search_text gin_trgm_ops);
  END IF;
END $$;

-- ─── 8. quran_search_index — view على جدول search_index ─────────────
--
--  ملاحظة: نصوص القرآن لا تُخزَّن في قاعدة البيانات المحلية.
--  المصدر الوحيد: api.alquran.cloud (Uthmanic, Hafs ʿan ʿĀṣim).
--  هذه الـ view تعرض أي آيات مخزَّنة مسبقاً في جدول search_index
--  من نوع quran_verse — يُعرض النص الأصلي حرفياً بدون تعديل.
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW quran_search_index AS
SELECT
  id,
  content_id,
  content_type,
  title                        AS surah_name,
  body_text                    AS ayah_text,        -- النص الأصلي بتشكيله الكامل
  normalize_ar(body_text)      AS search_text,      -- للفهرسة فقط
  source_reference,
  authority_score,
  metadata,
  created_at
FROM search_index
WHERE content_type = 'quran_verse';

COMMENT ON VIEW quran_search_index IS
  'عرض فهرس القرآن — ayah_text يُعرض حرفياً بتشكيله الكامل، search_text للفهرسة فقط';

-- ─── 9. دالة مساعدة: بحث موحد مع حماية is_approved ─────────────────
--
--  search_content(query, content_types, lim, off)
--  — تُطبّع الاستعلام بـ normalize_ar()
--  — تبحث بـ ilike على search_text في كل جدول
--  — تفرض status = 'approved'/'published' لكل جدول
--  — لا تُظهر محتوى غير معتمد أبداً
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_content(
  p_query        text,
  p_types        text[]   DEFAULT ARRAY['lesson','library','hadith','fatwa','qa','fawaid','miracle','story','fiqh'],
  p_limit        integer  DEFAULT 20,
  p_offset       integer  DEFAULT 0
)
RETURNS TABLE (
  id             text,
  content_type   text,
  title          text,
  summary        text,
  meta           text,
  href           text,
  score          numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_norm     text;
  v_pattern  text;
BEGIN
  v_norm    := normalize_ar(p_query);
  IF v_norm = '' THEN RETURN; END IF;
  v_pattern := '%' || v_norm || '%';

  -- الدروس
  IF 'lesson' = ANY(p_types) THEN
    RETURN QUERY
    SELECT
      l.id::text,
      'lesson'::text,
      l.title,
      COALESCE(l.description, '')::text,
      COALESCE(l.speaker_name, l.category, '')::text,
      ('/lessons/' || l.id)::text,
      0.9::numeric
    FROM lessons l
    WHERE l.status = 'approved'
      AND l.search_text ILIKE v_pattern
    ORDER BY l.updated_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;

  -- المكتبة
  IF 'library' = ANY(p_types) THEN
    RETURN QUERY
    SELECT
      li.id::text,
      'library'::text,
      li.title,
      COALESCE(li.description, '')::text,
      COALESCE(li.category, li.type, '')::text,
      ('/library/' || li.id)::text,
      0.85::numeric
    FROM library_items li
    WHERE li.status = 'approved'
      AND li.search_text ILIKE v_pattern
    ORDER BY li.created_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;

  -- الأحاديث
  IF 'hadith' = ANY(p_types) THEN
    RETURN QUERY
    SELECT
      vh.id::text,
      'hadith'::text,
      COALESCE(vh.title, vh.text)::text,
      COALESCE(vh.text, '')::text,
      COALESCE(vh.narrator, vh.collection, '')::text,
      '/hadith'::text,
      0.95::numeric
    FROM verified_hadith_items vh
    WHERE vh.status = 'published'
      AND vh.search_text ILIKE v_pattern
    ORDER BY vh.created_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;

  -- الأسئلة والأجوبة
  IF 'qa' = ANY(p_types) THEN
    RETURN QUERY
    SELECT
      q.id::text,
      'qa'::text,
      q.question::text,
      COALESCE(q.answer, '')::text,
      ''::text,
      '/qa'::text,
      0.8::numeric
    FROM qa_questions q
    WHERE q.status = 'published'
      AND q.search_text ILIKE v_pattern
    ORDER BY q.created_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;

  -- الفوائد
  IF 'fawaid' = ANY(p_types) THEN
    RETURN QUERY
    SELECT
      f.id::text,
      'fawaid'::text,
      COALESCE(f.text, '')::text,
      ''::text,
      COALESCE(f.author_name, '')::text,
      '/fawaid'::text,
      0.75::numeric
    FROM fawaid f
    WHERE f.status = 'approved'
      AND f.search_text ILIKE v_pattern
    ORDER BY f.created_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;

  -- الإعجاز العلمي
  IF 'miracle' = ANY(p_types) THEN
    RETURN QUERY
    SELECT
      sm.id::text,
      'miracle'::text,
      sm.title,
      COALESCE(sm.body, '')::text,
      COALESCE(sm.category, '')::text,
      '/miracles'::text,
      0.8::numeric
    FROM scientific_miracles sm
    WHERE sm.status = 'approved'
      AND sm.search_text ILIKE v_pattern
    ORDER BY sm.created_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;

  -- القصص الإسلامية
  IF 'story' = ANY(p_types) THEN
    RETURN QUERY
    SELECT
      aks.id::text,
      'story'::text,
      aks.title,
      COALESCE(aks.summary, '')::text,
      COALESCE(aks.category, '')::text,
      '/stories'::text,
      0.7::numeric
    FROM akp_stories aks
    WHERE aks.status = 'published'
      AND aks.search_text ILIKE v_pattern
    ORDER BY aks.created_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;

  -- المجمع الفقهي
  IF 'fiqh' = ANY(p_types) THEN
    RETURN QUERY
    SELECT
      fci.slug::text,
      'fiqh_decision'::text,
      fci.title,
      COALESCE(fci.summary, '')::text,
      COALESCE(fci.category, fci.type, '')::text,
      ('/fiqh-council/' || fci.slug)::text,
      0.9::numeric
    FROM fiqh_council_items fci
    WHERE fci.status = 'published'
      AND fci.search_text ILIKE v_pattern
    ORDER BY fci.created_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;

END;
$$;

GRANT EXECUTE ON FUNCTION search_content TO authenticated, anon;

-- انتهى — unified_search_index_v1.sql
