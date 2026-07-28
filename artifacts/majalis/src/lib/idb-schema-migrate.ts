/**
 * Automated IndexedDB schema migration registry.
 * Records applied migration ids in the Dexie meta store; never drops user data.
 */

import {
  OFFLINE_STORES,
  engineGetValue,
  enginePut,
  engineTransact,
  ensureOfflineSchema,
} from "@/lib/offline-engine";

const MIGRATION_META_KEY = "schema-migrations-v1";

export type SchemaMigration = {
  id: string;
  /** Semver-ish or monotonic label for logs */
  version: number;
  description: string;
  run: () => Promise<void>;
};

type MigrationLedger = {
  applied: string[];
  updatedAt: string;
};

async function readLedger(): Promise<MigrationLedger> {
  const existing = await engineGetValue<MigrationLedger>(OFFLINE_STORES.meta, MIGRATION_META_KEY);
  if (existing && Array.isArray(existing.applied)) return existing;
  return { applied: [], updatedAt: new Date(0).toISOString() };
}

async function writeLedger(ledger: MigrationLedger): Promise<void> {
  await enginePut(OFFLINE_STORES.meta, MIGRATION_META_KEY, {
    ...ledger,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Built-in migrations — additive only.
 * v2 index upgrade is handled by Dexie `version(2)` in offline-engine;
 * this registry covers data-shape / housekeeping steps.
 */
export const SCHEMA_MIGRATIONS: SchemaMigration[] = [
  {
    id: "2026-07-normalize-meta-timestamps",
    version: 2,
    description: "Ensure meta rows expose ISO updatedAt via transactional touch",
    run: async () => {
      await engineTransact("rw", async ({ records }) => {
        const metaRows = await records.where("store").equals(OFFLINE_STORES.meta).toArray();
        const now = new Date().toISOString();
        for (const row of metaRows) {
          if (!row.updatedAt || Number.isNaN(Date.parse(row.updatedAt))) {
            await records.put({ ...row, updatedAt: now });
          }
        }
      });
    },
  },
];

let migrating: Promise<{ ran: string[]; skipped: string[] }> | null = null;

/** Run pending migrations exactly once (coalesced). Safe on every boot. */
export async function runSchemaMigrations(
  extra: SchemaMigration[] = [],
): Promise<{ ran: string[]; skipped: string[] }> {
  if (migrating) return migrating;

  migrating = (async () => {
    await ensureOfflineSchema();
    const ledger = await readLedger();
    const applied = new Set(ledger.applied);
    const queue = [...SCHEMA_MIGRATIONS, ...extra].sort((a, b) => a.version - b.version);
    const ran: string[] = [];
    const skipped: string[] = [];

    for (const mig of queue) {
      if (applied.has(mig.id)) {
        skipped.push(mig.id);
        continue;
      }
      try {
        await mig.run();
        applied.add(mig.id);
        ran.push(mig.id);
        await writeLedger({ applied: [...applied], updatedAt: new Date().toISOString() });
      } catch {
        // Stop on failure — leave remaining for next boot; never mark applied
        break;
      }
    }

    return { ran, skipped };
  })().finally(() => {
    migrating = null;
  });

  return migrating;
}
