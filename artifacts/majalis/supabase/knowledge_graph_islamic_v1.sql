-- ═══════════════════════════════════════════════════════════════════════════
-- الرسم البياني المعرفي الإسلامي — Islamic Knowledge Graph v1
-- ═══════════════════════════════════════════════════════════════════════════
--
-- الجداول:
--   kn_nodes       — عقد المعرفة (آيات، أحاديث، فتاوى، علماء، كتب، ...)
--   kn_edges       — العلاقات الدلالية بين العقد
--   kn_tags        — الوسوم الموضوعية
--   kn_node_tags   — ربط العقد بالوسوم (many-to-many)
--
-- قيد الأمانة الدينية:
--   لا تُنشأ أي علاقة إلا بإدخال يدوي من مشرف أو استيراد من مصدر موثق.
--   حقل verified_by إلزامي — لا علاقة بلا مصدر.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. kn_nodes: عقد المعرفة ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kn_nodes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  node_type    text        NOT NULL CHECK (node_type IN (
                             'quran_ayah',    -- آية قرآنية
                             'hadith',        -- حديث نبوي
                             'fatwa',         -- فتوى شرعية
                             'scholar',       -- عالم / شيخ
                             'book',          -- كتاب
                             'lesson',        -- درس علمي
                             'benefit',       -- فائدة
                             'prophet_story', -- قصة نبي
                             'term'           -- مصطلح شرعي
                           )),
  reference_id text,        -- معرّف السجل الأصلي في جدوله (lessons.id, books.id, ...)
  title        text        NOT NULL,
  summary      text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kn_nodes_type       ON kn_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_kn_nodes_ref        ON kn_nodes(reference_id);
CREATE INDEX IF NOT EXISTS idx_kn_nodes_title_trgm ON kn_nodes USING gin(title gin_trgm_ops)
  WHERE pg_catalog.to_tsvector('arabic', title) IS NOT NULL;

-- تحديث updated_at تلقائي
CREATE OR REPLACE FUNCTION set_kn_nodes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_kn_nodes_updated_at ON kn_nodes;
CREATE TRIGGER trg_kn_nodes_updated_at
  BEFORE UPDATE ON kn_nodes
  FOR EACH ROW EXECUTE FUNCTION set_kn_nodes_updated_at();


