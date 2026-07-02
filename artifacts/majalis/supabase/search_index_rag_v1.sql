-- =====================================================================
--  محرك الباحث الشرعي — البنية التحتية الموحدة (search_index_rag_v1.sql)
--  المراحل 1-3: فهرس البحث + الاستعلامات البحثية + مكتبة المستخدم
-- =====================================================================

-- ─── 1. فهرس البحث الموحد ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS search_index (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      text         NOT NULL,
  content_type    text         NOT NULL CHECK (content_type IN (
                                 'quran_verse', 'hadith', 'tafsir',
                                 'fatwa', 'book', 'lesson', 'article',
                                 'story', 'quote', 'benefit', 'dhikr',
                                 'ruling', 'fiqh_decision'
                               )),
  title           text         NOT NULL DEFAULT '',
  body_text       text         NOT NULL DEFAULT '',
  source_reference text        NOT NULL DEFAULT '',
  source_url      text         NOT NULL DEFAULT '',
  -- درجة المصدر: كلما زادت كان المصدر أوثق في الترتيب
  authority_score numeric(4,2) NOT NULL DEFAULT 50.00
                               CHECK (authority_score >= 0 AND authority_score <= 100),
  metadata        jsonb        NOT NULL DEFAULT '{}',
  -- tsvector محسوبة تلقائياً من العنوان + النص
  ts_body         tsvector     GENERATED ALWAYS AS (
                   to_tsvector('simple',
                     coalesce(title, '') || ' ' || coalesce(body_text, ''))
                 ) STORED,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now(),

  UNIQUE (content_id, content_type)
);

-- GIN index للبحث الكامل
CREATE INDEX IF NOT EXISTS idx_search_index_ts
  ON search_index USING gin(ts_body);

-- Index للبحث حسب النوع
CREATE INDEX IF NOT EXISTS idx_search_index_type
  ON search_index (content_type);

-- Index لترتيب النتائج
CREATE INDEX IF NOT EXISTS idx_search_index_authority
  ON search_index (authority_score DESC);

-- Index للتحديثات الدورية
CREATE INDEX IF NOT EXISTS idx_search_index_updated
  ON search_index (updated_at DESC);

-- ─── 2. جدول تسجيل الاستعلامات البحثية (للتدقيق والتحسين) ────────────────────

