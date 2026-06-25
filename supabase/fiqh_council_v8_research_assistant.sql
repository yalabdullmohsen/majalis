-- =====================================================================
--  المجلس العلمي — المجمع الفقهي v8 (مساعد الباحث الفقهي)
--  آمن — لا يحذف البيانات الحالية
--  نفّذ بعد: fiqh_council_v7_intelligence.sql
-- =====================================================================

-- ── 1. Text chunks for semantic search (future embeddings) ───────────────
CREATE TABLE IF NOT EXISTS fiqh_council_chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL DEFAULT 0,
  chunk_text  TEXT NOT NULL,
  token_count INT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS fiqh_chunks_item_idx ON fiqh_council_chunks (item_id);
CREATE INDEX IF NOT EXISTS fiqh_chunks_text_idx ON fiqh_council_chunks USING GIN (to_tsvector('simple', chunk_text));

-- ── 2. Embeddings (optional — requires pgvector + API keys) ──────────────
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE TABLE IF NOT EXISTS fiqh_council_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id    UUID NOT NULL REFERENCES fiqh_council_chunks(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  model       TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  embedding   vector(1536),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chunk_id, model)
);

CREATE INDEX IF NOT EXISTS fiqh_embeddings_item_idx ON fiqh_council_embeddings (item_id);

-- ── 3. Research assistant search logs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_research_search_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query           TEXT NOT NULL,
  normalized_query TEXT,
  filters         JSONB NOT NULL DEFAULT '{}',
  session_id      TEXT,
  user_id         UUID,
  result_count    INT NOT NULL DEFAULT 0,
  citations       JSONB NOT NULL DEFAULT '[]',
  answer_preview  TEXT,
  retrieval_mode  TEXT NOT NULL DEFAULT 'text'
    CHECK (retrieval_mode IN ('text', 'semantic', 'hybrid')),
  answered        BOOLEAN NOT NULL DEFAULT false,
  is_personal_fatwa BOOLEAN NOT NULL DEFAULT false,
  latency_ms      INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiqh_research_logs_query_idx ON fiqh_research_search_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS fiqh_research_logs_normalized_idx ON fiqh_research_search_logs (normalized_query);
CREATE INDEX IF NOT EXISTS fiqh_research_logs_answered_idx ON fiqh_research_search_logs (answered, created_at DESC);

-- ── 4. Unanswered questions queue (admin review) ─────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_research_unanswered (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query       TEXT NOT NULL,
  log_id      UUID REFERENCES fiqh_research_search_logs(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'linked', 'dismissed')),
  linked_item_id UUID REFERENCES fiqh_council_items(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS fiqh_unanswered_status_idx ON fiqh_research_unanswered (status, created_at DESC);

-- ── 5. Assistant settings (singleton row) ────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_research_settings (
  id          INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_enabled  BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID
);

INSERT INTO fiqh_research_settings (id, is_enabled) VALUES (1, true)
ON CONFLICT (id) DO NOTHING;

-- ── 6. RLS ───────────────────────────────────────────────────────────────
ALTER TABLE fiqh_council_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiqh_council_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiqh_research_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiqh_research_unanswered ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiqh_research_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fiqh_chunks_admin ON fiqh_council_chunks;
CREATE POLICY fiqh_chunks_admin ON fiqh_council_chunks
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fiqh_embeddings_admin ON fiqh_council_embeddings;
CREATE POLICY fiqh_embeddings_admin ON fiqh_council_embeddings
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fiqh_research_logs_insert ON fiqh_research_search_logs;
CREATE POLICY fiqh_research_logs_insert ON fiqh_research_search_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS fiqh_research_logs_admin ON fiqh_research_search_logs;
CREATE POLICY fiqh_research_logs_admin ON fiqh_research_search_logs
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fiqh_unanswered_admin ON fiqh_research_unanswered;
CREATE POLICY fiqh_unanswered_admin ON fiqh_research_unanswered
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fiqh_research_settings_public ON fiqh_research_settings;
CREATE POLICY fiqh_research_settings_public ON fiqh_research_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS fiqh_research_settings_admin ON fiqh_research_settings;
CREATE POLICY fiqh_research_settings_admin ON fiqh_research_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ── 7. Semantic match RPC (no-op without embeddings) ─────────────────────
CREATE OR REPLACE FUNCTION match_fiqh_council_embeddings(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  min_score float DEFAULT 0.7
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  IF query_embedding IS NULL THEN
    RETURN '[]'::json;
  END IF;

  RETURN coalesce((
    SELECT json_agg(row_to_json(t) ORDER BY t.score DESC)
    FROM (
      SELECT
        e.item_id,
        c.chunk_text,
        c.metadata,
        (1 - (e.embedding <=> query_embedding)) AS score
      FROM fiqh_council_embeddings e
      JOIN fiqh_council_chunks c ON c.id = e.chunk_id
      JOIN fiqh_council_items i ON i.id = e.item_id
      WHERE i.status = 'published'
        AND i.archived_at IS NULL
        AND e.embedding IS NOT NULL
        AND (1 - (e.embedding <=> query_embedding)) >= min_score
      ORDER BY e.embedding <=> query_embedding
      LIMIT match_count
    ) t
  ), '[]'::json);
EXCEPTION WHEN OTHERS THEN
  RETURN '[]'::json;
END;
$$;

-- ── 8. Admin analytics RPC ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fiqh_research_analytics(days int DEFAULT 30)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN json_build_object(
    'top_queries', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT normalized_query AS query, count(*) AS cnt
        FROM fiqh_research_search_logs
        WHERE created_at >= now() - (days || ' days')::interval
          AND normalized_query IS NOT NULL
        GROUP BY normalized_query
        ORDER BY cnt DESC
        LIMIT 20
      ) t
    ), '[]'::json),
    'top_categories', coalesce((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT (filters->>'category') AS category, count(*) AS cnt
        FROM fiqh_research_search_logs
        WHERE created_at >= now() - (days || ' days')::interval
          AND filters->>'category' IS NOT NULL
        GROUP BY filters->>'category'
        ORDER BY cnt DESC
        LIMIT 10
      ) t
    ), '[]'::json),
    'unanswered_count', (
      SELECT count(*) FROM fiqh_research_unanswered WHERE status = 'open'
    ),
    'total_searches', (
      SELECT count(*) FROM fiqh_research_search_logs
      WHERE created_at >= now() - (days || ' days')::interval
    )
  );
END;
$$;
