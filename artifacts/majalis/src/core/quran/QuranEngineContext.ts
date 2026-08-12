/**
 * QuranEngineContext — global reading state + React Provider.
 *
 * State: currentSurah, currentAyah, currentPage, isTajweedEnabled,
 *        isActionBarEnabled, currentReciter.
 * Persists progress + preferences via DatabaseManager.
 */
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getDatabaseManager,
  type DatabaseManager,
  type ReadingProgress,
} from "./DatabaseManager";
import { getReciter, saveReciterId } from "@/lib/quran-audio";
import { getAudioEngine } from "@/core/audio/AudioEngine";

// ─── Types ───────────────────────────────────────────────────────────────────

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

export type QuranEngineState = {
  currentSurah: number;
  currentAyah: number;
  currentPage: number;
  isTajweedEnabled: boolean;
  isActionBarEnabled: boolean;
  currentReciter: string;
  selectedAyah: ActiveVerse | null;
};

export type QuranEngineContextApi = {
  getState(): QuranEngineState;
  subscribe(listener: () => void): () => void;
  setPage(page: number): void;
  setActiveVerse(verse: ActiveVerse, opts?: { persist?: boolean }): void;
  clearActiveVerse(): void;
  selectAyah(verse: ActiveVerse | null): void;
  toggleTajweed(): void;
  toggleActionBar(): void;
  setReciter(reciterId: string): void;
  loadLastReadingProgress(): Promise<ReadingProgress | null>;
  updateReadingProgress(progress: ReadingProgressInput): Promise<ReadingProgress | null>;
  hydratePreferences(): Promise<void>;
  readonly db: DatabaseManager;
};

const DEFAULT_STATE: QuranEngineState = {
  currentSurah: 1,
  currentAyah: 1,
  currentPage: 1,
  isTajweedEnabled: false,
  isActionBarEnabled: true,
  currentReciter: "alafasy",
  selectedAyah: null,
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

// ─── External store (non-React) ──────────────────────────────────────────────

class QuranEngineContextImpl implements QuranEngineContextApi {
  readonly db = getDatabaseManager();
  private state: QuranEngineState = { ...DEFAULT_STATE };
  private listeners = new Set<() => void>();

  getState(): QuranEngineState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const l of this.listeners) {
      try {
        l();
      } catch {
        /* ignore */
      }
    }
  }

  private patch(partial: Partial<QuranEngineState>): void {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  setPage(page: number): void {
    this.patch({ currentPage: clampPage(page) });
  }

  setActiveVerse(verse: ActiveVerse, opts?: { persist?: boolean }): void {
    const surah = clampSurah(verse.surah);
    const ayah = clampAyah(verse.ayah);
    const page = verse.page != null ? clampPage(verse.page) : this.state.currentPage;
    this.patch({
      currentSurah: surah,
      currentAyah: ayah,
      currentPage: page,
      selectedAyah: { surah, ayah, page },
    });
    if (opts?.persist !== false) {
      void this.updateReadingProgress({ surah, ayah, page });
    }
  }

  clearActiveVerse(): void {
    this.patch({ selectedAyah: null });
  }

  selectAyah(verse: ActiveVerse | null): void {
    if (!verse) {
      this.clearActiveVerse();
      return;
    }
    this.setActiveVerse(verse, { persist: true });
  }

  toggleTajweed(): void {
    const next = !this.state.isTajweedEnabled;
    this.patch({ isTajweedEnabled: next });
    void this.db.setSetting("isTajweedEnabled", next);
  }

  toggleActionBar(): void {
    const next = !this.state.isActionBarEnabled;
    this.patch({ isActionBarEnabled: next });
    void this.db.setSetting("isActionBarEnabled", next);
  }

  setReciter(reciterId: string): void {
    const id = getReciter(reciterId.trim() || "alafasy").id;
    this.patch({ currentReciter: id });
    void this.db.setSetting("preferredReciterId", id);
    saveReciterId(id);
    try {
      getAudioEngine().setReciter(id);
    } catch {
      /* Audio unavailable (SSR / tests without Audio) */
    }
  }

  async hydratePreferences(): Promise<void> {
    try {
      await this.db.initialize();
      const [tajweed, actionBar, reciter] = await Promise.all([
        this.db.getSetting<boolean>("isTajweedEnabled"),
        this.db.getSetting<boolean>("isActionBarEnabled"),
        this.db.getSetting<string>("preferredReciterId"),
      ]);
      this.patch({
        isTajweedEnabled: tajweed ?? false,
        isActionBarEnabled: actionBar ?? true,
        currentReciter: getReciter(reciter || "alafasy").id,
      });
      try {
        getAudioEngine().setReciter(getReciter(reciter || "alafasy").id);
      } catch {
        /* ignore */
      }    } catch (err) {
      console.warn("[QuranEngineContext] hydratePreferences:", err);
    }
  }

  async loadLastReadingProgress(): Promise<ReadingProgress | null> {
    try {
      await this.db.initialize();
      const row = await this.db.getReadingProgress();
      if (row) {
        this.patch({
          currentSurah: row.lastSurah,
          currentAyah: row.lastAyah,
          currentPage: row.lastPage,
        });
      }
      return row;
    } catch (err) {
      console.warn("[QuranEngineContext] loadLastReadingProgress:", err);
      return null;
    }
  }

  async updateReadingProgress(progress: ReadingProgressInput): Promise<ReadingProgress | null> {
    try {
      const surah = clampSurah(progress.surah);
      const ayah = clampAyah(progress.ayah);
      const page = progress.page != null ? clampPage(progress.page) : this.state.currentPage;
      this.patch({ currentSurah: surah, currentAyah: ayah, currentPage: page });
      return await this.db.saveProgress({
        lastSurah: surah,
        lastAyah: ayah,
        lastPage: page,
      });
    } catch (err) {
      console.warn("[QuranEngineContext] updateReadingProgress:", err);
      return null;
    }
  }
}

