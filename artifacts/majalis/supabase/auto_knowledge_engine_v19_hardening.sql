-- AKE v19 — Production hardening (idempotent)
-- Fiqh migration tracking, feed reliability, connector intelligence, analytics, source discovery

-- ── Extended connector health metrics ────────────────────────────────────────
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS avg_response_ms INT DEFAULT 0;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS failure_rate_pct NUMERIC(5,2) DEFAULT 0;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS duplicate_pct NUMERIC(5,2) DEFAULT 0;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS items_discovered INT DEFAULT 0;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS trust_score INT DEFAULT 0;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS feed_degraded_at TIMESTAMPTZ;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS feed_mirror_urls TEXT[] DEFAULT '{}';
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS cached_feed_url TEXT;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS feed_format TEXT DEFAULT 'rss';

-- ── Feed URL cache (successful URLs per connector) ───────────────────────────
CREATE TABLE IF NOT EXISTS ake_feed_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID REFERENCES ake_connectors(id) ON DELETE CASCADE,
  connector_slug TEXT NOT NULL,
  feed_url TEXT NOT NULL,
  feed_format TEXT NOT NULL DEFAULT 'rss'
    CHECK (feed_format IN ('rss', 'atom', 'json', 'xml', 'sitemap')),
  http_status INT,
  etag TEXT,
  last_modified TEXT,
  success_count INT NOT NULL DEFAULT 1,
  last_success_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_failure_at TIMESTAMPTZ,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (connector_slug, feed_url)
);

CREATE INDEX IF NOT EXISTS ake_feed_cache_slug_idx ON ake_feed_cache (connector_slug, is_primary DESC);

-- ── Feed mirror / alternate URLs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_feed_mirrors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID REFERENCES ake_connectors(id) ON DELETE CASCADE,
  connector_slug TEXT NOT NULL,
  mirror_url TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 10,
  feed_format TEXT DEFAULT 'rss',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (connector_slug, mirror_url)
);

-- ── Fiqh migration audit log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_fiqh_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_item_id UUID,
  fiqh_item_id UUID,
  external_key TEXT,
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'migrated', 'skipped', 'failed', 'verified')),
  source_table TEXT NOT NULL DEFAULT 'library_items',
  target_table TEXT NOT NULL DEFAULT 'fiqh_council_items',
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  migrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_fiqh_migration_log_status_idx ON ake_fiqh_migration_log (status, created_at DESC);

-- ── Publishing analytics snapshots ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_publishing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  period_key TEXT NOT NULL,
  items_discovered INT NOT NULL DEFAULT 0,
  items_parsed INT NOT NULL DEFAULT 0,
  items_published INT NOT NULL DEFAULT 0,
  items_rejected INT NOT NULL DEFAULT 0,
  items_duplicate INT NOT NULL DEFAULT 0,
  avg_processing_ms INT DEFAULT 0,
  avg_ai_confidence NUMERIC(5,2) DEFAULT 0,
  top_categories JSONB NOT NULL DEFAULT '[]',
  top_sources JSONB NOT NULL DEFAULT '[]',
  top_connectors JSONB NOT NULL DEFAULT '[]',
  growth_pct NUMERIC(8,2) DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (period_type, period_key)
);

CREATE INDEX IF NOT EXISTS ake_publishing_analytics_period_idx ON ake_publishing_analytics (period_type, period_key DESC);

-- ── Autonomous source discovery workflow ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_discovered_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT,
  discovered_url TEXT NOT NULL,
  feed_url TEXT,
  feed_format TEXT,
  source_type TEXT NOT NULL DEFAULT 'website'
    CHECK (source_type IN (
      'university', 'government', 'fatwa_portal', 'scholar', 'conference',
      'library', 'youtube', 'instagram', 'telegram', 'podcast', 'api', 'sitemap', 'rss', 'website'
    )),
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'review', 'approved', 'rejected', 'activated')),
  trust_score INT DEFAULT 0,
  discovery_method TEXT,
  discovered_by TEXT DEFAULT 'ai_crawler',
  metadata JSONB NOT NULL DEFAULT '{}',
  reviewed_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (discovered_url)
);

