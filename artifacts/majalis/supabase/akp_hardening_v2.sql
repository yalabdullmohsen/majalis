-- AKP Production Hardening v2 — retry queue, source health, duplicate history

CREATE TABLE IF NOT EXISTS akp_retry_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name      TEXT NOT NULL DEFAULT 'akp-pipeline',
  job_type        TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  error           TEXT,
  retry_count     INTEGER NOT NULL DEFAULT 0,
  max_retries     INTEGER NOT NULL DEFAULT 3,
  next_retry_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  pipeline_run_id UUID,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_retry_queue_next_idx
  ON akp_retry_queue (next_retry_at ASC)
  WHERE retry_count < max_retries;

CREATE TABLE IF NOT EXISTS akp_source_health (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_slug     TEXT NOT NULL,
  endpoint_url    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'unknown'
    CHECK (status IN ('available', 'slow', 'redirect', 'unauthorized', 'blocked', 'dead', 'unknown')),
  http_status     INTEGER,
  latency_ms      INTEGER,
  error_message   TEXT,
  items_found     INTEGER DEFAULT 0,
  checked_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata        JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS akp_source_health_slug_idx
  ON akp_source_health (source_slug, checked_at DESC);

CREATE TABLE IF NOT EXISTS akp_duplicate_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type    TEXT NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  reason          TEXT NOT NULL,
  similarity      NUMERIC(5,4),
  source_slug     TEXT,
  existing_id     TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akp_duplicate_history_type_idx
  ON akp_duplicate_history (content_type, created_at DESC);

-- Vector similarity search for dedup (optional — requires pgvector)
CREATE OR REPLACE FUNCTION akp_match_fingerprints(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_content_type text
)
RETURNS TABLE (id uuid, target_id text, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.target_id, 1 - (f.embedding <=> query_embedding) AS similarity
  FROM akp_content_fingerprints f
  WHERE f.content_type = p_content_type
    AND f.embedding IS NOT NULL
    AND 1 - (f.embedding <=> query_embedding) >= match_threshold
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

ALTER TABLE akp_pipeline_runs
  ADD COLUMN IF NOT EXISTS timeout_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
