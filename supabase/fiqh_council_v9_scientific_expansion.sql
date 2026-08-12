-- =====================================================================
--  المجلس العلمي — المجمع الفقهي v9 (التوسّع العلمي والتحقق المنهجي)
--  آمن — لا يحذف البيانات الحالية
--  نفّذ بعد: fiqh_council_v8_research_assistant.sql
-- =====================================================================

-- ── 1. مستوى التوثيق على العناصر ───────────────────────────────────────
ALTER TABLE fiqh_council_items
  ADD COLUMN IF NOT EXISTS documentation_level TEXT
    CHECK (documentation_level IN (
      'official_verified',
      'imported_needs_review',
      'admin_summary',
      'rejected',
      'archived'
    ));

UPDATE fiqh_council_items SET documentation_level = CASE
  WHEN status = 'rejected' THEN 'rejected'
  WHEN status = 'archived' THEN 'archived'
  WHEN confidence_level = 'source_verified' AND source_name IS NOT NULL AND source_url IS NOT NULL
    THEN 'official_verified'
  WHEN summary_source = 'admin' THEN 'admin_summary'
  ELSE 'imported_needs_review'
END
WHERE documentation_level IS NULL;

-- ── 2. المسائل الفقهية ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_issues (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  summary           TEXT,
  description       TEXT,
  category          TEXT NOT NULL,
  subcategory       TEXT,
  ruling_summary    TEXT,
  evidence_summary  TEXT,
  documentation_level TEXT NOT NULL DEFAULT 'imported_needs_review'
    CHECK (documentation_level IN (
      'official_verified',
      'imported_needs_review',
      'admin_summary',
      'rejected',
      'archived'
    )),
  status            TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'published', 'archived')),
  views_count       INT NOT NULL DEFAULT 0,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiqh_issues_status_idx ON fiqh_council_issues (status, published_at DESC);
CREATE INDEX IF NOT EXISTS fiqh_issues_category_idx ON fiqh_council_issues (category);
CREATE INDEX IF NOT EXISTS fiqh_issues_slug_idx ON fiqh_council_issues (slug);

-- ── 3. ربط المسائل بالمواد ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_issue_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    UUID NOT NULL REFERENCES fiqh_council_issues(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  link_type   TEXT NOT NULL DEFAULT 'related'
    CHECK (link_type IN ('resolution', 'fatwa', 'research', 'recommendation', 'ruling', 'related')),
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (issue_id, item_id)
);

CREATE INDEX IF NOT EXISTS fiqh_issue_items_issue_idx ON fiqh_issue_items (issue_id);
CREATE INDEX IF NOT EXISTS fiqh_issue_items_item_idx ON fiqh_issue_items (item_id);

-- ── 4. خط زمني للمسائل ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_issue_timeline_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    UUID NOT NULL REFERENCES fiqh_council_issues(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL
    CHECK (event_type IN (
      'first_research',
      'first_resolution',
      'later_resolution',
      'recommendation',
      'update',
      'statement',
      'other'
    )),
  title       TEXT NOT NULL,
  description TEXT,
  event_date  DATE,
  item_id     UUID REFERENCES fiqh_council_items(id) ON DELETE SET NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiqh_timeline_issue_idx ON fiqh_issue_timeline_events (issue_id, event_date DESC);

-- ── 5. علاقات مقترحة (مراجعة إدارية) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_suggested_relations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id           UUID NOT NULL REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  related_item_id   UUID NOT NULL REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  similarity_score  NUMERIC(5,4) NOT NULL DEFAULT 0,
  match_reasons     JSONB NOT NULL DEFAULT '[]',
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
  reviewed_by       TEXT,
  review_notes      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at       TIMESTAMPTZ,
  UNIQUE (item_id, related_item_id)
);

CREATE INDEX IF NOT EXISTS fiqh_suggested_rel_status_idx
  ON fiqh_council_suggested_relations (status, created_at DESC);

-- ── 6. علاقات معتمدة ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_relations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  related_item_id UUID NOT NULL REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  relation_type   TEXT NOT NULL DEFAULT 'related'
    CHECK (relation_type IN ('similar', 'related', 'same_topic', 'same_source', 'same_category')),
  source          TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'auto_approved')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, related_item_id, relation_type)
);