CREATE TABLE IF NOT EXISTS research_queries (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id          text        NOT NULL DEFAULT '',
  query_text          text        NOT NULL,
  intent              text        NOT NULL DEFAULT 'general',
  retrieved_sources   jsonb       NOT NULL DEFAULT '[]',
  generated_answer    text        NOT NULL DEFAULT '',
  answer_quality      text        CHECK (answer_quality IN ('full', 'partial', 'no_sources', 'blocked')),
  content_types_used  text[]      NOT NULL DEFAULT '{}',
  duration_ms         integer,
  from_cache          boolean     NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_queries_user
  ON research_queries (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_queries_session
  ON research_queries (session_id, created_at DESC);

-- ─── 3. مكتبة أبحاث المستخدم ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_research_library (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  research_query_id   uuid        REFERENCES research_queries(id) ON DELETE SET NULL,
  title               text        NOT NULL,
  query_text          text        NOT NULL DEFAULT '',
  answer_snapshot     text        NOT NULL DEFAULT '',
  sources_snapshot    jsonb       NOT NULL DEFAULT '[]',
  tags                text[]      NOT NULL DEFAULT '{}',
  personal_notes      text        NOT NULL DEFAULT '',
  saved_at            timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_research_library_user
  ON user_research_library (user_id, saved_at DESC);

-- ─── 4. دالة البحث الموحد (FTS + تصفية حسب النوع) ──────────────────────────

CREATE OR REPLACE FUNCTION search_unified_rag(
  p_query       text,
  p_types       text[]    DEFAULT NULL,
  p_limit       integer   DEFAULT 15
)
RETURNS TABLE (
  id              uuid,
  content_id      text,
  content_type    text,
  title           text,
  body_text       text,
  source_reference text,
  source_url      text,
  authority_score numeric,
  metadata        jsonb,
  rank            real
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    si.id,
    si.content_id,
    si.content_type,
    si.title,
    si.body_text,
    si.source_reference,
    si.source_url,
    si.authority_score,
    si.metadata,
    (
      -- نقاط تشابه النص
      ts_rank_cd(si.ts_body, websearch_to_tsquery('simple', p_query), 32) * 40.0
      -- مكافأة درجة المصدر
      + (si.authority_score / 100.0) * 60.0
    )::real AS rank
  FROM search_index si
  WHERE
    si.ts_body @@ websearch_to_tsquery('simple', p_query)
    AND (p_types IS NULL OR si.content_type = ANY(p_types))
  ORDER BY rank DESC
  LIMIT p_limit;
$$;

-- ─── 5. دالة البحث الجزئي بـ ILIKE (احتياط عند قصر الاستعلام) ──────────────

CREATE OR REPLACE FUNCTION search_unified_rag_partial(
  p_query       text,
  p_types       text[]    DEFAULT NULL,
  p_limit       integer   DEFAULT 10
)
RETURNS TABLE (
  id              uuid,
  content_id      text,
  content_type    text,
  title           text,
  body_text       text,
  source_reference text,
  source_url      text,
  authority_score numeric,
  metadata        jsonb,
  rank            real
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    si.id,
    si.content_id,
    si.content_type,
    si.title,
    si.body_text,
    si.source_reference,
    si.source_url,
    si.authority_score,
    si.metadata,
    (si.authority_score / 100.0 * 60.0)::real AS rank
  FROM search_index si
  WHERE
    (si.title ILIKE '%' || p_query || '%' OR si.body_text ILIKE '%' || p_query || '%')
    AND (p_types IS NULL OR si.content_type = ANY(p_types))
  ORDER BY rank DESC
  LIMIT p_limit;
$$;

-- ─── 6. دالة استرجاع الكيانات المرتبطة من الرسم البياني ─────────────────────

CREATE OR REPLACE FUNCTION get_related_entities(
  p_content_id    text,
  p_content_type  text,
  p_depth         integer DEFAULT 2
)
RETURNS TABLE (
  node_id         uuid,
  node_type       text,
  node_label      text,
  node_desc       text,
  relationship    text,
  strength        numeric,
  depth           integer
)
LANGUAGE sql
STABLE
AS $$
  -- البحث في kn_nodes حسب external_id أو slug أو الوصف
  WITH RECURSIVE graph(node_id, node_type, node_label, node_desc, rel, strength, depth) AS (
    -- نقطة البداية: ابحث عن nodes ترتبط بـ content_id
    SELECT
      n.id,
      n.node_type,
      n.label,
      n.description,
      'direct'::text,
      1.0::numeric,
      0
    FROM kn_nodes n
    WHERE
      n.external_id = p_content_id
      OR n.node_type = p_content_type

    UNION ALL

    -- التوسع عبر الحواف
    SELECT
      CASE WHEN e.source_node_id = g.node_id THEN e.target_node_id
           ELSE e.source_node_id END,
      CASE WHEN e.source_node_id = g.node_id THEN nt.node_type
           ELSE ns.node_type END,
      CASE WHEN e.source_node_id = g.node_id THEN nt.label
           ELSE ns.label END,
      CASE WHEN e.source_node_id = g.node_id THEN nt.description
           ELSE ns.description END,
      e.relationship_type,
      e.strength,
      g.depth + 1
    FROM graph g
    JOIN kn_edges e
      ON e.source_node_id = g.node_id OR e.target_node_id = g.node_id
    JOIN kn_nodes ns ON ns.id = e.source_node_id
    JOIN kn_nodes nt ON nt.id = e.target_node_id
    WHERE g.depth < p_depth
      AND g.depth < 3
  )
  SELECT DISTINCT
    node_id,
    node_type,
    node_label,
    node_desc,
    rel AS relationship,
    strength,
    MIN(depth) AS depth
  FROM graph
  GROUP BY node_id, node_type, node_label, node_desc, rel, strength
  ORDER BY strength DESC, depth ASC
  LIMIT 30;
$$;

-- ─── 7. دالة تعبئة search_index من جداول المحتوى الموجودة ──────────────────

CREATE OR REPLACE FUNCTION populate_search_index_from_all()
RETURNS TABLE (content_type text, inserted integer, updated integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _ins integer := 0;
  _upd integer := 0;
BEGIN
  -- ❶ الأحاديث الموثقة
  WITH upserted AS (
    INSERT INTO search_index (content_id, content_type, title, body_text,
                              source_reference, source_url, authority_score, metadata)
    SELECT
      h.id::text,
      'hadith',
      coalesce(h.title, LEFT(h.text, 80)) AS title,
      h.text AS body_text,
      coalesce(h.source_name, 'حديث') AS source_reference,
      coalesce(h.source_url, '') AS source_url,
      CASE
        WHEN h.grade ILIKE '%صحيح%'  THEN 95.0
        WHEN h.grade ILIKE '%حسن%'   THEN 80.0
        WHEN h.grade ILIKE '%ضعيف%'  THEN 40.0
        ELSE 65.0
      END AS authority_score,
      jsonb_build_object(
        'grade', h.grade,
        'narrator', h.narrator,
        'chapter', h.chapter,
        'hadith_number', h.hadith_number,
        'scholar', h.scholar
      ) AS metadata
    FROM verified_hadith_items h
    WHERE h.text IS NOT NULL AND h.text != ''
      AND (h.deleted_at IS NULL OR h.deleted_at > now())
    ON CONFLICT (content_id, content_type) DO UPDATE
      SET body_text        = EXCLUDED.body_text,
          authority_score  = EXCLUDED.authority_score,
          metadata         = EXCLUDED.metadata,
          updated_at       = now()
    RETURNING (xmax = 0) AS was_inserted
  )
  SELECT
    count(*) FILTER (WHERE was_inserted) INTO _ins
  FROM upserted;

  RETURN QUERY SELECT 'hadith'::text, _ins, 0;
  _ins := 0;

  -- ❷ الدروس
  WITH upserted AS (
    INSERT INTO search_index (content_id, content_type, title, body_text,
                              source_reference, source_url, authority_score, metadata)
    SELECT
      l.id::text,
      'lesson',
      l.title AS title,
      coalesce(l.description, l.title) AS body_text,
      coalesce(l.sheikh, l.speaker, 'درس علمي') AS source_reference,
      '' AS source_url,
      72.0 AS authority_score,
      jsonb_build_object(
        'sheikh', l.sheikh,
        'category', l.category,
        'mosque', l.mosque,
        'region', l.region
      ) AS metadata
    FROM lessons l
    WHERE l.title IS NOT NULL AND l.title != ''
    ON CONFLICT (content_id, content_type) DO UPDATE
      SET body_text   = EXCLUDED.body_text,
          metadata    = EXCLUDED.metadata,
          updated_at  = now()
    RETURNING (xmax = 0) AS was_inserted
  )
  SELECT count(*) FILTER (WHERE was_inserted) INTO _ins FROM upserted;

  RETURN QUERY SELECT 'lesson'::text, _ins, 0;
  _ins := 0;

  -- ❸ الفوائد
  WITH upserted AS (
    INSERT INTO search_index (content_id, content_type, title, body_text,
                              source_reference, source_url, authority_score, metadata)
    SELECT
      f.id::text,
      'benefit',
      coalesce(f.title, LEFT(f.text, 80)) AS title,
      coalesce(f.text, '') AS body_text,
      coalesce(f.author, f.source, 'فائدة') AS source_reference,
      '' AS source_url,
      68.0 AS authority_score,
      jsonb_build_object(
        'author', f.author,
        'source', f.source,
        'category', f.category
      ) AS metadata
    FROM fawaid f
    WHERE coalesce(f.text, f.title) IS NOT NULL
    ON CONFLICT (content_id, content_type) DO UPDATE
      SET body_text  = EXCLUDED.body_text,
          updated_at = now()
    RETURNING (xmax = 0) AS was_inserted
  )
  SELECT count(*) FILTER (WHERE was_inserted) INTO _ins FROM upserted;

  RETURN QUERY SELECT 'benefit'::text, _ins, 0;
  _ins := 0;

  -- ❹ قرارات المجمع الفقهي (فتاوى)
  WITH upserted AS (
    INSERT INTO search_index (content_id, content_type, title, body_text,
                              source_reference, source_url, authority_score, metadata)
    SELECT
      fc.id::text,
      'fiqh_decision',
      fc.title AS title,
      coalesce(fc.ruling_text, fc.content, fc.summary, '') AS body_text,
      coalesce(fc.source_name, fc.council_name, 'مجمع فقهي') AS source_reference,
      coalesce(fc.source_url, '') AS source_url,
      CASE
        WHEN fc.confidence_level = 'source_verified' THEN 90.0
        WHEN fc.confidence_level = 'high'            THEN 80.0
        WHEN fc.confidence_level = 'medium'          THEN 65.0
        ELSE 55.0
      END AS authority_score,
      jsonb_build_object(
        'category',        fc.category,
        'type',            fc.type,
        'decision_number', fc.decision_number,
        'session_date',    fc.session_date,
        'council_name',    fc.council_name,
        'slug',            fc.slug
      ) AS metadata
    FROM fiqh_council_items fc
    WHERE fc.status = 'published'
      AND fc.title IS NOT NULL
    ON CONFLICT (content_id, content_type) DO UPDATE
      SET body_text        = EXCLUDED.body_text,
          authority_score  = EXCLUDED.authority_score,
          metadata         = EXCLUDED.metadata,
          updated_at       = now()
    RETURNING (xmax = 0) AS was_inserted
  )
  SELECT count(*) FILTER (WHERE was_inserted) INTO _ins FROM upserted;

  RETURN QUERY SELECT 'fiqh_decision'::text, _ins, 0;
  _ins := 0;

  -- ❺ الكتب من المكتبة
  WITH upserted AS (
    INSERT INTO search_index (content_id, content_type, title, body_text,
                              source_reference, source_url, authority_score, metadata)
    SELECT
      li.id::text,
      'book',
      li.title AS title,
      coalesce(li.description, li.title) AS body_text,
      coalesce(li.author, 'مؤلف') AS source_reference,
      coalesce(li.external_url, li.file_url, '') AS source_url,
      75.0 AS authority_score,
      jsonb_build_object(
        'author', li.author,
        'category', li.category,
        'type', li.type
      ) AS metadata
    FROM library_items li
    WHERE li.title IS NOT NULL AND li.title != ''
    ON CONFLICT (content_id, content_type) DO UPDATE
      SET body_text  = EXCLUDED.body_text,
          updated_at = now()
    RETURNING (xmax = 0) AS was_inserted
  )
  SELECT count(*) FILTER (WHERE was_inserted) INTO _ins FROM upserted;

  RETURN QUERY SELECT 'book'::text, _ins, 0;
  _ins := 0;

  -- ❻ عقد المعرفة (kn_nodes)
  WITH upserted AS (
    INSERT INTO search_index (content_id, content_type, title, body_text,
                              source_reference, source_url, authority_score, metadata)
    SELECT
      n.id::text,
      CASE n.node_type
        WHEN 'scholar'    THEN 'article'
        WHEN 'concept'    THEN 'article'
        WHEN 'ruling'     THEN 'ruling'
        WHEN 'verse'      THEN 'quran_verse'
        WHEN 'hadith'     THEN 'hadith'
        WHEN 'book'       THEN 'book'
        ELSE 'article'
      END AS content_type,
      n.label AS title,
      coalesce(n.description, n.label) AS body_text,
      'المجلس العلمي — المعرفة الإسلامية' AS source_reference,
      '' AS source_url,
      70.0 AS authority_score,
      jsonb_build_object('node_type', n.node_type, 'slug', n.slug) AS metadata
    FROM kn_nodes n
    WHERE n.label IS NOT NULL AND n.label != ''
    ON CONFLICT (content_id, content_type) DO UPDATE
      SET body_text  = EXCLUDED.body_text,
          updated_at = now()
    RETURNING (xmax = 0) AS was_inserted
  )
  SELECT count(*) FILTER (WHERE was_inserted) INTO _ins FROM upserted;

  RETURN QUERY SELECT 'knowledge_node'::text, _ins, 0;
END;
$$;

-- ─── 8. RLS ─────────────────────────────────────────────────────────────────

ALTER TABLE search_index            ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_queries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_research_library   ENABLE ROW LEVEL SECURITY;

-- search_index: قراءة عامة
CREATE POLICY "public read search_index"
  ON search_index FOR SELECT USING (true);

-- search_index: كتابة للخدمة فقط (service_role)
CREATE POLICY "service write search_index"
  ON search_index FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- research_queries: المستخدم يقرأ سجلاته فقط
CREATE POLICY "user read own research_queries"
  ON research_queries FOR SELECT
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "service insert research_queries"
  ON research_queries FOR INSERT
  WITH CHECK (true);

-- user_research_library: المستخدم يدير مكتبته
CREATE POLICY "user manages own library"
  ON user_research_library FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── GRANT ───────────────────────────────────────────────────────────────────

GRANT SELECT ON search_index TO anon, authenticated;
GRANT ALL    ON search_index TO service_role;
GRANT SELECT, INSERT ON research_queries TO authenticated, anon;
GRANT ALL    ON research_queries TO service_role;
GRANT ALL    ON user_research_library TO authenticated;
GRANT ALL    ON user_research_library TO service_role;
