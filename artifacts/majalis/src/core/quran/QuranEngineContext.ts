/**
 * QuranEngineContext — unified state manager for pages, active verse, and audio,
 * bridged to DatabaseManager for durable reading progress (khatmah_store).
 *
 * - Non-React API: `getQuranEngineContext()`
 * - React hook: `useQuranEngineCore()` — resumes last ayah on mount
 *
 * DB failures never throw into the UI thread.
 */
import { useCallback, useEffect, useState } from "react";
import {
  getQuranEngineState,
  patchQuranEngineState,
  subscribeQuranEngine,
  resetQuranEngineState,
  useQuranEngineSelector,
  type QuranEngineState,
  type QuranEngineWarmPhase,
} from "@/lib/quran-engine-store";
import type { PlayerState, TeachPhase } from "@/core/audio/types";
import {
  getDatabaseManager,
  TAJWEED_ENABLED_SETTING_KEY,
  type DatabaseManager,
  type KhatmahStore,
} from "@/core/quran/DatabaseManager";
import { getResourceManager, type ResourceManager } from "@/core/quran/ResourceManager";
import { getIndexingService, type IndexingService } from "@/core/quran/IndexingService";
import { getAudioEngine, type AudioEngine } from "@/core/audio/AudioEngine";
import type { RepeatMode, RepeatRange } from "@/core/audio/types";

/** Stable id for the in-progress reading profile used by the core engine. */
export const ACTIVE_READING_KHATMAH_ID = "core-active-reading";

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

export type ReadingProgressInput = {
  surah: number;
  ayah: number;
  page?: number;
  /** Override profile id (defaults to ACTIVE_READING_KHATMAH_ID). */
  khatmahId?: string;
  title?: string;
  type?: KhatmahStore["type"];
  daily_wird_target?: number;
};

export type QuranEngineContextApi = {
  getState(): QuranEngineState;
  subscribe(listener: () => void): () => void;
  setPage(page: number): void;
  setActiveVerse(verse: ActiveVerse, opts?: { persist?: boolean; seekAudio?: boolean }): void;
  clearActiveVerse(): void;
  setAudio(partial: Partial<AudioSnapshot>): void;
  setWarmPhase(phase: QuranEngineWarmPhase, stats?: { pagesCached?: number; fontsCached?: number }): void;
  /** Flip optional Tajweed color coding and persist to settings_store. */
  toggleTajweed(): void;
  /** Explicitly set Tajweed coloring on/off (persists). */
  setTajweedEnabled(enabled: boolean): void;
  /** Hydrate isTajweedEnabled from settings_store (safe). */
  loadTajweedPreference(): Promise<boolean>;
  /** Load most recently read khatmah profile into engine state. */
  loadLastReadingProgress(): Promise<KhatmahStore | null>;
  /** Upsert current ayah into khatmah_store (safe — never throws). */
  updateReadingProgress(progress: ReadingProgressInput): Promise<KhatmahStore | null>;
  /** Play / toggle / seek via the shared AudioEngine. */
  playAyah(surah: number, ayah: number): Promise<void>;
  togglePlayAyah(surah: number, ayah: number): Promise<void>;
  seekAudioToAyah(surah: number, ayah: number): Promise<void>;
  pauseAudio(): void;
  setRepeatMode(mode: RepeatMode, range?: RepeatRange): void;
  downloadSurahAudio(surah: number, reciterId?: string): Promise<boolean>;
  reset(): void;
  readonly db: DatabaseManager;
  readonly resources: ResourceManager;
  readonly indexing: IndexingService;
  readonly audio: AudioEngine;
};

function clampSurah(n: number): number {
  return Math.min(114, Math.max(1, Math.floor(n) || 1));
}
function clampAyah(n: number): number {
  return Math.max(1, Math.floor(n) || 1);
}
function clampPage(n: number): number {
  return Math.min(604, Math.max(1, Math.floor(n) || 1));
}

/**
 * Core context singleton — coordinates store + DatabaseManager persistence.
 */
