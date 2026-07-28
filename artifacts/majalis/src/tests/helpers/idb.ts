/**
 * Shared helpers for Quran Engine Vitest suites.
 */
import Dexie from "dexie";
import {
  CORE_QURAN_DB_NAME,
  DatabaseManager,
  getDatabaseManager,
} from "@/core/quran/DatabaseManager";

export async function deleteQuranEngineDb(name = CORE_QURAN_DB_NAME): Promise<void> {
  DatabaseManager.__resetInstanceForTests();
  try {
    await Dexie.delete(name);
  } catch {
    /* ignore — DB may not exist yet */
  }
}

export async function freshDatabaseManager(): Promise<DatabaseManager> {
  await deleteQuranEngineDb();
  const db = getDatabaseManager();
  const ok = await db.initialize();
  if (!ok) {
    throw new Error("DatabaseManager.initialize() failed under fake-indexeddb");
  }
  return db;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
