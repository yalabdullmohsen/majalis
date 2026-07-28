/**
 * QuranEngineContext — unified page / verse / audio state for the Quran Engine.
 *
 * Status: scaffold only — bridge to DatabaseManager + in-memory store next.
 */
import { getDatabaseManager, type DatabaseManager, type KhatmahStore } from "./DatabaseManager";

export type ActiveVerse = {
  surah: number;
  ayah: number;
  page?: number;
};

export type ReadingProgressInput = {
  surah: number;
  ayah: number;
  page?: number;
  khatmahId?: string;
  title?: string;
};

export type QuranEngineContextApi = {
  setPage(page: number): void;
  setActiveVerse(verse: ActiveVerse): void;
  clearActiveVerse(): void;
  loadLastReadingProgress(): Promise<KhatmahStore | null>;
  updateReadingProgress(progress: ReadingProgressInput): Promise<KhatmahStore | null>;
  readonly db: DatabaseManager;
};

class QuranEngineContextImpl implements QuranEngineContextApi {
  readonly db = getDatabaseManager();

  setPage(_page: number): void {
    // TODO: patch engine store
  }

  setActiveVerse(_verse: ActiveVerse): void {
    // TODO: patch engine store (+ optional persist)
  }

  clearActiveVerse(): void {
    // TODO: clear ayah / verseKey
  }

  async loadLastReadingProgress(): Promise<KhatmahStore | null> {
    // TODO: hydrate from DatabaseManager.khatmah_store
    return null;
  }

  async updateReadingProgress(_progress: ReadingProgressInput): Promise<KhatmahStore | null> {
    // TODO: upsert khatmah + sync in-memory state
    return null;
  }
}

let ctx: QuranEngineContextImpl | null = null;

export function getQuranEngineContext(): QuranEngineContextApi {
  if (!ctx) ctx = new QuranEngineContextImpl();
  return ctx;
}
