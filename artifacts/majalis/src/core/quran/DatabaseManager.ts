/**
 * DatabaseManager — Dexie/IndexedDB persistence for the Quran Engine.
 *
 * Planned stores: khatmah_store · user_reflections_store · offline_assets_store · settings_store
 * Status: scaffold only — implement CRUD + schema versioning next.
 */

export type KhatmahStore = {
  id: string;
  title: string;
  type: "reading" | "memorization";
  current_surah: number;
  current_ayah: number;
  current_page: number;
  daily_wird_target: number;
  streak_days: number;
  last_read_timestamp: number;
  is_completed: boolean;
};

export type ReflectionsStore = {
  id: string;
  surah_id: number;
  ayah_id: number;
  note_text: string;
  tags: string[];
  created_at: number;
};

/** Singleton placeholder — replace body with Dexie open + CRUD. */
export class DatabaseManager {
  private static instance: DatabaseManager | null = null;

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /** TODO: open IndexedDB / apply migrations */
  async initialize(): Promise<boolean> {
    return false;
  }

  /** TODO: upsert reading profile */
  async upsertKhatmah(_row: Partial<KhatmahStore> & { id: string }): Promise<KhatmahStore | null> {
    return null;
  }

  /** TODO: fetch reading profile */
  async getKhatmah(_id: string): Promise<KhatmahStore | null> {
    return null;
  }
}

export function getDatabaseManager(): DatabaseManager {
  return DatabaseManager.getInstance();
}
