import { SYNC_SCHEMA_VERSION, getSyncSchemaVersion, setSyncSchemaVersion } from "./local-store";

export type MigrationResult = {
  from: number;
  to: number;
  applied: string[];
};

/** ترحيل مخطط المزامنة — idempotent. */
export function runSyncMigrations(): MigrationResult {
  const from = getSyncSchemaVersion();
  const applied: string[] = [];
  let current = from;

  if (current < 1) {
    applied.push("v1-init-sync-schema");
    current = 1;
  }

  if (current > SYNC_SCHEMA_VERSION) {
    return { from, to: current, applied: [...applied, "schema-ahead-noop"] };
  }

  if (current !== from || from === 0 || from < SYNC_SCHEMA_VERSION) {
    setSyncSchemaVersion(Math.min(Math.max(current, 1), SYNC_SCHEMA_VERSION));
  }

  return { from, to: getSyncSchemaVersion(), applied };
}
