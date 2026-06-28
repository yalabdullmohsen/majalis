-- =====================================================================
--  Auto Knowledge Engine v13 — RPC repair (idempotent)
--  Fixes: ake_engine_stats not callable via PostgREST / Supabase RPC
--  Safe to re-apply anytime
-- =====================================================================

-- Drop legacy signatures that confuse PostgREST schema cache
DROP FUNCTION IF EXISTS public.ake_engine_stats();
DROP FUNCTION IF EXISTS public.ake_engine_stats(int);
DROP FUNCTION IF EXISTS public.ake_engine_stats(integer);

CREATE OR REPLACE FUNCTION public.ake_engine_stats(p_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'connectors_active', (SELECT count(*)::int FROM ake_connectors WHERE is_active),
    'connectors_healthy', (SELECT count(*)::int FROM ake_connectors WHERE is_active AND health_status = 'healthy'),
    'connectors_total', (SELECT count(*)::int FROM ake_connectors),
    'items_new_today', (SELECT count(*)::int FROM knowledge_items WHERE created_at >= CURRENT_DATE),
    'items_published_today', (SELECT count(*)::int FROM knowledge_items WHERE published_at >= CURRENT_DATE AND publish_status = 'published'),
    'items_review', (SELECT count(*)::int FROM knowledge_items WHERE verification_status = 'needs_review'),
    'items_rejected', (SELECT count(*)::int FROM knowledge_items WHERE verification_status = 'rejected'),
    'items_duplicate', (SELECT count(*)::int FROM knowledge_items WHERE verification_status = 'duplicate'),
    'items_archived', (SELECT count(*)::int FROM knowledge_items WHERE archived_at IS NOT NULL),
    'broken_links', (SELECT count(*)::int FROM ake_link_health WHERE is_alive = false),
    'avg_quality', (SELECT coalesce(round(avg(quality_score)::numeric, 1), 0) FROM knowledge_items WHERE created_at >= now() - (p_days || ' days')::interval),
    'avg_trust', (SELECT coalesce(round(avg(trust_score)::numeric, 1), 0) FROM knowledge_items WHERE created_at >= now() - (p_days || ' days')::interval),
    'runs_recent', (SELECT coalesce(jsonb_agg(r ORDER BY r.started_at DESC), '[]'::jsonb) FROM (
      SELECT jsonb_build_object(
        'id', id,
        'status', status,
        'trigger_type', trigger_type,
        'published_count', published_count,
        'fetched_count', fetched_count,
        'duration_ms', duration_ms,
        'started_at', started_at
      ) AS r,
      started_at
      FROM ake_engine_runs
      ORDER BY started_at DESC
      LIMIT 10
    ) sub),
    'connectors_health', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'slug', slug,
      'name', name,
      'health_status', health_status,
      'last_sync_at', last_sync_at,
      'items_published', items_published,
      'broken_links', broken_links,
      'is_active', is_active
    ) ORDER BY name), '[]'::jsonb) FROM ake_connectors)
  ) INTO result;

  RETURN coalesce(result, '{}'::jsonb);
END;
$$;

COMMENT ON FUNCTION public.ake_engine_stats(int) IS 'AKE dashboard aggregate stats — callable via Supabase RPC (p_days)';

-- PostgREST exposes functions to anon/authenticated/service_role
GRANT EXECUTE ON FUNCTION public.ake_engine_stats(int) TO anon, authenticated, service_role;

-- Semantic search helper (keep in sync)
DROP FUNCTION IF EXISTS public.ake_search_semantic(vector, int, float);
DROP FUNCTION IF EXISTS public.ake_search_semantic(vector, integer, double precision);

CREATE OR REPLACE FUNCTION public.ake_search_semantic(
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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

GRANT EXECUTE ON FUNCTION public.ake_search_semantic(vector, int, float) TO anon, authenticated, service_role;

-- Reload PostgREST schema cache (Supabase)
NOTIFY pgrst, 'reload schema';
