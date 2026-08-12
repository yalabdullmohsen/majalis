/**
 * Tracked SQL migrations — idempotent apply via schema_migrations table.
 */

export const ENSURE_TRACKING_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  migration_name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checksum TEXT,
  duration_ms INT
);
ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS checksum TEXT;
ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS duration_ms INT;
ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ NOT NULL DEFAULT now();
`;

export function migrationChecksum(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

const LEGACY_TRACKING_UPGRADE_SQL = `
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
`;

export async function ensureTrackingTable(client) {
  if (!client?.query) return false;
  await client.query(ENSURE_TRACKING_SQL);
  await client.query(LEGACY_TRACKING_UPGRADE_SQL);
  return true;
}

export async function getAppliedMigrationNames(client) {
  if (!client?.query) return [];
  await ensureTrackingTable(client);
  const { rows } = await client.query(
    "SELECT migration_name FROM schema_migrations ORDER BY applied_at ASC",
  );
  return rows.map((r) => r.migration_name);
}

export async function recordAppliedMigration(client, migrationName, checksum, durationMs) {
  if (!client?.query) return;
  await client.query(
    `INSERT INTO schema_migrations (migration_name, checksum, duration_ms)
     VALUES ($1, $2, $3)
     ON CONFLICT (migration_name) DO UPDATE SET
       checksum = EXCLUDED.checksum,
       applied_at = now(),
       duration_ms = EXCLUDED.duration_ms`,
    [migrationName, checksum || null, durationMs ?? null],
  );
}
