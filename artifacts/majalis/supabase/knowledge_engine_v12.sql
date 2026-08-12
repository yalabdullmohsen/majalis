-- =====================================================================
--  المجلس العلمي — AI Knowledge Engine v12
--  مصادر رسمية + خط أنابيب المعرفة + فهرسة + بحث هجين
--  آمن لإعادة التشغيل — نفّذ بعد cms_platform_v4.sql
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 1. Official sources registry ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_official_sources (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  name_en           TEXT,
  country           TEXT,
  entity_type       TEXT NOT NULL DEFAULT 'islamic_org'
    CHECK (entity_type IN (
      'government', 'university', 'islamic_org', 'research_center',
      'media_official', 'library', 'publisher', 'api_provider'
    )),
  official_url      TEXT,
  rss_url           TEXT,
  api_url           TEXT,
  api_config        JSONB NOT NULL DEFAULT '{}',
  trust_level       SMALLINT NOT NULL DEFAULT 3 CHECK (trust_level BETWEEN 1 AND 5),
  allowed_kinds     TEXT[] NOT NULL DEFAULT ARRAY['news','article','book','lesson'],
  crawl_interval_h  INT NOT NULL DEFAULT 6,
  last_crawled_at   TIMESTAMPTZ,
  last_success_at   TIMESTAMPTZ,
  last_error        TEXT,
  items_fetched     INT NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_sources_active_idx
  ON knowledge_official_sources (is_active, last_crawled_at);

-- Seed official sources (metadata only — no generated religious content)
INSERT INTO knowledge_official_sources
  (slug, name, name_en, country, entity_type, official_url, rss_url, trust_level, allowed_kinds, notes)
VALUES
  ('islamweb-news', 'IslamWeb — الأخبار والمقالات', 'IslamWeb.net', 'SA', 'islamic_org',
   'https://www.islamweb.net', 'https://www.islamweb.net/ar/rss/news', 4,
   ARRAY['news','article'], 'أخبار ومقالات — لا فتاوى مُولَّدة'),
  ('iifa-oic', 'الأكاديمية الإسلامية للفقه (OIC-IIFA)', 'IIFA', 'SA', 'islamic_org',
   'https://www.iifa-aifi.org', 'https://www.iifa-aifi.org/ar/rss', 5,
   ARRAY['fiqh_decision','news'], 'قرارات المجمع — مصدر رسمي'),
  ('kfas-sharia', 'KFAS — اللجنة الشرعية', 'KFAS', 'KW', 'research_center',
   'https://www.kfas.org.kw', NULL, 4,
   ARRAY['fiqh_decision','article'], 'توصيات وبحوث KFAS'),
  ('alukah-articles', 'الموقع الإسلامي — مقالات علمية', 'Alukah.net', 'SA', 'islamic_org',
   'https://www.alukah.net', 'https://www.alukah.net/rss', 3,
   ARRAY['article','fawaid'], 'مقالات علمية عامة'),
  ('sunnah-com', 'Sunnah.com — مراجع حديثية', 'Sunnah.com', 'INT', 'library',
   'https://sunnah.com', NULL, 5,
   ARRAY['book'], 'مراجع حديث — لا نصوص مُولَّدة'),
  ('quran-com', 'Quran.com — مرجع قرآني', 'Quran.com', 'INT', 'library',
   'https://quran.com', NULL, 5,
   ARRAY['book'], 'مراجع قرآنية رسمية'),
  ('majlis-seed', 'بذور المجلس العلمي', 'Majlis Ilm', 'KW', 'publisher',
   'https://majlisilm.com', NULL, 5,
   ARRAY['lesson','fawaid','book','miracle','qa'], 'محتوى داخلي موثق'),
  ('kuwait-lessons', 'دروس الكويت — مصادر محلية', 'Kuwait Lessons', 'KW', 'government',
   'https://majlisilm.com', NULL, 4,
   ARRAY['lesson','lecture','course'], 'جدول دروس محلي')
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Pipeline runs audit ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE knowledge_pipeline_status AS ENUM (
    'pending', 'running', 'completed', 'failed', 'partial'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS knowledge_pipeline_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type      TEXT NOT NULL DEFAULT 'cron'
    CHECK (trigger_type IN ('cron', 'manual', 'webhook')),
  status            knowledge_pipeline_status NOT NULL DEFAULT 'pending',
  source_id         UUID REFERENCES knowledge_official_sources(id) ON DELETE SET NULL,
  started_at        TIMESTAMPTZ,
  finished_at       TIMESTAMPTZ,
  fetched_count     INT NOT NULL DEFAULT 0,
  analyzed_count    INT NOT NULL DEFAULT 0,
  published_count   INT NOT NULL DEFAULT 0,
  rejected_count    INT NOT NULL DEFAULT 0,
  duplicate_count   INT NOT NULL DEFAULT 0,
  review_count      INT NOT NULL DEFAULT 0,
  error_count       INT NOT NULL DEFAULT 0,
  summary           JSONB NOT NULL DEFAULT '{}',
  error_log         JSONB NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_runs_status_idx
  ON knowledge_pipeline_runs (status, created_at DESC);

-- ── 3. Knowledge items (pipeline queue) ────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE knowledge_verification_status AS ENUM (
    'pending', 'verified', 'needs_review', 'rejected', 'duplicate'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE knowledge_publish_status AS ENUM (
    'pending', 'published', 'rejected', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS knowledge_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id           UUID REFERENCES knowledge_official_sources(id) ON DELETE SET NULL,
  pipeline_run_id     UUID REFERENCES knowledge_pipeline_runs(id) ON DELETE SET NULL,
  external_id         TEXT,
  content_kind        TEXT NOT NULL,
  raw_url             TEXT,
  raw_title           TEXT,
  raw_body            TEXT,
  raw_payload         JSONB NOT NULL DEFAULT '{}',
  fetched_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- AI enrichment (metadata only — never generated religious rulings)
  ai_title            TEXT,
  ai_summary          TEXT,
  ai_keywords         TEXT[] NOT NULL DEFAULT '{}',
  ai_category         TEXT,
  ai_country          TEXT,
  ai_scholar          TEXT,
  ai_language         TEXT DEFAULT 'ar',
  ai_topic            TEXT,
  ai_verse_refs       JSONB NOT NULL DEFAULT '[]',
  ai_hadith_refs      JSONB NOT NULL DEFAULT '[]',
  seo_title           TEXT,
  seo_description     TEXT,
  structured_data     JSONB NOT NULL DEFAULT '{}',
  -- Quality & dedup
  quality_score       SMALLINT NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  completeness_score  SMALLINT NOT NULL DEFAULT 0 CHECK (completeness_score BETWEEN 0 AND 100),
  trust_score         SMALLINT NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  duplicate_of        UUID REFERENCES knowledge_items(id) ON DELETE SET NULL,
  duplicate_score     REAL,
  content_hash          TEXT,
  -- Workflow
  verification_status knowledge_verification_status NOT NULL DEFAULT 'pending',
  publish_status      knowledge_publish_status NOT NULL DEFAULT 'pending',
  pipeline_stage      TEXT NOT NULL DEFAULT 'collected'
    CHECK (pipeline_stage IN (
      'collected','verified','analyzed','classified','scored',
      'deduplicated','indexed','published','rejected'
    )),
  target_table        TEXT,
  target_record_id    UUID,
  source_attribution  TEXT,
  source_url          TEXT,
  published_at        TIMESTAMPTZ,
  rejection_reason    TEXT,
  error_log           JSONB NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, external_id)
);

CREATE INDEX IF NOT EXISTS knowledge_items_status_idx
  ON knowledge_items (publish_status, verification_status, created_at DESC);
CREATE INDEX IF NOT EXISTS knowledge_items_kind_idx ON knowledge_items (content_kind);
CREATE INDEX IF NOT EXISTS knowledge_items_hash_idx ON knowledge_items (content_hash);
CREATE INDEX IF NOT EXISTS knowledge_items_keywords_idx ON knowledge_items USING gin (ai_keywords);
CREATE INDEX IF NOT EXISTS knowledge_items_search_idx ON knowledge_items
  USING gin (to_tsvector('simple', coalesce(ai_title,'') || ' ' || coalesce(ai_summary,'') || ' ' || coalesce(raw_title,'')));

-- ── 4. Chunks & embeddings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  chunk_index     INT NOT NULL DEFAULT 0,
  chunk_text      TEXT NOT NULL,
  token_count     INT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS knowledge_chunks_item_idx ON knowledge_chunks (item_id);

CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id        UUID NOT NULL REFERENCES knowledge_chunks(id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  embedding       vector(1536),
  model_name      TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chunk_id)
);

CREATE INDEX IF NOT EXISTS knowledge_embeddings_item_idx ON knowledge_embeddings (item_id);

-- ── 5. Recommendations log ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_recommendations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id      TEXT,
  source_kind     TEXT,
  source_id       UUID,
  recommended_ids UUID[] NOT NULL DEFAULT '{}',
  algorithm       TEXT NOT NULL DEFAULT 'hybrid',
  score_map       JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_recs_user_idx
  ON knowledge_recommendations (user_id, created_at DESC);

-- ── 6. Helper: normalize for dedup ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION knowledge_normalize_text(t text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(trim(regexp_replace(
    coalesce(t, ''),
    '[\u064B-\u065F\u0670\u0640]', '', 'g'
  )));
$$;

-- ── 7. Pipeline stats RPC ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION knowledge_pipeline_stats(days int DEFAULT 7)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN json_build_object(
    'sources_active', (SELECT count(*) FROM knowledge_official_sources WHERE is_active),
    'sources_total', (SELECT count(*) FROM knowledge_official_sources),
    'items_today', (
      SELECT count(*) FROM knowledge_items
      WHERE created_at >= date_trunc('day', now())
    ),
    'items_published_today', (
      SELECT count(*) FROM knowledge_items
      WHERE publish_status = 'published'
        AND published_at >= date_trunc('day', now())
    ),
    'items_review', (
      SELECT count(*) FROM knowledge_items WHERE verification_status = 'needs_review'
    ),
    'items_rejected', (
      SELECT count(*) FROM knowledge_items WHERE verification_status = 'rejected'
    ),
    'items_duplicate', (
      SELECT count(*) FROM knowledge_items WHERE verification_status = 'duplicate'
    ),
    'runs_recent', coalesce((
      SELECT json_agg(row_to_json(r) ORDER BY r.created_at DESC)
      FROM (
        SELECT id, status, trigger_type, fetched_count, published_count,
               rejected_count, duplicate_count, review_count, created_at
        FROM knowledge_pipeline_runs
        WHERE created_at >= now() - (days || ' days')::interval
        ORDER BY created_at DESC LIMIT 10
      ) r
    ), '[]'::json),
    'top_categories', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT ai_category AS category, count(*) AS cnt
        FROM knowledge_items
        WHERE ai_category IS NOT NULL
          AND created_at >= now() - (days || ' days')::interval
        GROUP BY ai_category ORDER BY cnt DESC LIMIT 10
      ) t
    ), '[]'::json),
    'avg_quality', coalesce((
      SELECT round(avg(quality_score)) FROM knowledge_items
      WHERE publish_status = 'published'
    ), 0),
    'section_completion', json_build_object(
      'lessons', (SELECT count(*) FROM lessons WHERE status = 'approved'),
      'library', (SELECT count(*) FROM library_items WHERE status = 'approved'),
      'fawaid', (SELECT count(*) FROM fawaid WHERE status = 'approved'),
      'miracles', (SELECT count(*) FROM scientific_miracles WHERE status = 'approved'),
      'qa', (SELECT count(*) FROM qa_questions WHERE status = 'published'),
      'fatwas', (SELECT count(*) FROM fatwas WHERE status = 'approved'),
      'fiqh', (SELECT count(*) FROM fiqh_council_items WHERE status = 'published'),
      'knowledge_published', (SELECT count(*) FROM knowledge_items WHERE publish_status = 'published')
    )
  );
