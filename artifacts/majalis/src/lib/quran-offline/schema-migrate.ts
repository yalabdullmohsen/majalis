/**
 * Silent, versioned schema migrations for the Quran offline Dexie DB.
 * Runs in the background (idle) without interrupting the active mushaf session.
 */
import {
  openQuranOfflineDb,
  QURAN_OFFLINE_DB_VERSION,
} from "@/lib/quran-offline/db";
import { compactQuranOfflineStores } from "@/lib/quran-offline/compaction";

const SCHEMA_FLAG_KEY = "mj-quran-offline-schema-rev-v2";

export type SilentMigrationReport = {
  fromVersion: number;
  toVersion: number;
  ran: boolean;
  backfilled: {
    assets: number;
    knowledge: number;
    reflections: number;
  };
  error?: string;
};

function readAppliedVersion(): number {
  try {
    const raw = localStorage.getItem(SCHEMA_FLAG_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeAppliedVersion(v: number): void {
  try {
    localStorage.setItem(SCHEMA_FLAG_KEY, String(v));
  } catch {
    /* ignore */
  }
}

/**
 * Ensure Dexie upgrade handlers have run + backfill any rows still missing v2 fields.
 * Safe to call repeatedly; no-ops when already at current revision.
 */
export async function runSilentSchemaMigrations(opts?: {
  force?: boolean;
  signal?: AbortSignal;
}): Promise<SilentMigrationReport> {
  const toVersion = QURAN_OFFLINE_DB_VERSION;
  const fromVersion = readAppliedVersion();
  const report: SilentMigrationReport = {
    fromVersion,
    toVersion,
    ran: false,
    backfilled: { assets: 0, knowledge: 0, reflections: 0 },
  };

  if (!opts?.force && fromVersion >= toVersion) {
    return report;
  }
  if (opts?.signal?.aborted) {
    report.error = "aborted";
    return report;
  }

  try {
    // Opening the DB applies Dexie version(2).upgrade(...) when needed
    const db = await openQuranOfflineDb();
    if (!db) {
      report.error = "indexeddb-unavailable";
      return report;
    }

    // Yield so an active page flip is never contended
    await new Promise<void>((r) => {
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(() => r(), { timeout: 2_000 });
      } else {
        setTimeout(r, 0);
      }
    });
    if (opts?.signal?.aborted) {
      report.error = "aborted";
      return report;
    }

    // Integrity pass doubles as silent field backfill for rows written mid-upgrade
    const compact = await compactQuranOfflineStores(opts?.signal);
    report.backfilled.assets = compact.assetsRepaired;
    report.backfilled.knowledge = compact.knowledgeRepaired;
    report.backfilled.reflections = compact.reflectionsRepaired;
    report.ran = true;
    writeAppliedVersion(toVersion);
    return report;
  } catch (err) {
    report.error = err instanceof Error ? err.message : "migrate-failed";
    return report;
  }
}

export function getAppliedSchemaVersion(): number {
  return readAppliedVersion();
}

export function __resetSilentMigrationFlagForTests(): void {
  try {
    localStorage.removeItem(SCHEMA_FLAG_KEY);
  } catch {
    /* ignore */
  }
}
