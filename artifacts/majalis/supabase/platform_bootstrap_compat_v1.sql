-- =====================================================================
--  Platform bootstrap compatibility — idempotent schema upgrades
--  Fixes legacy schema_migrations, admin_audit_logs.table_name, tracking tables
--  Safe to re-run on every bootstrap/migration pass.
-- =====================================================================

-- ── 1. schema_migrations legacy upgrade (auto_engine uses SERIAL id) ─────
CREATE TABLE IF NOT EXISTS schema_migrations (
  migration_name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checksum TEXT,
  duration_ms INT
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'schema_migrations'
  ) THEN
    ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS checksum TEXT;
    ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS duration_ms INT;
    ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ DEFAULT now();

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'schema_migrations' AND column_name = 'id'
    ) THEN
      BEGIN
        ALTER TABLE schema_migrations
          ADD CONSTRAINT schema_migrations_migration_name_key UNIQUE (migration_name);
      EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
      END;
    END IF;
  END IF;
END $$;

-- ── 2. admin_audit_logs — ensure table_name column before indexes ───────
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID,
  action     TEXT NOT NULL DEFAULT 'unknown',
  table_name TEXT NOT NULL DEFAULT 'unknown',
  record_id  UUID,
  metadata   JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_audit_logs'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'table_name'
    ) THEN
      ALTER TABLE admin_audit_logs ADD COLUMN table_name TEXT NOT NULL DEFAULT 'unknown';
    END IF;
    ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS content_kind TEXT;
    ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
    ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
    ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS old_values JSONB;
    ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS new_values JSONB;
    UPDATE admin_audit_logs SET table_name = 'unknown' WHERE table_name IS NULL;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'table_name'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS admin_audit_logs_table_idx ON admin_audit_logs (table_name, created_at DESC)';
    END IF;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'user_id'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS admin_audit_logs_user_idx ON admin_audit_logs (user_id, created_at DESC)';
    END IF;
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── 3. Bootstrap run history ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_bootstrap_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  current_step TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  error TEXT,
  owner_actions JSONB,
  production_ready BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_platform_bootstrap_runs_started
  ON platform_bootstrap_runs (started_at DESC);

INSERT INTO schema_migrations (migration_name)
SELECT 'platform_bootstrap_compat_v1'
WHERE NOT EXISTS (
  SELECT 1 FROM schema_migrations WHERE migration_name = 'platform_bootstrap_compat_v1'
);
