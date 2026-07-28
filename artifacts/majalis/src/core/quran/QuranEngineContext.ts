/**
 * QuranEngineContext — unified page / verse / audio state for the Quran Engine.
 *
 * Bridges in-memory state to DatabaseManager.saveProgress / getReadingProgress.
 */
import {
  getDatabaseManager,
  type DatabaseManager,
  type ReadingProgress,
} from "./DatabaseManager";

export type ActiveVerse = {
  surah: number;
  ayah: number;
  page?: number;
};

export type ReadingProgressInput = {
  surah: number;
  ayah: number;
  page?: number;
};

export type QuranEngineContextApi = {
  setPage(page: number): void;
  setActiveVerse(verse: ActiveVerse, opts?: { persist?: boolean }): void;
  clearActiveVerse(): void;
  loadLastReadingProgress(): Promise<ReadingProgress | null>;
  updateReadingProgress(progress: ReadingProgressInput): Promise<ReadingProgress | null>;
  readonly db: DatabaseManager;
};

type EngineMemory = {
  page: number;
  surah: number;
  ayah: number | null;
};

class QuranEngineContextImpl implements QuranEngineContextApi {
  readonly db = getDatabaseManager();
  private memory: EngineMemory = { page: 1, surah: 1, ayah: null };

  setPage(page: number): void {
    this.memory.page = Math.min(604, Math.max(1, Math.floor(page) || 1));
  }

  setActiveVerse(verse: ActiveVerse, opts?: { persist?: boolean }): void {
    this.memory.surah = Math.min(114, Math.max(1, Math.floor(verse.surah) || 1));
    this.memory.ayah = Math.max(1, Math.floor(verse.ayah) || 1);
    if (verse.page != null) this.setPage(verse.page);
    if (opts?.persist !== false) {
      void this.updateReadingProgress({
        surah: this.memory.surah,
        ayah: this.memory.ayah,
        page: this.memory.page,
      });
    }
  }

  clearActiveVerse(): void {
    this.memory.ayah = null;
  }

  async loadLastReadingProgress(): Promise<ReadingProgress | null> {
    try {
      await this.db.initialize();
      const row = await this.db.getReadingProgress();
      if (row) {
        this.memory = {
          page: row.lastPage,
          surah: row.lastSurah,
          ayah: row.lastAyah,
        };
      }
      return row;
    } catch (err) {
      console.warn("[QuranEngineContext] loadLastReadingProgress:", err);
      return null;
    }
  }

  async updateReadingProgress(progress: ReadingProgressInput): Promise<ReadingProgress | null> {
    try {
      const page = progress.page ?? this.memory.page;
      this.memory = {
        page,
        surah: progress.surah,
        ayah: progress.ayah,
      };
      return await this.db.saveProgress({
        lastSurah: progress.surah,
        lastAyah: progress.ayah,
        lastPage: page,
      });
    } catch (err) {
      console.warn("[QuranEngineContext] updateReadingProgress:", err);
      return null;
    }
  }
}

let ctx: QuranEngineContextImpl | null = null;

export function getQuranEngineContext(): QuranEngineContextApi {
  if (!ctx) ctx = new QuranEngineContextImpl();
  return ctx;
}
