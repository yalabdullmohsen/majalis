-- Global Knowledge Engine (GKE) — Phase 1 audit tables only
-- Does NOT duplicate knowledge_items or source registries.

CREATE TABLE IF NOT EXISTS gke_pipeline_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type     TEXT NOT NULL DEFAULT 'dry_run',
  status       TEXT NOT NULL DEFAULT 'completed',
  phase        INTEGER NOT NULL DEFAULT 1,
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  duration_ms  INTEGER,
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gke_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT NOT NULL,
  layer        TEXT,
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gke_runs_created ON gke_pipeline_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gke_runs_type ON gke_pipeline_runs (run_type, status);
CREATE INDEX IF NOT EXISTS idx_gke_events_type ON gke_events (event_type, created_at DESC);

COMMENT ON TABLE gke_pipeline_runs IS 'GKE orchestrator audit log — not a content store';
COMMENT ON TABLE gke_events IS 'GKE event bus persistence (optional)';
