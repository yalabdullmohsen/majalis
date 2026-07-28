/**
 * QuranEngineContext — unified non-React state manager for pages, active verse,
 * and audio. Coordinates DatabaseManager + ResourceManager without blocking UI.
 *
 * Existing React hooks (`useQuranEngine`, Provider) remain the view layer;
 * this module is the functional core façade over `quran-engine-store`.
 */
import {
  getQuranEngineState,
  patchQuranEngineState,
  subscribeQuranEngine,
  resetQuranEngineState,
  type QuranEngineState,
  type QuranEngineWarmPhase,
} from "@/lib/quran-engine-store";
import type { PlayerState, TeachPhase } from "@/hooks/useAyahPlayer";
import { getDatabaseManager, type DatabaseManager } from "@/core/quran/DatabaseManager";
import { getResourceManager, type ResourceManager } from "@/core/quran/ResourceManager";
import { getIndexingService, type IndexingService } from "@/core/quran/IndexingService";

export type ActiveVerse = {
  surah: number;
  ayah: number;
  page?: number;
};

export type AudioSnapshot = {
  reciterId: string;
  playerState: PlayerState;
  teachPhase: TeachPhase;
};

export type QuranEngineContextApi = {
  getState(): QuranEngineState;
  subscribe(listener: () => void): () => void;
  setPage(page: number): void;
  setActiveVerse(verse: ActiveVerse): void;
  clearActiveVerse(): void;
  setAudio(partial: Partial<AudioSnapshot>): void;
  setWarmPhase(phase: QuranEngineWarmPhase, stats?: { pagesCached?: number; fontsCached?: number }): void;
  reset(): void;
  readonly db: DatabaseManager;
  readonly resources: ResourceManager;
  readonly indexing: IndexingService;
};

/**
 * Core context singleton — pure TS, no React imports in the public API surface
 * beyond types already used by the engine store.
 */
class QuranEngineContextImpl implements QuranEngineContextApi {
  readonly db = getDatabaseManager();
  readonly resources = getResourceManager();
  readonly indexing = getIndexingService();

  private booted = false;

  /** Idempotent: open IDB + start resource lifecycle (idle). */
  async boot(): Promise<void> {
    if (this.booted) return;
    this.booted = true;
    // Kick resource manager first so pressure flags exist before DB warm
    this.resources.start();
    await this.db.initialize();
  }

  getState(): QuranEngineState {
    return getQuranEngineState();
  }

  subscribe(listener: () => void): () => void {
    return subscribeQuranEngine(listener);
  }

  setPage(page: number): void {
    const p = Math.min(604, Math.max(1, Math.floor(page) || 1));
    patchQuranEngineState({ page: p });
  }

  setActiveVerse(verse: ActiveVerse): void {
    const surah = Math.min(114, Math.max(1, Math.floor(verse.surah) || 1));
    const ayah = Math.max(1, Math.floor(verse.ayah) || 1);
    const patch: Partial<QuranEngineState> = {
      surah,
      ayah,
      verseKey: `${surah}:${ayah}`,
    };
    if (verse.page != null) {
      patch.page = Math.min(604, Math.max(1, Math.floor(verse.page) || 1));
    }
    patchQuranEngineState(patch);
    // Non-blocking: touch knowledge LRU for the active ayah
    void this.db.getKnowledge(surah, ayah).catch(() => undefined);
  }

  clearActiveVerse(): void {
    patchQuranEngineState({ ayah: null, verseKey: null });
  }

  setAudio(partial: Partial<AudioSnapshot>): void {
    const next: Partial<QuranEngineState> = {};
    if (partial.reciterId != null) next.reciterId = partial.reciterId;
    if (partial.playerState != null) next.playerState = partial.playerState;
    if (partial.teachPhase != null) next.teachPhase = partial.teachPhase;
    patchQuranEngineState(next);

    // Under heavy decode pressure, soft-suspend non-essential prefetch
    if (partial.playerState === "playing") {
      // no-op unless resources already under pressure — flags handled elsewhere
    }
  }

  setWarmPhase(
    phase: QuranEngineWarmPhase,
    stats?: { pagesCached?: number; fontsCached?: number },
  ): void {
    patchQuranEngineState({
      warmPhase: phase,
      ...(stats?.pagesCached != null ? { pagesCached: stats.pagesCached } : {}),
      ...(stats?.fontsCached != null ? { fontsCached: stats.fontsCached } : {}),
    });
  }

  reset(): void {
    resetQuranEngineState();
  }
}

let ctx: QuranEngineContextImpl | null = null;

export function getQuranEngineContext(): QuranEngineContextApi & { boot(): Promise<void> } {
  if (!ctx) ctx = new QuranEngineContextImpl();
  return ctx;
}

/** Convenience re-exports for consumers. */
export type { QuranEngineState, QuranEngineWarmPhase };
