-- Open Islamic Platform v1
-- API keys, webhooks, audit logs, usage tracking

CREATE TABLE IF NOT EXISTS open_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  owner_id text DEFAULT 'admin',
  scopes text[] DEFAULT '{read,search}',
  tier text DEFAULT 'free' CHECK (tier IN ('free', 'standard', 'partner')),
  is_active boolean DEFAULT true,
  usage_count int DEFAULT 0,
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_open_api_keys_hash ON open_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_open_api_keys_owner ON open_api_keys(owner_id);

CREATE TABLE IF NOT EXISTS open_api_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES open_api_keys(id) ON DELETE SET NULL,
  method text DEFAULT 'GET',
  path text NOT NULL,
  version text DEFAULT 'v1',
  resource text,
  status_code int DEFAULT 200,
  response_ms int,
  ip_address text,
  user_agent text,
  error text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_key ON open_api_audit_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON open_api_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON open_api_audit_logs(resource);

CREATE TABLE IF NOT EXISTS open_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text DEFAULT 'admin',
  name text NOT NULL,
  url text NOT NULL,
  events text[] DEFAULT '{}',
  secret text NOT NULL,
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS open_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES open_webhooks(id) ON DELETE CASCADE,
  event text NOT NULL,
  status text DEFAULT 'pending',
  status_code int,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_hook ON open_webhook_deliveries(webhook_id);

-- RPC: platform API stats
CREATE OR REPLACE FUNCTION open_platform_stats(days int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'keys_active', (SELECT count(*) FROM open_api_keys WHERE is_active = true),
    'requests_total', (SELECT count(*) FROM open_api_audit_logs WHERE created_at >= now() - (days || ' days')::interval),
    'requests_errors', (SELECT count(*) FROM open_api_audit_logs WHERE status_code >= 400 AND created_at >= now() - (days || ' days')::interval),
    'webhooks_active', (SELECT count(*) FROM open_webhooks WHERE is_active = true),
    'avg_response_ms', (SELECT coalesce(avg(response_ms), 0) FROM open_api_audit_logs WHERE created_at >= now() - (days || ' days')::interval)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION open_platform_stats(int) TO authenticated, anon;

ALTER TABLE open_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_api_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role open_api_keys" ON open_api_keys;
CREATE POLICY "Service role open_api_keys" ON open_api_keys FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Service role open_api_audit_logs" ON open_api_audit_logs;
CREATE POLICY "Service role open_api_audit_logs" ON open_api_audit_logs FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Service role open_webhooks" ON open_webhooks;
CREATE POLICY "Service role open_webhooks" ON open_webhooks FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Service role open_webhook_deliveries" ON open_webhook_deliveries;
CREATE POLICY "Service role open_webhook_deliveries" ON open_webhook_deliveries FOR ALL TO service_role USING (true);
