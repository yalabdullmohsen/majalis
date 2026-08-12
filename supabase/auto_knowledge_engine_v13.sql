-- =====================================================================
--  المجلس العلمي — Auto Knowledge Engine v13
--  Connectors · Queue · Cache · Audit · SEO · Health · Statistics
--  نفّذ بعد knowledge_engine_v12.sql و auto_content_pipeline_v2.sql
-- =====================================================================

-- ── Connector registry (independent sources) ─────────────────────────────
CREATE TABLE IF NOT EXISTS ake_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT,
  country TEXT DEFAULT 'SA',
  entity_type TEXT NOT NULL DEFAULT 'islamic_org',
  connector_type TEXT NOT NULL DEFAULT 'rss'
    CHECK (connector_type IN ('rss', 'manifest', 'api', 'seed', 'html', 'inactive')),
  official_url TEXT NOT NULL,
  feed_url TEXT,
  api_config JSONB NOT NULL DEFAULT '{}',
  trust_level SMALLINT NOT NULL DEFAULT 3 CHECK (trust_level BETWEEN 1 AND 5),
  allowed_kinds TEXT[] NOT NULL DEFAULT ARRAY['article','news'],
  rate_limit_per_min INT NOT NULL DEFAULT 10,
  timeout_ms INT NOT NULL DEFAULT 15000,
  max_retries INT NOT NULL DEFAULT 3,
  crawl_interval_h INT NOT NULL DEFAULT 6,
  auto_publish BOOLEAN NOT NULL DEFAULT true,
  min_quality_score SMALLINT NOT NULL DEFAULT 65,
  is_active BOOLEAN NOT NULL DEFAULT true,
  health_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (health_status IN ('healthy', 'degraded', 'down', 'unknown')),
  last_health_check TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  items_total INT NOT NULL DEFAULT 0,
  items_published INT NOT NULL DEFAULT 0,
  broken_links INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_connectors_active_idx ON ake_connectors(is_active, health_status);