CREATE INDEX IF NOT EXISTS ake_discovered_sources_status_idx ON ake_discovered_sources (verification_status, created_at DESC);

-- ── Incident recovery log ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_incident_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'critical')),
  worker_scope TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'recovering', 'resolved', 'failed')),
  error_message TEXT,
  recovery_action TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ake_incident_log_type_idx ON ake_incident_log (incident_type, status, created_at DESC);

-- ── Worker status registry ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_worker_status (
  worker_id TEXT PRIMARY KEY,
  worker_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'running', 'degraded', 'stopped', 'recovering')),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_success_at TIMESTAMPTZ,
  metrics JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Enhanced ake_engine_stats RPC ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION ake_engine_stats(p_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  since_ts timestamptz := now() - (p_days || ' days')::interval;
BEGIN
  SELECT jsonb_build_object(
    'connectors_active', (SELECT count(*) FROM ake_connectors WHERE is_active),
    'connectors_healthy', (SELECT count(*) FROM ake_connectors WHERE is_active AND health_status = 'healthy'),
    'connectors_degraded', (SELECT count(*) FROM ake_connectors WHERE is_active AND health_status = 'degraded'),
    'connectors_down', (SELECT count(*) FROM ake_connectors WHERE is_active AND health_status = 'down'),
    'connectors_total', (SELECT count(*) FROM ake_connectors),
    'items_new_today', (SELECT count(*) FROM knowledge_items WHERE created_at >= CURRENT_DATE),
    'items_published_today', (SELECT count(*) FROM knowledge_items WHERE published_at >= CURRENT_DATE AND publish_status = 'published'),
    'items_review', (SELECT count(*) FROM knowledge_items WHERE verification_status = 'needs_review'),
    'items_rejected', (SELECT count(*) FROM knowledge_items WHERE verification_status = 'rejected'),
    'items_duplicate', (SELECT count(*) FROM knowledge_items WHERE verification_status = 'duplicate'),
    'items_archived', (SELECT count(*) FROM knowledge_items WHERE archived_at IS NOT NULL),
    'broken_links', (SELECT count(*) FROM ake_link_health WHERE is_alive = false),
    'avg_quality', (SELECT coalesce(round(avg(quality_score)::numeric, 1), 0) FROM knowledge_items WHERE created_at >= since_ts),
    'avg_trust', (SELECT coalesce(round(avg(trust_score)::numeric, 1), 0) FROM knowledge_items WHERE created_at >= since_ts),
    'avg_ai_confidence', (SELECT coalesce(round(avg(ai_confidence)::numeric, 1), 0) FROM knowledge_items WHERE created_at >= since_ts AND ai_confidence IS NOT NULL),
    'queue_pending', (SELECT count(*) FROM ake_job_queue WHERE status = 'pending'),
    'queue_failed', (SELECT count(*) FROM ake_job_queue WHERE status = 'failed'),
    'open_incidents', (SELECT count(*) FROM ake_incident_log WHERE status IN ('open', 'recovering')),
    'discovered_sources_pending', (SELECT count(*) FROM ake_discovered_sources WHERE verification_status = 'pending'),
    'fiqh_migrated', (SELECT count(*) FROM ake_fiqh_migration_log WHERE status = 'migrated'),
    'runs_recent', (SELECT coalesce(jsonb_agg(r ORDER BY r.started_at DESC), '[]'::jsonb) FROM (
      SELECT jsonb_build_object('id', id, 'status', status, 'trigger_type', trigger_type,
        'published_count', published_count, 'fetched_count', fetched_count,
        'duration_ms', duration_ms, 'started_at', started_at) AS r, started_at
      FROM ake_engine_runs ORDER BY started_at DESC LIMIT 10
    ) sub),
    'connectors_health', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'slug', slug, 'name', name, 'health_status', health_status,
      'last_sync_at', last_sync_at, 'last_success_at', last_success_at,
      'items_published', items_published, 'items_discovered', coalesce(items_discovered, 0),
      'avg_response_ms', coalesce(avg_response_ms, 0),
      'failure_rate_pct', coalesce(failure_rate_pct, 0),
      'duplicate_pct', coalesce(duplicate_pct, 0),
      'trust_score', coalesce(trust_score, trust_level),
      'auto_publish', auto_publish, 'is_active', is_active,
      'feed_degraded', feed_degraded_at IS NOT NULL
    ) ORDER BY name), '[]'::jsonb) FROM ake_connectors)
  ) INTO result;
  RETURN result;