-- ── 2. kn_edges: العلاقات الدلالية ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS kn_edges (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id    uuid        NOT NULL REFERENCES kn_nodes(id) ON DELETE CASCADE,
  target_node_id    uuid        NOT NULL REFERENCES kn_nodes(id) ON DELETE CASCADE,
  relationship_type text        NOT NULL CHECK (relationship_type IN (
                                  'explains',          -- يشرح
                                  'references',        -- يستشهد بـ
                                  'authored_by',       -- من تأليف
                                  'related_topic',     -- نفس الموضوع
                                  'contradicts_view',  -- خلاف فقهي
                                  'prerequisite'       -- مقدمة لفهم
                                )),
  strength          numeric(3,2) NOT NULL DEFAULT 0.70
                    CHECK (strength >= 0 AND strength <= 1),
  verified_by       text        NOT NULL, -- مصدر الربط — إلزامي
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT kn_edges_no_self CHECK (source_node_id <> target_node_id),
  UNIQUE (source_node_id, target_node_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_kn_edges_source ON kn_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_kn_edges_target ON kn_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_kn_edges_type   ON kn_edges(relationship_type);
CREATE INDEX IF NOT EXISTS idx_kn_edges_strength ON kn_edges(strength DESC);


-- ── 3. kn_tags: الوسوم الموضوعية ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kn_tags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name_ar text NOT NULL UNIQUE,
  category    text NOT NULL CHECK (category IN (
                 'عقيدة', 'فقه', 'سيرة', 'أخلاق',
                 'تفسير', 'حديث', 'أذكار', 'تزكية',
                 'علوم القرآن', 'مصطلح'
               ))
);


-- ── 4. kn_node_tags: ربط العقد بالوسوم ──────────────────────────────────

CREATE TABLE IF NOT EXISTS kn_node_tags (
  node_id uuid NOT NULL REFERENCES kn_nodes(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES kn_tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (node_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_kn_node_tags_tag  ON kn_node_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_kn_node_tags_node ON kn_node_tags(node_id);


-- ── 5. RLS ────────────────────────────────────────────────────────────────

ALTER TABLE kn_nodes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE kn_edges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE kn_tags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE kn_node_tags ENABLE ROW LEVEL SECURITY;

-- قراءة عامة — لا تتطلب تسجيل دخول
DROP POLICY IF EXISTS kn_nodes_public_read ON kn_nodes;
CREATE POLICY kn_nodes_public_read ON kn_nodes FOR SELECT USING (true);

DROP POLICY IF EXISTS kn_edges_public_read ON kn_edges;
CREATE POLICY kn_edges_public_read ON kn_edges FOR SELECT USING (true);

DROP POLICY IF EXISTS kn_tags_public_read ON kn_tags;
CREATE POLICY kn_tags_public_read ON kn_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS kn_node_tags_public_read ON kn_node_tags;
CREATE POLICY kn_node_tags_public_read ON kn_node_tags FOR SELECT USING (true);

-- كتابة للمشرف فقط (admin / super_admin)
DROP POLICY IF EXISTS kn_nodes_admin_write ON kn_nodes;
CREATE POLICY kn_nodes_admin_write ON kn_nodes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS kn_edges_admin_write ON kn_edges;
CREATE POLICY kn_edges_admin_write ON kn_edges
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS kn_tags_admin_write ON kn_tags;
CREATE POLICY kn_tags_admin_write ON kn_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS kn_node_tags_admin_write ON kn_node_tags;
CREATE POLICY kn_node_tags_admin_write ON kn_node_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'super_admin'))
  );


-- ── 6. دالة مساعدة: جلب الرسم البياني لعقدة بعمق محدود ─────────────────

CREATE OR REPLACE FUNCTION get_node_subgraph(
  p_node_id uuid,
  p_depth   int DEFAULT 1
)
RETURNS TABLE (
  node_id       uuid,
  node_type     text,
  title         text,
  summary       text,
  reference_id  text,
  edge_id       uuid,
  source_id     uuid,
  target_id     uuid,
  rel_type      text,
  strength      numeric,
  verified_by   text,
  depth         int
) LANGUAGE plpgsql STABLE AS $$
DECLARE
  max_depth CONSTANT int := 3;
  actual_depth int := LEAST(p_depth, max_depth);
BEGIN
  RETURN QUERY
  WITH RECURSIVE graph(nid, eid, src, tgt, rel, str, vby, d) AS (
    -- المستوى الأول: العقدة المحورية نفسها
    SELECT
      n.id, NULL::uuid, NULL::uuid, NULL::uuid,
      NULL::text, NULL::numeric, NULL::text, 0
    FROM kn_nodes n
    WHERE n.id = p_node_id

    UNION ALL

    -- التوسع بالعلاقات
    SELECT
      CASE WHEN e.source_node_id = g.nid THEN e.target_node_id
           ELSE e.source_node_id END,
      e.id, e.source_node_id, e.target_node_id,
      e.relationship_type, e.strength, e.verified_by,
      g.d + 1
    FROM graph g
    JOIN kn_edges e
      ON (e.source_node_id = g.nid OR e.target_node_id = g.nid)
    WHERE g.d < actual_depth
  )
  SELECT DISTINCT ON (g.nid)
    g.nid, n.node_type, n.title, n.summary, n.reference_id,
    g.eid, g.src, g.tgt, g.rel, g.str, g.vby, g.d
  FROM graph g
  JOIN kn_nodes n ON n.id = g.nid
  ORDER BY g.nid, g.d;
END;
$$;
