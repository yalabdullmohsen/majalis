-- =====================================================================
--  المجلس العلمي — المجمع الفقهي v7 (منظومة الفقه الذكية)
--  آمن — لا يحذف البيانات الحالية
--  نفّذ بعد: fiqh_council_v6_sync.sql
-- =====================================================================

-- ── 1. Expand fiqh_council_sources + alias fiqh_sources ─────────────────
ALTER TABLE fiqh_council_sources ADD COLUMN IF NOT EXISTS items_imported_count INT NOT NULL DEFAULT 0;
ALTER TABLE fiqh_council_sources ADD COLUMN IF NOT EXISTS last_error_log JSONB NOT NULL DEFAULT '[]';
ALTER TABLE fiqh_council_sources ADD COLUMN IF NOT EXISTS official_url TEXT;

UPDATE fiqh_council_sources SET official_url = base_url WHERE official_url IS NULL;

CREATE OR REPLACE VIEW fiqh_sources AS
SELECT
  id,
  slug,
  name,
  organization,
  source_type,
  COALESCE(official_url, base_url) AS official_url,
  base_url,
  feed_url,
  is_active,
  last_sync_at,
  items_imported_count,
  last_error_log,
  last_sync_status,
  trust_level,
  created_at,
  updated_at
FROM fiqh_council_sources;

INSERT INTO fiqh_council_sources (slug, name, organization, source_type, base_url, official_url, config, trust_level, is_active)
VALUES
  (
    'ifi-international',
    'مجمع الفقه الإسلامي الدولي',
    'منظمة المؤتمر الإسلامي',
    'rss',
    'https://www.iifa-aifi.org',
    'https://www.iifa-aifi.org/ar',
    '{"feed_url":"https://www.iifa-aifi.org/ar/rss","auto_publish":false}'::jsonb,
    'official',
    true
  ),
  (
    'senior-scholars',
    'هيئة كبار العلماء',
    'الرئاسة العامة للبحوث العلمية والإفتاء — السعودية',
    'manual',
    'https://www.alifta.gov.sa',
    'https://www.alifta.gov.sa',
    '{"auto_publish":false,"notes":"مصدر رسمي — يُفعّل عند توفر واجهة استيراد"}'::jsonb,
    'official',
    false
  ),
  (
    'permanent-committee',
    'اللجنة الدائمة للبحوث العلمية والإفتاء',
    'الرئاسة العامة للبحوث العلمية والإفتاء — السعودية',
    'manual',
    'https://www.alifta.gov.sa',
    'https://www.alifta.gov.sa',
    '{"auto_publish":false,"notes":"مصدر رسمي — يُفعّل عند توفر واجهة استيراد"}'::jsonb,
    'official',
    false
  ),
  (
    'islamic-fiqh-academy',
    'المجمع الفقهي الإسلامي — OIC',
    'منظمة التعاون الإسلامي',
    'json_manifest',
    'https://www.oic-oci.org',
    'https://www.oic-oci.org',
    '{"manifest_path":"data/fiqh-oic-manifest.json","auto_publish":false}'::jsonb,
    'official',
    false
  )
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Hierarchical categories ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES fiqh_categories(id) ON DELETE SET NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiqh_categories_parent_idx ON fiqh_categories (parent_id, sort_order);