END;
$$;

-- ── 8. Hybrid knowledge search ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_knowledge_hybrid(
  query text,
  result_limit int DEFAULT 20
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  q_norm text;
  q_ts tsquery;
BEGIN
  q_norm := knowledge_normalize_text(query);
  IF length(q_norm) < 2 THEN
    RETURN '[]'::json;
  END IF;
  q_ts := plainto_tsquery('simple', q_norm);

  RETURN coalesce((
    SELECT json_agg(row_to_json(t) ORDER BY t.rank DESC, t.quality_score DESC, t.published_at DESC NULLS LAST)
    FROM (
      SELECT
        ki.id,
        ki.content_kind,
        ki.ai_title AS title,
        ki.ai_summary AS summary,
        ki.ai_category AS category,
        ki.ai_keywords AS keywords,
        ki.ai_scholar AS scholar,
        ki.source_attribution,
        ki.source_url,
        ki.quality_score,
        ki.trust_score,
        ki.verification_status::text AS verification_status,
        ki.publish_status::text AS publish_status,
        ki.target_table,
        ki.target_record_id,
        ki.published_at,
        (
          ts_rank(to_tsvector('simple', coalesce(ki.ai_title,'') || ' ' || coalesce(ki.ai_summary,'')),
                  q_ts) * 10
          + similarity(knowledge_normalize_text(ki.ai_title), q_norm) * 5
          + CASE WHEN ki.verification_status = 'verified' THEN 3 ELSE 0 END
          + ki.quality_score * 0.05
          + ki.trust_score * 0.03
        ) AS rank
      FROM knowledge_items ki
      WHERE ki.publish_status = 'published'
        AND ki.verification_status IN ('verified', 'needs_review')
        AND (
          to_tsvector('simple', coalesce(ki.ai_title,'') || ' ' || coalesce(ki.ai_summary,'')) @@ q_ts
          OR knowledge_normalize_text(ki.ai_title) % q_norm
          OR q_norm = ANY (ki.ai_keywords)
          OR knowledge_normalize_text(ki.ai_scholar) LIKE '%' || q_norm || '%'
        )
      ORDER BY rank DESC, ki.quality_score DESC
      LIMIT result_limit
    ) t
  ), '[]'::json);
END;
$$;

-- ── 9. Semantic match (when embeddings exist) ───────────────────────────────
CREATE OR REPLACE FUNCTION match_knowledge_embeddings(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  min_score float DEFAULT 0.65
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  IF query_embedding IS NULL THEN RETURN '[]'::json; END IF;
  RETURN coalesce((
    SELECT json_agg(row_to_json(t) ORDER BY t.score DESC)
    FROM (
      SELECT
        e.item_id,
        c.chunk_text,
        ki.ai_title AS title,
        ki.content_kind,
        (1 - (e.embedding <=> query_embedding)) AS score
      FROM knowledge_embeddings e
      JOIN knowledge_chunks c ON c.id = e.chunk_id
      JOIN knowledge_items ki ON ki.id = e.item_id
      WHERE ki.publish_status = 'published'
        AND e.embedding IS NOT NULL
        AND (1 - (e.embedding <=> query_embedding)) >= min_score
      ORDER BY e.embedding <=> query_embedding
      LIMIT match_count
    ) t
  ), '[]'::json);
EXCEPTION WHEN OTHERS THEN RETURN '[]'::json;
END;
$$;

-- ── 10. RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE knowledge_official_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS knowledge_sources_public ON knowledge_official_sources;
CREATE POLICY knowledge_sources_public ON knowledge_official_sources FOR SELECT USING (true);

DROP POLICY IF EXISTS knowledge_items_public ON knowledge_items;
CREATE POLICY knowledge_items_public ON knowledge_items
  FOR SELECT USING (publish_status = 'published');

DROP POLICY IF EXISTS knowledge_items_admin ON knowledge_items;
CREATE POLICY knowledge_items_admin ON knowledge_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS knowledge_runs_admin ON knowledge_pipeline_runs;
CREATE POLICY knowledge_runs_admin ON knowledge_pipeline_runs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS knowledge_chunks_public ON knowledge_chunks;
CREATE POLICY knowledge_chunks_public ON knowledge_chunks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM knowledge_items ki WHERE ki.id = item_id AND ki.publish_status = 'published')
  );

DROP POLICY IF EXISTS knowledge_embeddings_public ON knowledge_embeddings;
CREATE POLICY knowledge_embeddings_public ON knowledge_embeddings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM knowledge_items ki WHERE ki.id = item_id AND ki.publish_status = 'published')
  );

DROP POLICY IF EXISTS knowledge_recs_own ON knowledge_recommendations;
CREATE POLICY knowledge_recs_own ON knowledge_recommendations
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

GRANT EXECUTE ON FUNCTION knowledge_pipeline_stats(int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_knowledge_hybrid(text, int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION match_knowledge_embeddings(vector, int, float) TO authenticated, anon;
