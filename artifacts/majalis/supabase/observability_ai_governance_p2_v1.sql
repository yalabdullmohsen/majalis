-- P2 Observability + AI Cost Governance
-- Apply via authorized admin migration path only (never automatic Production deploy).

-- ── AI spend ledger (aggregatable cost / token usage — no prompt text) ───────
CREATE TABLE IF NOT EXISTS ai_spend_ledger (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0,
  day_key TEXT NOT NULL,
  month_key TEXT NOT NULL,
  request_id TEXT,
  trace_id TEXT,
  job_run_id TEXT,
  content_hash TEXT,
  cache_hit BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'ok',
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_spend_ledger_day ON ai_spend_ledger (day_key);
CREATE INDEX IF NOT EXISTS idx_ai_spend_ledger_month ON ai_spend_ledger (month_key);
CREATE INDEX IF NOT EXISTS idx_ai_spend_ledger_provider_day ON ai_spend_ledger (provider, day_key);
CREATE INDEX IF NOT EXISTS idx_ai_spend_ledger_request ON ai_spend_ledger (request_id);

ALTER TABLE ai_spend_ledger ENABLE ROW LEVEL SECURITY;

-- ── Dedup of identical AI requests by content hash ───────────────────────────
CREATE TABLE IF NOT EXISTS ai_request_dedup (
  content_hash TEXT NOT NULL,
  provider TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (content_hash, provider)
);

CREATE INDEX IF NOT EXISTS idx_ai_request_dedup_expires ON ai_request_dedup (expires_at);

ALTER TABLE ai_request_dedup ENABLE ROW LEVEL SECURITY;

-- ── Approved AI result cache (opaque JSON — no logging of contents) ──────────
CREATE TABLE IF NOT EXISTS ai_content_cache (
  content_hash TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT '*',
  result_json JSONB NOT NULL,
  hit_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (content_hash, provider, model)
);

CREATE INDEX IF NOT EXISTS idx_ai_content_cache_expires ON ai_content_cache (expires_at);

ALTER TABLE ai_content_cache ENABLE ROW LEVEL SECURITY;

-- ── Optional error aggregates for dashboards ─────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_error_aggregates (
  day_key TEXT NOT NULL,
  provider TEXT NOT NULL,
  error_code TEXT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (day_key, provider, error_code)
);

ALTER TABLE ai_error_aggregates ENABLE ROW LEVEL SECURITY;

-- ── Lightweight observability samples (optional rollups) ─────────────────────
CREATE TABLE IF NOT EXISTS observability_metric_samples (
  id BIGSERIAL PRIMARY KEY,
  metric TEXT NOT NULL,
  value_num DOUBLE PRECISION NOT NULL,
  labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_id TEXT,
  trace_id TEXT,
  job_run_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obs_metric_samples_metric_time
  ON observability_metric_samples (metric, created_at DESC);

ALTER TABLE observability_metric_samples ENABLE ROW LEVEL SECURITY;