let ctxSingleton: QuranEngineContextImpl | null = null;

export function getQuranEngineContext(): QuranEngineContextApi {
  if (!ctxSingleton) ctxSingleton = new QuranEngineContextImpl();
  return ctxSingleton;
}

/** Test helper */
export function __resetQuranEngineContextForTests(): void {
  ctxSingleton = null;
}

// ─── React Context Provider ──────────────────────────────────────────────────

export type QuranEngineReactValue = QuranEngineState & {
  hydrating: boolean;
  setPage: (page: number) => void;
  setActiveVerse: (verse: ActiveVerse, opts?: { persist?: boolean }) => void;
  clearActiveVerse: () => void;
  selectAyah: (verse: ActiveVerse | null) => void;
  toggleTajweed: () => void;
  toggleActionBar: () => void;
  setReciter: (reciterId: string) => void;
  updateReadingProgress: (progress: ReadingProgressInput) => Promise<ReadingProgress | null>;
  loadLastReadingProgress: () => Promise<ReadingProgress | null>;
  db: DatabaseManager;
};

const QuranEngineReactContext = createContext<QuranEngineReactValue | null>(null);

function useEngineStore(): QuranEngineState {
  const engine = getQuranEngineContext();
  return useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.getState(),
    () => engine.getState(),
  );
}

export function QuranEngineProvider({ children }: { children: ReactNode }) {
  const engine = getQuranEngineContext();
  const state = useEngineStore();
  const [hydrating, setHydrating] = useState(true);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    let cancelled = false;
    void (async () => {
      try {
        await Promise.all([
          engine.hydratePreferences(),
          engine.loadLastReadingProgress(),
        ]);
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [engine]);

  const value = useMemo<QuranEngineReactValue>(
    () => ({
      ...state,
      hydrating,
      setPage: (page) => engine.setPage(page),
      setActiveVerse: (verse, opts) => engine.setActiveVerse(verse, opts),
      clearActiveVerse: () => engine.clearActiveVerse(),
      selectAyah: (verse) => engine.selectAyah(verse),
      toggleTajweed: () => engine.toggleTajweed(),
      toggleActionBar: () => engine.toggleActionBar(),
      setReciter: (id) => engine.setReciter(id),
      updateReadingProgress: (p) => engine.updateReadingProgress(p),
      loadLastReadingProgress: () => engine.loadLastReadingProgress(),
      db: engine.db,
    }),
    [engine, state, hydrating],
  );

  return createElement(QuranEngineReactContext.Provider, { value }, children);
}

export function useQuranEngineContext(): QuranEngineReactValue {
  const value = useContext(QuranEngineReactContext);
  if (!value) {
    throw new Error("useQuranEngineContext must be used within <QuranEngineProvider>");
  }
  return value;
}

/** Safe variant — returns null outside provider (for optional chrome). */
export function useQuranEngineContextOptional(): QuranEngineReactValue | null {
  return useContext(QuranEngineReactContext);
}