END;
$$;

-- ── Publishing analytics snapshot RPC ────────────────────────────────────────
CREATE OR REPLACE FUNCTION ake_publishing_analytics_snapshot(p_period_type text DEFAULT 'daily')
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  period_key text;
BEGIN
  period_key := CASE p_period_type
    WHEN 'hourly' THEN to_char(now(), 'YYYY-MM-DD"T"HH24')
    WHEN 'weekly' THEN to_char(date_trunc('week', now()), 'YYYY-"W"IW')
    WHEN 'monthly' THEN to_char(now(), 'YYYY-MM')
    ELSE to_char(now(), 'YYYY-MM-DD')
  END;

  SELECT jsonb_build_object(
    'period_type', p_period_type,
    'period_key', period_key,
    'items_discovered', coalesce(sum(fetched), 0),
    'items_published', coalesce(sum(published), 0),
    'items_rejected', coalesce(sum(rejected), 0),
    'items_duplicate', coalesce(sum(duplicate), 0),
    'top_sources', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('slug', connector_slug, 'published', cnt) ORDER BY cnt DESC), '[]'::jsonb)
      FROM (
        SELECT connector_slug, sum(published) AS cnt
        FROM ake_cycle_metrics
        WHERE created_at >= CASE p_period_type
          WHEN 'hourly' THEN now() - interval '1 hour'
          WHEN 'weekly' THEN now() - interval '7 days'
          WHEN 'monthly' THEN now() - interval '30 days'
          ELSE now() - interval '1 day'
        END
        GROUP BY connector_slug ORDER BY cnt DESC LIMIT 10
      ) sub
    )
  ) INTO result
  FROM ake_cycle_metrics
  WHERE created_at >= CASE p_period_type
    WHEN 'hourly' THEN now() - interval '1 hour'
    WHEN 'weekly' THEN now() - interval '7 days'
    WHEN 'monthly' THEN now() - interval '30 days'
    ELSE now() - interval '1 day'
  END;

  RETURN coalesce(result, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION ake_engine_stats(int) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION ake_publishing_analytics_snapshot(text) TO authenticated, anon, service_role;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE ake_feed_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_feed_mirrors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_fiqh_migration_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_publishing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_discovered_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_incident_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ake_worker_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ake_feed_cache_admin ON ake_feed_cache;
CREATE POLICY ake_feed_cache_admin ON ake_feed_cache FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_feed_mirrors_admin ON ake_feed_mirrors;
CREATE POLICY ake_feed_mirrors_admin ON ake_feed_mirrors FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_fiqh_migration_log_admin ON ake_fiqh_migration_log;
CREATE POLICY ake_fiqh_migration_log_admin ON ake_fiqh_migration_log FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_publishing_analytics_admin ON ake_publishing_analytics;
CREATE POLICY ake_publishing_analytics_admin ON ake_publishing_analytics FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_discovered_sources_admin ON ake_discovered_sources;
CREATE POLICY ake_discovered_sources_admin ON ake_discovered_sources FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_incident_log_admin ON ake_incident_log;
CREATE POLICY ake_incident_log_admin ON ake_incident_log FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS ake_worker_status_admin ON ake_worker_status;
CREATE POLICY ake_worker_status_admin ON ake_worker_status FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

GRANT SELECT ON ake_feed_cache, ake_feed_mirrors, ake_fiqh_migration_log,
  ake_publishing_analytics, ake_discovered_sources, ake_incident_log, ake_worker_status
  TO authenticated;
GRANT ALL ON ake_feed_cache, ake_feed_mirrors, ake_fiqh_migration_log,
  ake_publishing_analytics, ake_discovered_sources, ake_incident_log, ake_worker_status
  TO service_role;

NOTIFY pgrst, 'reload schema';
