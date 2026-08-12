-- =====================================================================
--  نظام التوصيات الذكي — مجالس (recommendations_v1.sql)
--  المراحل 1–4: بنية الوسوم، الرسم البياني، النقاط، ملف المستخدم
--  آمن للتشغيل مرات متعددة (IF NOT EXISTS / OR REPLACE)
-- =====================================================================

-- ════════════════════════════════════════════════════════════════════
--  المرحلة 1: بنية الوسوم والعلاقات
-- ════════════════════════════════════════════════════════════════════

-- الوسوم الموحدة لجميع أنواع المحتوى
CREATE TABLE IF NOT EXISTS content_tags (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name    TEXT        NOT NULL UNIQUE,
  tag_name_ar TEXT        NOT NULL,
  tag_type    TEXT        NOT NULL DEFAULT 'topic'
    CHECK (tag_type IN ('topic','scholar','era','ruling','quran_theme','hadith_theme','fiqh_chapter','general')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_tags_type ON content_tags (tag_type);
CREATE INDEX IF NOT EXISTS idx_content_tags_name ON content_tags (tag_name);

-- ربط الوسوم بالمحتوى (content_id هو TEXT لدعم UUID + TEXT IDs)
CREATE TABLE IF NOT EXISTS content_tag_relations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id   TEXT        NOT NULL,
  content_type TEXT        NOT NULL
    CHECK (content_type IN ('lesson','hadith','fatwa','benefit','book','scholar','qa','ruling','story','miracle','dhikr','quran_ayah')),
  tag_id       UUID        NOT NULL REFERENCES content_tags(id) ON DELETE CASCADE,
  weight       NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (weight BETWEEN 0 AND 1),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_id, content_type, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_ctr_content ON content_tag_relations (content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_ctr_tag    ON content_tag_relations (tag_id, weight DESC);

-- علاقات المحتوى (الرسم البياني المعرفي العام)
CREATE TABLE IF NOT EXISTS content_relationships (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id         TEXT        NOT NULL,
  source_type       TEXT        NOT NULL,
  target_id         TEXT        NOT NULL,
  target_type       TEXT        NOT NULL,
  relationship_type TEXT        NOT NULL DEFAULT 'related'
    CHECK (relationship_type IN ('related','prerequisite','continuation','scholar_authored','thematic')),
  weight            NUMERIC(3,2) NOT NULL DEFAULT 0.5 CHECK (weight BETWEEN 0 AND 1),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_id, source_type, target_id, target_type)
);

CREATE INDEX IF NOT EXISTS idx_cr_source  ON content_relationships (source_id, source_type, weight DESC);
CREATE INDEX IF NOT EXISTS idx_cr_target  ON content_relationships (target_id, target_type, weight DESC);
CREATE INDEX IF NOT EXISTS idx_cr_type    ON content_relationships (relationship_type);

-- ════════════════════════════════════════════════════════════════════
--  المرحلة 2: الرسم البياني المعرفي — دالة استعلام
-- ════════════════════════════════════════════════════════════════════

-- دالة get_related_content: محتوى مرتبط حتى عمق N
CREATE OR REPLACE FUNCTION get_related_content(
  p_source_id   TEXT,
  p_source_type TEXT,
  p_depth       INT DEFAULT 1
)
RETURNS TABLE (
  content_id   TEXT,
  content_type TEXT,
  rel_type     TEXT,
  weight       NUMERIC,
  depth        INT
)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  actual_depth INT := LEAST(p_depth, 3);
BEGIN
  RETURN QUERY
  WITH RECURSIVE graph(cid, ctype, rel, w, d) AS (
    SELECT p_source_id, p_source_type, NULL::TEXT, 1.0::NUMERIC, 0
    UNION ALL
    SELECT
      CASE WHEN cr.source_id = g.cid AND cr.source_type = g.ctype
           THEN cr.target_id ELSE cr.source_id END,
      CASE WHEN cr.source_id = g.cid AND cr.source_type = g.ctype
           THEN cr.target_type ELSE cr.source_type END,
      cr.relationship_type,
      cr.weight,
      g.d + 1
    FROM graph g
    JOIN content_relationships cr
      ON (cr.source_id = g.cid AND cr.source_type = g.ctype)
      OR (cr.target_id = g.cid AND cr.target_type = g.ctype)
    WHERE g.d < actual_depth
  )
  SELECT DISTINCT ON (g.cid, g.ctype)
    g.cid, g.ctype, g.rel, g.w, g.d
  FROM graph g
  WHERE NOT (g.cid = p_source_id AND g.ctype = p_source_type)
  ORDER BY g.cid, g.ctype, g.d;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
--  المرحلة 3: نقاط المحتوى (Content Scoring)
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content_scores (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      TEXT        NOT NULL,
  content_type    TEXT        NOT NULL,
  view_count      INT         NOT NULL DEFAULT 0,
  save_count      INT         NOT NULL DEFAULT 0,
  share_count     INT         NOT NULL DEFAULT 0,
  completion_rate NUMERIC(3,2)          DEFAULT 0,
  avg_read_sec    INT                   DEFAULT 0,
  quality_score   NUMERIC(6,2)          DEFAULT 0,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_id, content_type)
);

CREATE INDEX IF NOT EXISTS idx_cs_type_score ON content_scores (content_type, quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_cs_computed   ON content_scores (computed_at DESC);

-- ════════════════════════════════════════════════════════════════════
--  المرحلة 4: ملف اهتمامات المستخدم
-- ════════════════════════════════════════════════════════════════════

-- أحداث سلوك المستخدم (حدث واحد لكل تفاعل)
CREATE TABLE IF NOT EXISTS user_behavior_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type   TEXT        NOT NULL
    CHECK (event_type IN ('view','complete','save','search','follow_scholar','time_spent','share','bookmark_remove')),
  content_id   TEXT        NOT NULL,
  content_type TEXT        NOT NULL,
  value        NUMERIC              DEFAULT 1,
  metadata     JSONB                DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ube_user    ON user_behavior_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ube_content ON user_behavior_events (content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_ube_type    ON user_behavior_events (user_id, event_type);

-- ملف اهتمامات المستخدم (يُحدَّث تلقائياً عبر triggers أو API)
CREATE TABLE IF NOT EXISTS user_interest_profiles (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_id         UUID        NOT NULL REFERENCES content_tags(id) ON DELETE CASCADE,
  interest_score NUMERIC(7,2) NOT NULL DEFAULT 0,
  event_count    INT          NOT NULL DEFAULT 0,
  last_updated   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_uip_user       ON user_interest_profiles (user_id, interest_score DESC);
CREATE INDEX IF NOT EXISTS idx_uip_tag        ON user_interest_profiles (tag_id);
CREATE INDEX IF NOT EXISTS idx_uip_updated    ON user_interest_profiles (last_updated DESC);

-- مستوى المستخدم العلمي (يُحسب دورياً)
CREATE TABLE IF NOT EXISTS user_academic_levels (
  user_id        UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level          TEXT        NOT NULL DEFAULT 'beginner'
    CHECK (level IN ('beginner','intermediate','advanced')),
  level_score    NUMERIC(5,2) NOT NULL DEFAULT 0,
  top_tags       UUID[]       DEFAULT '{}',
  content_mix    JSONB        DEFAULT '{}',
  computed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════════
--  RLS: سياسات الأمن
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE content_tags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tag_relations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_relationships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interest_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_academic_levels   ENABLE ROW LEVEL SECURITY;

-- content_tags: قراءة عامة، كتابة للمشرفين
DROP POLICY IF EXISTS ct_public_read  ON content_tags;
DROP POLICY IF EXISTS ct_admin_write  ON content_tags;
CREATE POLICY ct_public_read  ON content_tags FOR SELECT USING (true);
CREATE POLICY ct_admin_write  ON content_tags FOR ALL USING (is_admin());

-- content_tag_relations: قراءة عامة، كتابة للمشرفين
DROP POLICY IF EXISTS ctr_public_read ON content_tag_relations;
DROP POLICY IF EXISTS ctr_admin_write ON content_tag_relations;
CREATE POLICY ctr_public_read ON content_tag_relations FOR SELECT USING (true);
CREATE POLICY ctr_admin_write ON content_tag_relations FOR ALL USING (is_admin());

-- content_relationships: قراءة عامة، كتابة للمشرفين
DROP POLICY IF EXISTS cr_public_read  ON content_relationships;
DROP POLICY IF EXISTS cr_admin_write  ON content_relationships;
CREATE POLICY cr_public_read  ON content_relationships FOR SELECT USING (true);
CREATE POLICY cr_admin_write  ON content_relationships FOR ALL USING (is_admin());

-- content_scores: قراءة عامة، كتابة للخدمة والمشرفين
DROP POLICY IF EXISTS cs_public_read  ON content_scores;
DROP POLICY IF EXISTS cs_service_write ON content_scores;
CREATE POLICY cs_public_read  ON content_scores FOR SELECT USING (true);
CREATE POLICY cs_service_write ON content_scores FOR ALL
  USING (auth.role() = 'service_role' OR is_admin());

-- user_behavior_events: المستخدم يُدرج، الخدمة تقرأ
DROP POLICY IF EXISTS ube_user_insert ON user_behavior_events;
DROP POLICY IF EXISTS ube_service_read ON user_behavior_events;
DROP POLICY IF EXISTS ube_user_read ON user_behavior_events;
CREATE POLICY ube_user_insert ON user_behavior_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY ube_user_read ON user_behavior_events FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role' OR is_admin());
CREATE POLICY ube_user_delete ON user_behavior_events FOR DELETE
  USING (auth.uid() = user_id);

-- user_interest_profiles: المستخدم يقرأ ويحذف بياناته
DROP POLICY IF EXISTS uip_user_select ON user_interest_profiles;
DROP POLICY IF EXISTS uip_user_delete ON user_interest_profiles;
DROP POLICY IF EXISTS uip_service_all ON user_interest_profiles;
CREATE POLICY uip_user_select ON user_interest_profiles FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role' OR is_admin());
CREATE POLICY uip_user_delete ON user_interest_profiles FOR DELETE
  USING (auth.uid() = user_id);
CREATE POLICY uip_service_all ON user_interest_profiles FOR ALL
  USING (auth.role() = 'service_role' OR is_admin())
  WITH CHECK (auth.role() = 'service_role' OR is_admin());

-- user_academic_levels: المستخدم يقرأ
DROP POLICY IF EXISTS ual_user_select ON user_academic_levels;
DROP POLICY IF EXISTS ual_service_all ON user_academic_levels;
CREATE POLICY ual_user_select ON user_academic_levels FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY ual_service_all ON user_academic_levels FOR ALL
  USING (auth.role() = 'service_role' OR is_admin());

-- ════════════════════════════════════════════════════════════════════
--  دالة حساب تشابه اهتمامات المستخدمين (Collaborative Filtering)
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_similar_users(
  p_user_id UUID,
  p_limit   INT DEFAULT 10
)
RETURNS TABLE (similar_user_id UUID, similarity NUMERIC)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH my_tags AS (
    SELECT tag_id, interest_score
    FROM user_interest_profiles
    WHERE user_id = p_user_id AND interest_score > 0
    ORDER BY interest_score DESC
    LIMIT 20
  ),
  dot_products AS (
    SELECT
      uip.user_id  AS uid,
      SUM(my.interest_score * uip.interest_score) AS dot_product,
      SQRT(SUM(my.interest_score ^ 2)) * SQRT(SUM(uip.interest_score ^ 2)) AS magnitude
    FROM my_tags my
    JOIN user_interest_profiles uip ON uip.tag_id = my.tag_id
    WHERE uip.user_id != p_user_id AND uip.interest_score > 0
    GROUP BY uip.user_id
    HAVING COUNT(*) >= 2
  )
  SELECT
    uid,
    CASE WHEN magnitude > 0 THEN (dot_product / magnitude)::NUMERIC(4,3) ELSE 0 END AS similarity
  FROM dot_products
  ORDER BY similarity DESC
  LIMIT p_limit;
END;
$$;