class QuranEngineContextImpl implements QuranEngineContextApi {
  readonly db = getDatabaseManager();
  readonly resources = getResourceManager();
  readonly indexing = getIndexingService();
  readonly audio = getAudioEngine();

  private booted = false;
  private audioUnsubs: Array<() => void> = [];

  /** Idempotent: open IDB + start resource lifecycle (idle) + hydrate settings. */
  async boot(): Promise<void> {
    if (this.booted) return;
    this.booted = true;
    try {
      this.resources.start();
    } catch {
      /* never block boot */
    }
    try {
      await this.db.initialize();
    } catch {
      /* IndexedDB may be unavailable — engine still works in-memory */
    }
    try {
      await this.loadTajweedPreference();
    } catch {
      /* preference defaults to false */
    }
    this.bindAudioEngine();
  }

  /** Bridge AudioEngine events → store patches (idempotent). */
  private bindAudioEngine(): void {
    if (this.audioUnsubs.length) return;
    this.audioUnsubs.push(
      this.audio.on("onStateChange", (snap) => {
        patchQuranEngineState({
          reciterId: snap.reciterId,
          playerState: snap.playerState,
          teachPhase: snap.teachPhase,
        });
      }),
    );
    this.audioUnsubs.push(
      this.audio.on("onAyahChange", (ev) => {
        patchQuranEngineState({
          surah: ev.surah,
          ayah: ev.ayah,
          verseKey: ev.verseKey,
        });
      }),
    );
  }

  getState(): QuranEngineState {
    return getQuranEngineState();
  }

  subscribe(listener: () => void): () => void {
    return subscribeQuranEngine(listener);
  }

  setPage(page: number): void {
    patchQuranEngineState({ page: clampPage(page) });
  }

  /**
   * Update in-memory active verse. When `persist` is true (default), also
   * fire-and-forget `updateReadingProgress` into khatmah_store.
   */
  setActiveVerse(verse: ActiveVerse, opts?: { persist?: boolean; seekAudio?: boolean }): void {
    const surah = clampSurah(verse.surah);
    const ayah = clampAyah(verse.ayah);
    const patch: Partial<QuranEngineState> = {
      surah,
      ayah,
      verseKey: `${surah}:${ayah}`,
    };
    if (verse.page != null) {
      patch.page = clampPage(verse.page);
    }
    patchQuranEngineState(patch);

    // Non-blocking knowledge LRU touch
    void this.db.getKnowledge(surah, ayah).catch(() => undefined);

    if (opts?.persist !== false) {
      void this.updateReadingProgress({
        surah,
        ayah,
        page: patch.page ?? this.getState().page,
      });
    }

    // When audio is actively playing, seek to the newly selected ayah
    const ps = this.getState().playerState;
    const shouldSeek =
      opts?.seekAudio === true ||
      (opts?.seekAudio !== false &&
        (ps === "playing" || ps === "buffering" || ps === "loading"));
    if (shouldSeek) {
      void this.audio.seekToAyah(surah, ayah).catch(() => undefined);
    }
  }

  async playAyah(surah: number, ayah: number): Promise<void> {
    try {
      this.bindAudioEngine();
      await this.audio.playAyah(clampSurah(surah), clampAyah(ayah));
    } catch {
      /* ignore */
    }
  }

  async togglePlayAyah(surah: number, ayah: number): Promise<void> {
    try {
      this.bindAudioEngine();
      await this.audio.togglePlay(clampSurah(surah), clampAyah(ayah));
    } catch {
      /* ignore */
    }
  }

  async seekAudioToAyah(surah: number, ayah: number): Promise<void> {
    try {
      this.bindAudioEngine();
      await this.audio.seekToAyah(clampSurah(surah), clampAyah(ayah));
    } catch {
      /* ignore */
    }
  }

  pauseAudio(): void {
    try {
      this.audio.pause();
    } catch {
      /* ignore */
    }
  }