INSERT INTO fiqh_categories (slug, name, parent_id, sort_order) VALUES
  ('ibadat', 'العبادات', NULL, 1),
  ('muamalat', 'المعاملات', NULL, 2),
  ('usra', 'الأسرة', NULL, 3),
  ('nawazil', 'النوازل المعاصرة', NULL, 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO fiqh_categories (slug, name, parent_id, sort_order)
SELECT v.slug, v.name, p.id, v.ord
FROM (VALUES
  ('tahara', 'الطهارة', 'ibadat', 1),
  ('salah', 'الصلاة', 'ibadat', 2),
  ('zakat', 'الزكاة', 'ibadat', 3),
  ('siyam', 'الصيام', 'ibadat', 4),
  ('hajj', 'الحج', 'ibadat', 5),
  ('buyu', 'البيوع', 'muamalat', 1),
  ('banks', 'البنوك', 'muamalat', 2),
  ('tamin', 'التأمين', 'muamalat', 3),
  ('invest', 'الاستثمار', 'muamalat', 4),
  ('companies', 'الشركات', 'muamalat', 5),
  ('nikah', 'النكاح', 'usra', 1),
  ('talaq', 'الطلاق', 'usra', 2),
  ('hadana', 'الحضانة', 'usra', 3),
  ('mirath', 'الميراث', 'usra', 4),
  ('medicine', 'الطب', 'nawazil', 1),
  ('economy', 'الاقتصاد', 'nawazil', 2),
  ('tech', 'التقنية', 'nawazil', 3),
  ('ai', 'الذكاء الاصطناعي', 'nawazil', 4),
  ('minorities', 'الأقليات المسلمة', 'nawazil', 5)
) AS v(slug, name, parent_slug, ord)
JOIN fiqh_categories p ON p.slug = v.parent_slug
ON CONFLICT (slug) DO NOTHING;

-- ── 3. Expand fiqh_council_items ─────────────────────────────────────────
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES fiqh_categories(id) ON DELETE SET NULL;
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES fiqh_categories(id) ON DELETE SET NULL;
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS decision_number TEXT;
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS key_points JSONB NOT NULL DEFAULT '[]';
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS confidence_level TEXT DEFAULT 'source_verified'
  CHECK (confidence_level IN ('high', 'medium', 'low', 'source_verified'));
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS summary_source TEXT DEFAULT 'source'
  CHECK (summary_source IN ('source', 'admin', 'auto'));
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS imported_content TEXT;
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS nawazil_topic TEXT;

CREATE INDEX IF NOT EXISTS fiqh_items_category_id_idx ON fiqh_council_items (category_id);
CREATE INDEX IF NOT EXISTS fiqh_items_subcategory_id_idx ON fiqh_council_items (subcategory_id);
CREATE INDEX IF NOT EXISTS fiqh_items_nawazil_topic_idx ON fiqh_council_items (nawazil_topic);
CREATE INDEX IF NOT EXISTS fiqh_items_decision_number_idx ON fiqh_council_items (decision_number);
CREATE INDEX IF NOT EXISTS fiqh_items_views_idx ON fiqh_council_items (views_count DESC);

-- Expand status values (keep legacy review)
ALTER TABLE fiqh_council_items DROP CONSTRAINT IF EXISTS fiqh_council_items_status_check;
ALTER TABLE fiqh_council_items ADD CONSTRAINT fiqh_council_items_status_check
  CHECK (status IN (
    'draft', 'imported', 'needs_review', 'review', 'approved',
    'published', 'archived', 'rejected'
  ));

UPDATE fiqh_council_items SET status = 'needs_review' WHERE status = 'review';

-- Relax category CHECK to allow hierarchical names
ALTER TABLE fiqh_council_items DROP CONSTRAINT IF EXISTS fiqh_council_items_category_check;

-- ── 4. Duplicate detection queue ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_duplicates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  candidate_id    UUID NOT NULL REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  similarity_score NUMERIC(5,4) NOT NULL DEFAULT 0,
  match_reasons   JSONB NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'merged', 'ignored')),
  resolved_by     UUID,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS fiqh_duplicates_status_idx ON fiqh_council_duplicates (status, created_at DESC);