CREATE INDEX IF NOT EXISTS fiqh_relations_item_idx ON fiqh_council_relations (item_id);

-- ── 7. RPC: إحصائيات عامة ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fiqh_council_public_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'resolutions', (SELECT COUNT(*) FROM fiqh_council_items WHERE status = 'published' AND type = 'resolution'),
    'fatwas', (SELECT COUNT(*) FROM fiqh_council_items WHERE status = 'published' AND type = 'fatwa'),
    'recommendations', (SELECT COUNT(*) FROM fiqh_council_items WHERE status = 'published' AND type = 'recommendation'),
    'research', (SELECT COUNT(*) FROM fiqh_council_items WHERE status = 'published' AND type = 'research'),
    'issues', (SELECT COUNT(*) FROM fiqh_council_issues WHERE status = 'published'),
    'pending_review', (SELECT COUNT(*) FROM fiqh_council_items WHERE status IN ('imported', 'needs_review', 'review', 'approved')),
    'top_categories', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT category, COUNT(*) AS cnt
        FROM fiqh_council_items
        WHERE status = 'published'
        GROUP BY category
        ORDER BY cnt DESC
        LIMIT 10
      ) t
    ),
    'top_viewed', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT slug, title, views_count, type, category
        FROM fiqh_council_items
        WHERE status = 'published'
        ORDER BY views_count DESC NULLS LAST
        LIMIT 8
      ) t
    ),
    'latest', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT slug, title, published_at, type, category
        FROM fiqh_council_items
        WHERE status = 'published'
        ORDER BY published_at DESC NULLS LAST
        LIMIT 8
      ) t
    ),
    'top_sources', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT source_name, COUNT(*) AS cnt
        FROM fiqh_council_items
        WHERE status = 'published' AND source_name IS NOT NULL
        GROUP BY source_name
        ORDER BY cnt DESC
        LIMIT 8
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- ── 8. RLS ───────────────────────────────────────────────────────────────
ALTER TABLE fiqh_council_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiqh_issue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiqh_issue_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiqh_council_suggested_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiqh_council_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fiqh_issues_public_read ON fiqh_council_issues;
CREATE POLICY fiqh_issues_public_read ON fiqh_council_issues
  FOR SELECT USING (
    status = 'published'
    AND documentation_level = 'official_verified'
  );

DROP POLICY IF EXISTS fiqh_issues_admin_all ON fiqh_council_issues;
CREATE POLICY fiqh_issues_admin_all ON fiqh_council_issues
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fiqh_issue_items_public_read ON fiqh_issue_items;
CREATE POLICY fiqh_issue_items_public_read ON fiqh_issue_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fiqh_council_issues i
      WHERE i.id = issue_id AND i.status = 'published'
        AND i.documentation_level = 'official_verified'
    )
  );

DROP POLICY IF EXISTS fiqh_issue_items_admin_all ON fiqh_issue_items;
CREATE POLICY fiqh_issue_items_admin_all ON fiqh_issue_items
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fiqh_timeline_public_read ON fiqh_issue_timeline_events;
CREATE POLICY fiqh_timeline_public_read ON fiqh_issue_timeline_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fiqh_council_issues i
      WHERE i.id = issue_id AND i.status = 'published'
        AND i.documentation_level = 'official_verified'
    )
  );

DROP POLICY IF EXISTS fiqh_timeline_admin_all ON fiqh_issue_timeline_events;
CREATE POLICY fiqh_timeline_admin_all ON fiqh_issue_timeline_events
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fiqh_suggested_rel_admin ON fiqh_council_suggested_relations;
CREATE POLICY fiqh_suggested_rel_admin ON fiqh_council_suggested_relations
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fiqh_relations_public_read ON fiqh_council_relations;
CREATE POLICY fiqh_relations_public_read ON fiqh_council_relations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fiqh_council_items a, fiqh_council_items b
      WHERE a.id = item_id AND b.id = related_item_id
        AND a.status = 'published' AND b.status = 'published'
    )
  );

DROP POLICY IF EXISTS fiqh_relations_admin ON fiqh_council_relations;
CREATE POLICY fiqh_relations_admin ON fiqh_council_relations
  FOR ALL USING (auth.role() = 'authenticated');

GRANT EXECUTE ON FUNCTION fiqh_council_public_stats() TO anon, authenticated;
