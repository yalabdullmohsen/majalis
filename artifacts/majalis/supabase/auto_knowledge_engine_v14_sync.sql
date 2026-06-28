-- AKE v14 — backfill / incremental sync tracking (idempotent)

-- ── knowledge_items: source dates + import metadata ───────────────────────
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS source_published_at TIMESTAMPTZ;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS sync_run_id UUID REFERENCES ake_engine_runs(id) ON DELETE SET NULL;
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS import_mode TEXT
  CHECK (import_mode IS NULL OR import_mode IN ('backfill', 'incremental'));
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS original_url TEXT;

CREATE INDEX IF NOT EXISTS knowledge_items_source_published_idx
  ON knowledge_items (source_published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS knowledge_items_import_mode_idx
  ON knowledge_items (import_mode, created_at DESC);

-- ── ake_engine_runs: sync mode + enriched/indexed counts ──────────────────
ALTER TABLE ake_engine_runs ADD COLUMN IF NOT EXISTS import_mode TEXT
  CHECK (import_mode IS NULL OR import_mode IN ('backfill', 'incremental'));
ALTER TABLE ake_engine_runs ADD COLUMN IF NOT EXISTS sync_window_from TIMESTAMPTZ;
ALTER TABLE ake_engine_runs ADD COLUMN IF NOT EXISTS sync_window_to TIMESTAMPTZ;
ALTER TABLE ake_engine_runs ADD COLUMN IF NOT EXISTS enriched_count INT NOT NULL DEFAULT 0;
ALTER TABLE ake_engine_runs ADD COLUMN IF NOT EXISTS indexed_count INT NOT NULL DEFAULT 0;
ALTER TABLE ake_engine_runs ADD COLUMN IF NOT EXISTS skipped_date_count INT NOT NULL DEFAULT 0;

-- ── ake_connectors: per-connector backfill + cursor ───────────────────────
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS sync_mode TEXT NOT NULL DEFAULT 'auto'
  CHECK (sync_mode IN ('auto', 'backfill', 'incremental'));
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS backfill_completed_at TIMESTAMPTZ;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS backfill_month_key TEXT;
ALTER TABLE ake_connectors ADD COLUMN IF NOT EXISTS sync_cursor_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS ake_connectors_backfill_idx
  ON ake_connectors (backfill_month_key, backfill_completed_at);

-- ── Global sync state (one row) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ake_sync_state (
  id TEXT PRIMARY KEY DEFAULT 'global',
  current_month_key TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM'),
  global_backfill_completed BOOLEAN NOT NULL DEFAULT false,
  global_backfill_completed_at TIMESTAMPTZ,
  global_import_mode TEXT NOT NULL DEFAULT 'backfill'
    CHECK (global_import_mode IN ('backfill', 'incremental', 'auto')),
  last_successful_sync_at TIMESTAMPTZ,
  last_run_id UUID REFERENCES ake_engine_runs(id) ON DELETE SET NULL,
  last_run_summary JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO ake_sync_state (id, current_month_key, global_import_mode)
VALUES ('global', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM'), 'backfill')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE ake_sync_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ake_sync_state_admin ON ake_sync_state;
CREATE POLICY ake_sync_state_admin ON ake_sync_state FOR ALL USING (
  auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM governance_user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

GRANT SELECT ON ake_sync_state TO authenticated;
GRANT ALL ON ake_sync_state TO service_role;

NOTIFY pgrst, 'reload schema';