-- ── 5. Audit log for approvals ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_audit (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID REFERENCES fiqh_council_items(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  actor_id    UUID,
  actor_email TEXT,
  from_status TEXT,
  to_status   TEXT,
  notes       TEXT,
  payload     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiqh_audit_item_idx ON fiqh_council_audit (item_id, created_at DESC);

ALTER TABLE fiqh_council_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiqh_council_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiqh_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fiqh_categories_public ON fiqh_categories;
CREATE POLICY fiqh_categories_public ON fiqh_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS fiqh_duplicates_admin ON fiqh_council_duplicates;
CREATE POLICY fiqh_duplicates_admin ON fiqh_council_duplicates
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fiqh_audit_admin ON fiqh_council_audit;
CREATE POLICY fiqh_audit_admin ON fiqh_council_audit
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ── 6. Advanced search RPC ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_fiqh_council_advanced(
  query text DEFAULT NULL,
  p_type text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_subcategory text DEFAULT NULL,
  p_source text DEFAULT NULL,
  p_year int DEFAULT NULL,
  p_tags text[] DEFAULT NULL,
  p_nawazil_topic text DEFAULT NULL,
  p_decision_number text DEFAULT NULL,
  result_limit int DEFAULT 30
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  q_norm text := normalize_ar(trim(coalesce(query, '')));
  q_like text := '%' || q_norm || '%';
BEGIN
  RETURN coalesce((
    SELECT json_agg(row_to_json(t) ORDER BY t.rank DESC, t.published_at DESC NULLS LAST)
    FROM (
      SELECT
        i.slug, i.title, i.type, i.category, i.subcategory, i.summary,
        i.source_name, i.source_url, i.session_date, i.session_number,
        i.decision_number, i.tags, i.published_at, i.views_count,
        i.nawazil_topic, i.ruling_text,
        (
          CASE WHEN length(q_norm) > 0 THEN
            ts_rank(i.search_vector, plainto_tsquery('simple', q_norm)) * 10
            + CASE WHEN normalize_ar(i.title) LIKE q_like THEN 5 ELSE 0 END
            + CASE WHEN normalize_ar(coalesce(i.decision_number, '')) LIKE q_like THEN 4 ELSE 0 END
            + CASE WHEN normalize_ar(coalesce(i.session_number, '')) LIKE q_like THEN 3 ELSE 0 END
          ELSE 1 END
          + (coalesce(i.views_count, 0)::float / 1000)
        ) AS rank
      FROM fiqh_council_items i
      WHERE i.status = 'published'
        AND i.archived_at IS NULL
        AND (p_type IS NULL OR i.type = p_type)
        AND (p_category IS NULL OR i.category = p_category OR i.category ILIKE p_category)
        AND (p_subcategory IS NULL OR i.subcategory = p_subcategory)
        AND (p_source IS NULL OR i.source_name ILIKE '%' || p_source || '%')
        AND (p_year IS NULL OR EXTRACT(YEAR FROM i.session_date) = p_year)
        AND (p_nawazil_topic IS NULL OR i.nawazil_topic = p_nawazil_topic)
        AND (p_decision_number IS NULL OR i.decision_number ILIKE '%' || p_decision_number || '%')
        AND (p_tags IS NULL OR i.tags && p_tags)
        AND (
          length(q_norm) < 1
          OR normalize_ar(i.title) LIKE q_like
          OR normalize_ar(coalesce(i.summary, '')) LIKE q_like
          OR normalize_ar(coalesce(i.content, '')) LIKE q_like
          OR normalize_ar(coalesce(i.ruling_text, '')) LIKE q_like
          OR normalize_ar(coalesce(i.source_name, '')) LIKE q_like
          OR normalize_ar(coalesce(i.category, '')) LIKE q_like
          OR normalize_ar(coalesce(i.subcategory, '')) LIKE q_like
          OR normalize_ar(coalesce(i.decision_number, '')) LIKE q_like
          OR normalize_ar(coalesce(i.session_number, '')) LIKE q_like
          OR i.search_vector @@ plainto_tsquery('simple', q_norm)
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(i.evidence) e
            WHERE normalize_ar(coalesce(e->>'text', '')) LIKE q_like
          )
        )
      ORDER BY rank DESC, i.published_at DESC NULLS LAST
      LIMIT result_limit
    ) t
  ), '[]'::json);
END;
$$;

-- Update basic search to exclude non-published
CREATE OR REPLACE FUNCTION search_fiqh_council(query text, result_limit int DEFAULT 20)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN search_fiqh_council_advanced(query, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, result_limit);
END;
$$;

-- ── 7. Update sync upsert for new statuses ────────────────────────────────
CREATE OR REPLACE FUNCTION fiqh_council_sync_upsert(
  p_source_id uuid,
  p_external_id text,
  p_title text,
  p_slug text,
  p_type text,
  p_category text,
  p_summary text,
  p_content text,
  p_ruling_text text,
  p_source_name text,
  p_source_url text,
  p_session_date date,
  p_tags text[],
  p_content_hash text,
  p_sync_job_id uuid,
  p_subcategory text DEFAULT NULL,
  p_decision_number text DEFAULT NULL,
  p_nawazil_topic text DEFAULT NULL,
  p_imported_content text DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  existing_id uuid;
  result_action text;
  result_id uuid;
BEGIN
  SELECT id INTO existing_id
  FROM fiqh_council_items
  WHERE source_id = p_source_id AND external_id = p_external_id
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    UPDATE fiqh_council_items SET
      title = p_title,
      slug = p_slug,
      type = p_type,
      category = p_category,
      subcategory = coalesce(p_subcategory, subcategory),
      summary = p_summary,
      content = p_content,
      ruling_text = p_ruling_text,
      source_name = p_source_name,
      source_url = p_source_url,
      session_date = p_session_date,
      tags = coalesce(p_tags, '{}'),
      content_hash = p_content_hash,
      last_synced_at = now(),
      sync_job_id = p_sync_job_id,
      validation_status = 'needs_review',
      decision_number = coalesce(p_decision_number, decision_number),
      nawazil_topic = coalesce(p_nawazil_topic, nawazil_topic),
      imported_content = coalesce(p_imported_content, imported_content),
      status = CASE WHEN status = 'published' THEN status ELSE 'needs_review' END,
      updated_at = now()
    WHERE id = existing_id;
    result_action := 'update';
    result_id := existing_id;
  ELSE
    INSERT INTO fiqh_council_items (
      source_id, external_id, title, slug, type, category, subcategory, summary, content,
      ruling_text, source_name, source_url, session_date, tags, content_hash,
      sync_job_id, validation_status, status, last_synced_at,
      decision_number, nawazil_topic, imported_content, summary_source
    ) VALUES (
      p_source_id, p_external_id, p_title, p_slug, p_type, p_category, p_subcategory, p_summary, p_content,
      p_ruling_text, p_source_name, p_source_url, p_session_date, coalesce(p_tags, '{}'), p_content_hash,
      p_sync_job_id, 'needs_review', 'imported', now(),
      p_decision_number, p_nawazil_topic, p_imported_content, 'source'
    )
    RETURNING id INTO result_id;
    result_action := 'insert';
  END IF;

  RETURN json_build_object('action', result_action, 'id', result_id);
END;
$$;

-- Update search vector trigger to include subcategory + decision_number
CREATE OR REPLACE FUNCTION fiqh_items_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', normalize_ar(NEW.title)), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.summary, ''))), 'B') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.content, ''))), 'C') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.ruling_text, ''))), 'C') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.source_name, ''))), 'D') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.subcategory, ''))), 'D') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.decision_number, ''))), 'B') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(array_to_string(NEW.tags, ' '), ''))), 'D') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.category, ''))), 'D');
  RETURN NEW;
END;
$$;

UPDATE fiqh_council_items SET updated_at = updated_at;