-- ── Job queue with retry ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID REFERENCES ake_connectors(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL DEFAULT 'sync'
    CHECK (job_type IN ('sync', 'verify', 'publish', 'index', 'archive', 'health')),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority INT NOT NULL DEFAULT 5,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  last_error TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_queue_status_idx ON ake_job_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS ake_queue_connector_idx ON ake_job_queue(connector_id);

-- ── Engine runs (orchestrator audit) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_engine_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL DEFAULT 'cron',
  status TEXT NOT NULL DEFAULT 'running',
  connectors_total INT DEFAULT 0,
  connectors_ok INT DEFAULT 0,
  connectors_failed INT DEFAULT 0,
  fetched_count INT DEFAULT 0,
  processed_count INT DEFAULT 0,
  published_count INT DEFAULT 0,
  rejected_count INT DEFAULT 0,
  duplicate_count INT DEFAULT 0,
  review_count INT DEFAULT 0,
  archived_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  duration_ms INT,
  error_summary TEXT,
  summary JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ake_runs_started_idx ON ake_engine_runs(started_at DESC);

-- ── Cache layer ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_cache (
  cache_key TEXT PRIMARY KEY,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_cache_expires_idx ON ake_cache(expires_at);

-- ── Audit log ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES ake_engine_runs(id) ON DELETE SET NULL,
  connector_id UUID REFERENCES ake_connectors(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'info',
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_audit_created_idx ON ake_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS ake_audit_connector_idx ON ake_audit_log(connector_id);

-- ── Link health tracking ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_link_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  connector_id UUID REFERENCES ake_connectors(id) ON DELETE SET NULL,
  status_code INT,
  is_alive BOOLEAN NOT NULL DEFAULT true,
  last_checked TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_message TEXT,
  UNIQUE(url)
);

CREATE INDEX IF NOT EXISTS ake_link_health_alive_idx ON ake_link_health(is_alive);

-- ── SEO metadata cache ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_seo_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key TEXT NOT NULL UNIQUE,
  path TEXT,
  title TEXT,
  description TEXT,
  canonical TEXT,
  robots TEXT DEFAULT 'index,follow',
  og_title TEXT,
  og_description TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  json_ld JSONB DEFAULT '[]',
  breadcrumb JSONB DEFAULT '[]',
  schema_types TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Extend knowledge_items for versioning & soft delete ────────────────────
ALTER TABLE knowledge_items
  ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS og_description TEXT,
  ADD COLUMN IF NOT EXISTS twitter_description TEXT,
  ADD COLUMN IF NOT EXISTS related_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_benefits TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_books TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_persons TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_evidence TEXT[] DEFAULT '{}';

-- ── Statistics snapshot ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  connectors_active INT DEFAULT 0,
  connectors_healthy INT DEFAULT 0,
  items_new INT DEFAULT 0,
  items_updated INT DEFAULT 0,
  items_published INT DEFAULT 0,
  items_rejected INT DEFAULT 0,
  items_archived INT DEFAULT 0,
  items_review INT DEFAULT 0,
  broken_links INT DEFAULT 0,
  avg_quality REAL DEFAULT 0,
  avg_trust REAL DEFAULT 0,
  avg_duration_ms INT DEFAULT 0,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(snapshot_date)
);

-- ── Seed official connectors ───────────────────────────────────────────────
INSERT INTO ake_connectors (slug, name, name_en, country, entity_type, connector_type, official_url, feed_url, trust_level, allowed_kinds, crawl_interval_h, auto_publish, is_active)
VALUES
  ('iifa-oic', 'المجمع الفقهي الإسلامي الدولي (IIFA)', 'IIFA OIC', 'SA', 'islamic_org', 'manifest', 'https://www.iifa-aifi.org', 'https://www.iifa-aifi.org/ar/rss', 5, ARRAY['fiqh_decision','resolution','news'], 12, true, true),
  ('islamweb-news', 'IslamWeb — الأخبار', 'IslamWeb', 'SA', 'islamic_org', 'rss', 'https://www.islamweb.net', 'https://www.islamweb.net/ar/rss/news', 4, ARRAY['news','article'], 6, true, true),
  ('kfas-sharia', 'KFAS — اللجنة الشرعية', 'KFAS Sharia', 'KW', 'research_center', 'manifest', 'https://www.kfas.org.kw', NULL, 4, ARRAY['fiqh_decision','article'], 24, true, true),
  ('alukah-articles', 'الموقع الإسلامي — مقالات', 'Alukah', 'SA', 'islamic_org', 'rss', 'https://www.alukah.net', 'https://www.alukah.net/rss', 3, ARRAY['article','fawaid'], 12, true, true),
  ('lajna-daima', 'اللجنة الدائمة للإفتاء', 'Permanent Committee', 'SA', 'islamic_org', 'rss', 'https://www.alifta.gov.sa', NULL, 5, ARRAY['fatwa','article'], 24, true, false),
  ('haram-presidency', 'رئاسة الشؤون الدينية بالحرمين', 'Haram Presidency', 'SA', 'government', 'rss', 'https://www.alharamain.gov.sa', NULL, 5, ARRAY['news','article','lesson'], 12, true, false),
  ('dorar-sunnah', 'الدرر السنية', 'Dorar Sunnah', 'SA', 'library', 'api', 'https://dorar.net', 'https://api.dorar.net', 5, ARRAY['book','hadith','article'], 24, true, false),
  ('islamqa', 'الإسلام سؤال وجواب', 'IslamQA', 'SA', 'islamic_org', 'rss', 'https://islamqa.info', 'https://islamqa.info/ar/rss', 4, ARRAY['fatwa','article','qa'], 12, true, false),
  ('ibn-baz', 'موقع الشيخ ابن باز', 'Ibn Baz', 'SA', 'publisher', 'rss', 'https://www.binbaz.org.sa', 'https://www.binbaz.org.sa/rss', 5, ARRAY['fatwa','article','lesson'], 24, true, false),
  ('uthaymeen', 'موقع الشيخ العثيمين', 'Uthaymeen', 'SA', 'publisher', 'rss', 'https://binothaimeen.net', NULL, 5, ARRAY['fatwa','article','lesson'], 24, true, false),
  ('alfawzan', 'موقع الشيخ الفوزان', 'Al-Fawzan', 'SA', 'publisher', 'rss', 'https://alfawzan.af.org.sa', NULL, 5, ARRAY['fatwa','article'], 24, true, false),
  ('albadr', 'موقع الشيخ عبدالرزاق البدر', 'Al-Badr', 'SA', 'publisher', 'rss', 'https://abdulazizalbadar.com', NULL, 4, ARRAY['article','lesson','fawaid'], 24, true, false),
  ('alosaimi', 'موقع الشيخ صالح العصيمي', 'Al-Osaimi', 'SA', 'publisher', 'inactive', 'https://www.saadbinosaimi.com', NULL, 4, ARRAY['article','lesson'], 24, true, false),
  ('alsabt', 'موقع الشيخ خالد السبت', 'Al-Sabt', 'SA', 'publisher', 'inactive', 'https://alsabt.com', NULL, 4, ARRAY['article','lesson'], 24, true, false),
  ('hayat-kibar-ulama', 'هيئة كبار العلماء', 'Senior Scholars', 'SA', 'islamic_org', 'rss', 'https://www.alifta.com', NULL, 5, ARRAY['fatwa','resolution','news'], 24, true, false),
  ('majlis-seed', 'بذور المجلس العلمي', 'Majlis Seed', 'KW', 'publisher', 'seed', 'https://majlisilm.com', NULL, 5, ARRAY['lesson','fawaid','book','miracle','qa','article'], 24, true, true),
  ('kuwait-lessons', 'دروس الكويت', 'Kuwait Lessons', 'KW', 'government', 'seed', 'https://majlisilm.com', NULL, 4, ARRAY['lesson','lecture','course'], 6, true, true)
ON CONFLICT (slug) DO NOTHING;

UPDATE ake_connectors SET api_config = '{"manifest_file":"fiqh-official-manifest.json"}'::jsonb WHERE slug = 'iifa-oic';
UPDATE ake_connectors SET api_config = '{"manifest_file":"fiqh-kfas-manifest.json"}'::jsonb WHERE slug = 'kfas-sharia';

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE ake_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_engine_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_link_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_seo_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ake_admin_all ON ake_connectors;
CREATE POLICY ake_admin_all ON ake_connectors FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
DROP POLICY IF EXISTS ake_public_connectors ON ake_connectors;
CREATE POLICY ake_public_connectors ON ake_connectors FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS ake_admin_queue ON ake_job_queue;
CREATE POLICY ake_admin_queue ON ake_job_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_admin_runs ON ake_engine_runs;
CREATE POLICY ake_admin_runs ON ake_engine_runs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_admin_audit ON ake_audit_log;
CREATE POLICY ake_admin_audit ON ake_audit_log FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_admin_stats ON ake_statistics;
CREATE POLICY ake_admin_stats ON ake_statistics FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_public_seo ON ake_seo_cache;
CREATE POLICY ake_public_seo ON ake_seo_cache FOR SELECT USING (true);

-- ── RPC: Engine dashboard stats ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION ake_engine_stats(p_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'connectors_active', (SELECT count(*) FROM ake_connectors WHERE is_active),
    'connectors_healthy', (SELECT count(*) FROM ake_connectors WHERE is_active AND health_status = 'healthy'),
    'connectors_total', (SELECT count(*) FROM ake_connectors),
    'items_new_today', (SELECT count(*) FROM knowledge_items WHERE created_at >= CURRENT_DATE),
    'items_published_today', (SELECT count(*) FROM knowledge_items WHERE published_at >= CURRENT_DATE AND publish_status = 'published'),
    'items_review', (SELECT count(*) FROM knowledge_items WHERE verification_status = 'needs_review'),
    'items_rejected', (SELECT count(*) FROM knowledge_items WHERE verification_status = 'rejected'),
    'items_duplicate', (SELECT count(*) FROM knowledge_items WHERE verification_status = 'duplicate'),
    'items_archived', (SELECT count(*) FROM knowledge_items WHERE archived_at IS NOT NULL),
    'broken_links', (SELECT count(*) FROM ake_link_health WHERE is_alive = false),
    'avg_quality', (SELECT coalesce(round(avg(quality_score)::numeric, 1), 0) FROM knowledge_items WHERE created_at >= now() - (p_days || ' days')::interval),
    'avg_trust', (SELECT coalesce(round(avg(trust_score)::numeric, 1), 0) FROM knowledge_items WHERE created_at >= now() - (p_days || ' days')::interval),
    'runs_recent', (SELECT coalesce(jsonb_agg(r ORDER BY r.started_at DESC), '[]'::jsonb) FROM (
      SELECT jsonb_build_object('id', id, 'status', status, 'trigger_type', trigger_type,
        'published_count', published_count, 'fetched_count', fetched_count,
        'duration_ms', duration_ms, 'started_at', started_at) AS r, started_at
      FROM ake_engine_runs ORDER BY started_at DESC LIMIT 10
    ) sub),
    'connectors_health', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'slug', slug, 'name', name, 'health_status', health_status,
      'last_sync_at', last_sync_at, 'items_published', items_published,
      'broken_links', broken_links, 'is_active', is_active
    ) ORDER BY name), '[]'::jsonb) FROM ake_connectors)
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION ake_engine_stats(int) TO authenticated, anon;

-- ── Semantic search helper (uses embeddings when available) ────────────────
CREATE OR REPLACE FUNCTION ake_search_semantic(
  query_embedding vector(1536),
  result_limit int DEFAULT 20,
  min_similarity float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  content_kind text,
  similarity float
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    ki.id,
    coalesce(ki.ai_title, ki.raw_title) AS title,
    ki.ai_summary AS summary,
    ki.content_kind,
    1 - (ke.embedding <=> query_embedding) AS similarity
  FROM knowledge_embeddings ke
  JOIN knowledge_items ki ON ki.id = ke.item_id
  WHERE ki.publish_status = 'published'
    AND ki.deleted_at IS NULL
    AND 1 - (ke.embedding <=> query_embedding) >= min_similarity
  ORDER BY ke.embedding <=> query_embedding
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION ake_search_semantic(vector, int, float) TO authenticated, anon;
