-- =====================================================================
--  المجلس العلمي — المجمع الفقهي v6 (مزامنة تلقائية + مصادر رسمية)
--  آمن — لا يحذف fiqh_council_items أو البيانات الحالية
--  نفّذ بعد: fiqh_council_items_v5.sql + cms_platform_v4.sql
-- =====================================================================

-- ── 1. Official sources registry ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  organization    TEXT NOT NULL,
  source_type     TEXT NOT NULL DEFAULT 'json_manifest'
    CHECK (source_type IN ('json_manifest', 'rss', 'api', 'manual')),
  base_url        TEXT NOT NULL,
  feed_url        TEXT,
  config          JSONB NOT NULL DEFAULT '{}',
  trust_level     TEXT NOT NULL DEFAULT 'official'
    CHECK (trust_level IN ('official', 'verified', 'disabled')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sync_interval_hours INT NOT NULL DEFAULT 24,
  last_sync_at    TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_summary JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiqh_sources_active_idx ON fiqh_council_sources (is_active, trust_level);

INSERT INTO fiqh_council_sources (slug, name, organization, source_type, base_url, feed_url, config, trust_level)
VALUES
  (
    'islamweb-majlis',
    'IslamWeb — المجمع الفقهي',
    'IslamWeb.net',
    'json_manifest',
    'https://www.islamweb.net',
    NULL,
    '{"manifest_path":"data/fiqh-official-manifest.json","notes":"مصدر رسمي — مراجع فقط"}'::jsonb,
    'official'
  ),
  (
    'iifa-oic',
    'الأكاديمية الإسلامية للفقه (OIC-IIFA)',
    'منظمة التعاون الإسلامي',
    'rss',
    'https://www.iifa-aifi.org',
    'https://www.iifa-aifi.org/ar/rss',
    '{"language":"ar","auto_publish":false}'::jsonb,
    'official'
  ),
  (
    'kfas-sharia',
    'اللجنة الشرعية — الكويت Foundation',
    'Kuwait Foundation for the Advancement of Sciences',
    'json_manifest',
    'https://www.kfas.org.kw',
    NULL,
    '{"manifest_path":"data/fiqh-kfas-manifest.json","auto_publish":false}'::jsonb,
    'official'
  )
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Extend fiqh_council_items ───────────────────────────────────────────
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES fiqh_council_sources(id) ON DELETE SET NULL;
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending'
  CHECK (validation_status IN ('pending', 'valid', 'invalid', 'needs_review'));
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS validation_errors JSONB NOT NULL DEFAULT '[]';
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE fiqh_council_items ADD COLUMN IF NOT EXISTS sync_job_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS fiqh_items_source_external_uidx
  ON fiqh_council_items (source_id, external_id)
  WHERE external_id IS NOT NULL AND source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS fiqh_items_external_id_idx ON fiqh_council_items (external_id);
CREATE INDEX IF NOT EXISTS fiqh_items_source_id_idx ON fiqh_council_items (source_id);
CREATE INDEX IF NOT EXISTS fiqh_items_validation_idx ON fiqh_council_items (validation_status);
CREATE INDEX IF NOT EXISTS fiqh_items_archived_at_idx ON fiqh_council_items (archived_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS fiqh_items_content_hash_idx ON fiqh_council_items (content_hash);

-- ── 3. Sync jobs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_sync_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID REFERENCES fiqh_council_sources(id) ON DELETE SET NULL,
  trigger_type    TEXT NOT NULL DEFAULT 'cron'
    CHECK (trigger_type IN ('cron', 'manual', 'retry')),
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial')),
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  total_fetched   INT NOT NULL DEFAULT 0,
  inserted_count  INT NOT NULL DEFAULT 0,
  updated_count   INT NOT NULL DEFAULT 0,
  skipped_count   INT NOT NULL DEFAULT 0,
  duplicate_count INT NOT NULL DEFAULT 0,
  error_count     INT NOT NULL DEFAULT 0,
  retry_count     INT NOT NULL DEFAULT 0,
  summary         JSONB NOT NULL DEFAULT '{}',
  error_log       JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiqh_sync_jobs_source_idx ON fiqh_council_sync_jobs (source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS fiqh_sync_jobs_status_idx ON fiqh_council_sync_jobs (status, created_at DESC);

-- ── 4. Sync row logs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_sync_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES fiqh_council_sync_jobs(id) ON DELETE CASCADE,
  source_id       UUID REFERENCES fiqh_council_sources(id) ON DELETE SET NULL,
  external_id     TEXT,
  item_id         UUID REFERENCES fiqh_council_items(id) ON DELETE SET NULL,
  action          TEXT NOT NULL
    CHECK (action IN ('insert', 'update', 'skip', 'duplicate', 'error', 'validate_fail')),
  message         TEXT,
  payload         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiqh_sync_logs_job_idx ON fiqh_council_sync_logs (job_id, created_at);
CREATE INDEX IF NOT EXISTS fiqh_sync_logs_external_idx ON fiqh_council_sync_logs (external_id);

-- ── 5. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE fiqh_council_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiqh_council_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiqh_council_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fiqh_sources_admin ON fiqh_council_sources;
CREATE POLICY fiqh_sources_admin ON fiqh_council_sources
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fiqh_sources_public_read ON fiqh_council_sources;
CREATE POLICY fiqh_sources_public_read ON fiqh_council_sources
  FOR SELECT USING (is_active = true AND trust_level = 'official');

DROP POLICY IF EXISTS fiqh_sync_jobs_admin ON fiqh_council_sync_jobs;
CREATE POLICY fiqh_sync_jobs_admin ON fiqh_council_sync_jobs
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fiqh_sync_logs_admin ON fiqh_council_sync_logs;
CREATE POLICY fiqh_sync_logs_admin ON fiqh_council_sync_logs
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ── 6. Search RPC for fiqh council ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_fiqh_council(query text, result_limit int DEFAULT 20)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  q_norm text := normalize_ar(trim(coalesce(query, '')));
  q_like text := '%' || q_norm || '%';
BEGIN
  IF length(q_norm) < 1 THEN
    RETURN '[]'::json;
  END IF;

  RETURN coalesce((
    SELECT json_agg(row_to_json(t) ORDER BY t.rank DESC, t.published_at DESC NULLS LAST)
    FROM (
      SELECT
        slug,
        title,
        type,
        category,
        summary,
        source_name,
        published_at,
        ts_rank(search_vector, plainto_tsquery('simple', q_norm)) AS rank
      FROM fiqh_council_items
      WHERE status = 'published'
        AND archived_at IS NULL
        AND (
          normalize_ar(title) LIKE q_like
          OR normalize_ar(coalesce(summary, '')) LIKE q_like
          OR normalize_ar(coalesce(content, '')) LIKE q_like
          OR normalize_ar(coalesce(ruling_text, '')) LIKE q_like
          OR normalize_ar(coalesce(source_name, '')) LIKE q_like
          OR normalize_ar(coalesce(category, '')) LIKE q_like
          OR search_vector @@ plainto_tsquery('simple', q_norm)
        )
      ORDER BY rank DESC, published_at DESC NULLS LAST
      LIMIT result_limit
    ) t
  ), '[]'::json);
END;
$$;

-- ── 7. Upsert helper for sync (service role) ───────────────────────────────────
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
  p_sync_job_id uuid
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
      status = CASE WHEN status = 'published' THEN status ELSE 'review' END,
      updated_at = now()
    WHERE id = existing_id;
    result_action := 'update';
    result_id := existing_id;
  ELSE
    INSERT INTO fiqh_council_items (
      source_id, external_id, title, slug, type, category, summary, content,
      ruling_text, source_name, source_url, session_date, tags, content_hash,
      sync_job_id, validation_status, status, last_synced_at
    ) VALUES (
      p_source_id, p_external_id, p_title, p_slug, p_type, p_category, p_summary, p_content,
      p_ruling_text, p_source_name, p_source_url, p_session_date, coalesce(p_tags, '{}'), p_content_hash,
      p_sync_job_id, 'needs_review', 'review', now()
    )
    RETURNING id INTO result_id;
    result_action := 'insert';
  END IF;

  RETURN json_build_object('action', result_action, 'id', result_id);
END;
$$;