  setRepeatMode(mode: RepeatMode, range?: RepeatRange): void {
    try {
      this.audio.setRepeatMode(mode, range);
    } catch {
      /* ignore */
    }
  }

  async downloadSurahAudio(surah: number, reciterId?: string): Promise<boolean> {
    try {
      this.bindAudioEngine();
      return await this.audio.downloadSurahOffline(clampSurah(surah), reciterId);
    } catch {
      return false;
    }
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

  /** Persist + patch `isTajweedEnabled`. Never throws. */
  setTajweedEnabled(enabled: boolean): void {
    const next = Boolean(enabled);
    patchQuranEngineState({ isTajweedEnabled: next });
    void this.db.setSetting(TAJWEED_ENABLED_SETTING_KEY, next).catch(() => undefined);
  }

  toggleTajweed(): void {
    this.setTajweedEnabled(!this.getState().isTajweedEnabled);
  }

  async loadTajweedPreference(): Promise<boolean> {
    try {
      await this.db.initialize();
      const stored = await this.db.getSetting<boolean>(TAJWEED_ENABLED_SETTING_KEY);
      const enabled = stored === true;
      patchQuranEngineState({ isTajweedEnabled: enabled });
      return enabled;
    } catch {
      patchQuranEngineState({ isTajweedEnabled: false });
      return false;
    }
  }

  /**
   * Resume where the user left off — reads the freshest active khatmah row
   * (via DatabaseManager.khatmahStore / listKhatmah) and patches engine state.
   */
  async loadLastReadingProgress(): Promise<KhatmahStore | null> {
    try {
      await this.boot();
      // Prefer direct table when open; fall back to safe list helper
      let best: KhatmahStore | null = null;
      const table = this.db.khatmahStore;
      if (table) {
        try {
          const active = await table
            .where("is_completed")
            .equals(false)
            .sortBy("last_read_timestamp");
          best = active.length ? active[active.length - 1]! : null;
          if (!best) {
            const all = await table.orderBy("last_read_timestamp").reverse().first();
            best = all ?? null;
          }
        } catch {
          best = null;
        }
      }
      if (!best) {
        const listed = await this.db.listKhatmah({ activeOnly: true });
        best = listed[0] ?? (await this.db.listKhatmah())[0] ?? null;
      }
      // Prefer the stable core profile when present
      const core = await this.db.getKhatmah(ACTIVE_READING_KHATMAH_ID);
      if (core && (!best || (core.last_read_timestamp ?? 0) >= (best.last_read_timestamp ?? 0))) {
        best = core;
      }

      if (!best) return null;

      patchQuranEngineState({
        surah: clampSurah(best.current_surah),
        ayah: clampAyah(best.current_ayah),
        verseKey: `${clampSurah(best.current_surah)}:${clampAyah(best.current_ayah)}`,
        page: clampPage(best.current_page || 1),
      });
      return best;
    } catch (err) {
      console.warn(
        "[QuranEngineContext] loadLastReadingProgress failed:",
        err instanceof Error ? err.message : err,
      );
      return null;
    }
  }

  /**
   * Persist reading progress into khatmah_store (upsert).
   * Never throws — returns null on failure so the UI thread stays stable.
   * Also bumps today's page counter and streak when the calendar day advances.
   */
  async updateReadingProgress(progress: ReadingProgressInput): Promise<KhatmahStore | null> {
    try {
      await this.boot();
      const surah = clampSurah(progress.surah);
      const ayah = clampAyah(progress.ayah);
      const page = progress.page != null ? clampPage(progress.page) : this.getState().page;
      const id = progress.khatmahId ?? ACTIVE_READING_KHATMAH_ID;

      const existing = await this.db.getKhatmah(id);
      const now = Date.now();
      let streak = existing?.streak_days ?? 0;
      if (existing?.last_read_timestamp) {
        const last = new Date(existing.last_read_timestamp);
        const today = new Date(now);
        const lastKey = `${last.getFullYear()}-${last.getMonth()}-${last.getDate()}`;
        const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        const yday = new Date(now);
        yday.setDate(yday.getDate() - 1);
        const ydayKey = `${yday.getFullYear()}-${yday.getMonth()}-${yday.getDate()}`;
        if (lastKey === todayKey) {
          /* same day — keep streak */
        } else if (lastKey === ydayKey) {
          streak = Math.max(1, streak + 1);
        } else {
          streak = 1;
        }
      } else {
        streak = Math.max(1, streak || 1);
      }

      const row = await this.db.upsertKhatmah({
        id,
        title: progress.title ?? existing?.title ?? "ختمة جارية",
        type: progress.type ?? existing?.type ?? "reading",
        current_surah: surah,
        current_ayah: ayah,
        current_page: page,
        daily_wird_target: progress.daily_wird_target ?? existing?.daily_wird_target ?? 1,
        streak_days: streak,
        is_completed: existing?.is_completed ?? false,
        last_read_timestamp: now,
      });

      if (row) {
        // Keep in-memory engine state aligned (persist path may be called alone)
        patchQuranEngineState({
          surah,
          ayah,
          verseKey: `${surah}:${ayah}`,
          page,
        });
        // Fire-and-forget daily page aggregate — never block UI
        void this.db.recordDailyPageRead(page).catch(() => undefined);
      }
      return row;
    } catch (err) {
      console.warn(
        "[QuranEngineContext] updateReadingProgress failed:",
        err instanceof Error ? err.message : err,
      );
      return null;
    }
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

export type UseQuranEngineCoreResult = {
  state: QuranEngineState;
  /** Alias for `state.page` (1–604). */
  activePage: number;
  /** True while the initial IDB resume is in flight. */
  hydrating: boolean;
  /** Last persistence error message (null when healthy). */
  persistError: string | null;
  /** Optional Tajweed color coding (from engine state). */
  isTajweedEnabled: boolean;
  setPage: (page: number) => void;
  /** Navigate to an ayah (resolves mushaf page when omitted). */
  goToAyah: (verse: ActiveVerse) => Promise<void>;
  setActiveVerse: (verse: ActiveVerse, opts?: { persist?: boolean; seekAudio?: boolean }) => void;
  updateReadingProgress: (progress: ReadingProgressInput) => Promise<KhatmahStore | null>;
  loadLastReadingProgress: () => Promise<KhatmahStore | null>;
  clearActiveVerse: () => void;
  setAudio: (partial: Partial<AudioSnapshot>) => void;
  toggleTajweed: () => void;
  setTajweedEnabled: (enabled: boolean) => void;
  playAyah: (surah: number, ayah: number) => Promise<void>;
  togglePlayAyah: (surah: number, ayah: number) => Promise<void>;
  seekAudioToAyah: (surah: number, ayah: number) => Promise<void>;
  pauseAudio: () => void;
  setRepeatMode: (mode: RepeatMode, range?: RepeatRange) => void;
  downloadSurahAudio: (surah: number, reciterId?: string) => Promise<boolean>;
  audio: AudioEngine;
  db: DatabaseManager;
};

/**
 * React hook — on mount, resumes the last ayah from DatabaseManager.khatmahStore.
 * All DB work is async + try/catch so render never crashes.
 */
export function useQuranEngineCore(): UseQuranEngineCoreResult {
  const engine = getQuranEngineContext();
  const state = useQuranEngineSelector((s) => s);
  const [hydrating, setHydrating] = useState(true);
  const [persistError, setPersistError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHydrating(true);
    void (async () => {
      try {
        await Promise.all([
          engine.loadLastReadingProgress(),
          engine.loadTajweedPreference(),
        ]);
        if (!cancelled) setPersistError(null);
      } catch (err) {
        if (!cancelled) {
          setPersistError(err instanceof Error ? err.message : "resume-failed");
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [engine]);

  const setPage = useCallback((page: number) => {
    try {
      engine.setPage(page);
    } catch {
      /* ignore */
    }
  }, [engine]);

  const goToAyah = useCallback(
    async (verse: ActiveVerse) => {
      try {
        let page = verse.page;
        if (page == null) {
          try {
            const { findPageForAyah, loadPageJuzIndex } = await import(
              "@/lib/recitation-ai/page-juz-lookup"
            );
            const index = await loadPageJuzIndex();
            page = findPageForAyah(index, verse.surah, verse.ayah) ?? undefined;
          } catch {
            page = undefined;
          }
        }
        engine.setActiveVerse(
          { surah: verse.surah, ayah: verse.ayah, page },
          { persist: true },
        );
      } catch (err) {
        setPersistError(err instanceof Error ? err.message : "go-to-ayah-failed");
      }
    },
    [engine],
  );

  const setActiveVerse = useCallback(
    (verse: ActiveVerse, opts?: { persist?: boolean; seekAudio?: boolean }) => {
      try {
        engine.setActiveVerse(verse, opts);
      } catch (err) {
        setPersistError(err instanceof Error ? err.message : "set-verse-failed");
      }
    },
    [engine],
  );

  const updateReadingProgress = useCallback(
    async (progress: ReadingProgressInput) => {
      try {
        const row = await engine.updateReadingProgress(progress);
        if (!row) setPersistError("upsert-khatmah-failed");
        else setPersistError(null);
        return row;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "upsert-khatmah-failed";
        setPersistError(msg);
        return null;
      }
    },
    [engine],
  );

  const loadLastReadingProgress = useCallback(async () => {
    try {
      const row = await engine.loadLastReadingProgress();
      setPersistError(null);
      return row;
    } catch (err) {
      setPersistError(err instanceof Error ? err.message : "resume-failed");
      return null;
    }
  }, [engine]);

  const clearActiveVerse = useCallback(() => {
    try {
      engine.clearActiveVerse();
    } catch {
      /* ignore */
    }
  }, [engine]);

  const setAudio = useCallback((partial: Partial<AudioSnapshot>) => {
    try {
      engine.setAudio(partial);
    } catch {
      /* ignore */
    }
  }, [engine]);

  const toggleTajweed = useCallback(() => {
    try {
      engine.toggleTajweed();
    } catch {
      /* ignore */
    }
  }, [engine]);

  const setTajweedEnabled = useCallback((enabled: boolean) => {
    try {
      engine.setTajweedEnabled(enabled);
    } catch {
      /* ignore */
    }
  }, [engine]);

  const playAyah = useCallback(
    async (surah: number, ayah: number) => {
      await engine.playAyah(surah, ayah);
    },
    [engine],
  );

  const togglePlayAyah = useCallback(
    async (surah: number, ayah: number) => {
      await engine.togglePlayAyah(surah, ayah);
    },
    [engine],
  );

  const seekAudioToAyah = useCallback(
    async (surah: number, ayah: number) => {
      await engine.seekAudioToAyah(surah, ayah);
    },
    [engine],
  );

  const pauseAudio = useCallback(() => {
    engine.pauseAudio();
  }, [engine]);

  const setRepeatMode = useCallback(
    (mode: RepeatMode, range?: RepeatRange) => {
      engine.setRepeatMode(mode, range);
    },
    [engine],
  );

  const downloadSurahAudio = useCallback(
    async (surah: number, reciterId?: string) => engine.downloadSurahAudio(surah, reciterId),
    [engine],
  );

  return {
    state,
    activePage: state.page,
    hydrating,
    persistError,
    isTajweedEnabled: state.isTajweedEnabled,
    setPage,
    goToAyah,
    setActiveVerse,
    updateReadingProgress,
    loadLastReadingProgress,
    clearActiveVerse,
    setAudio,
    toggleTajweed,
    setTajweedEnabled,
    playAyah,
    togglePlayAyah,
    seekAudioToAyah,
    pauseAudio,
    setRepeatMode,
    downloadSurahAudio,
    audio: engine.audio,
    db: engine.db,
  };
}

/** Convenience re-exports for consumers. */
export type { QuranEngineState, QuranEngineWarmPhase };
