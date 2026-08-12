-- Islamic Knowledge Reasoning Engine v1
-- Query audit, quality issues, entity stats RPC

CREATE TABLE IF NOT EXISTS reasoning_query_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  normalized_query text,
  session_id text,
  actor_id text,
  result_count int NOT NULL DEFAULT 0,
  citation_count int NOT NULL DEFAULT 0,
  confidence_score smallint CHECK (confidence_score BETWEEN 0 AND 100),
  retrieval_mode text NOT NULL DEFAULT 'tiered',
  answered boolean NOT NULL DEFAULT false,
  no_evidence boolean NOT NULL DEFAULT false,
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_tiers jsonb NOT NULL DEFAULT '{}'::jsonb,
  graph_nodes int NOT NULL DEFAULT 0,
  answer_preview text,
  latency_ms int,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reasoning_query_logs_created ON reasoning_query_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reasoning_query_logs_answered ON reasoning_query_logs(answered);

CREATE TABLE IF NOT EXISTS reasoning_quality_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_type text NOT NULL CHECK (issue_type IN (
    'missing_relation','missing_source','duplicate','broken_link',
    'unverified','orphan_ref','conflict','sparse_graph'
  )),
  entity_ref_id text,
  entity_kind text,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  description text NOT NULL,
  suggested_fix text,
  auto_fixable boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','ignored')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_reasoning_quality_type ON reasoning_quality_issues(issue_type, status);
CREATE INDEX IF NOT EXISTS idx_reasoning_quality_ref ON reasoning_quality_issues(entity_ref_id);

CREATE TABLE IF NOT EXISTS reasoning_inference_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type text NOT NULL DEFAULT 'cron',
  relations_created int NOT NULL DEFAULT 0,
  entities_processed int NOT NULL DEFAULT 0,
  issues_found int NOT NULL DEFAULT 0,
  duration_ms int,
  status text NOT NULL DEFAULT 'completed',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

-- Dashboard RPC
CREATE OR REPLACE FUNCTION reasoning_engine_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'refs_count', (SELECT count(*) FROM global_content_refs),
    'relations_count', (SELECT count(*) FROM content_relations),
    'verified_refs', (SELECT count(*) FROM global_content_refs WHERE verification_status = 'verified'),
    'adhkar_count', (SELECT count(*) FROM verified_adhkar_items WHERE deleted_at IS NULL),
    'hadith_count', (SELECT count(*) FROM verified_hadith_items WHERE deleted_at IS NULL),
    'queries_24h', (SELECT count(*) FROM reasoning_query_logs WHERE created_at > now() - interval '24 hours'),
    'answered_24h', (SELECT count(*) FROM reasoning_query_logs WHERE created_at > now() - interval '24 hours' AND answered = true),
    'open_issues', (SELECT count(*) FROM reasoning_quality_issues WHERE status = 'open'),
    'avg_confidence_7d', (
      SELECT round(avg(confidence_score)) FROM reasoning_query_logs
      WHERE created_at > now() - interval '7 days' AND confidence_score IS NOT NULL
    )
  ) INTO result;
  RETURN result;
END;
$$;
