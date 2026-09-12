/**
 * QuranKhatmaRepository — ختمات وورد يومي (P2 خلف Feature Flag).
 * تخزين محلي فقط؛ بلا gamification مزعج وبلا فضل شرعي بلا مصدر.
 */

import { clampMushafPage, MUSHAF_PAGE_MAX, MUSHAF_PAGE_MIN } from "@/lib/quran-last-page";
import { QURAN_EXPERIENCE_NEXT } from "./flags";

const STORAGE_KEY = "ssunnah-quran-khatma-v1";

export type KhatmaRecord = {
  id: string;
  title: string;
  startedAt: string;
  dailyPagesTarget: number;
  lastPage: number;
  archived: boolean;
};

export type DailyWirdRecord = {
  mode: "pages" | "juz-quarter";
  pagesTarget: number;
  completedToday: boolean;
  dayKey: string;
  lastPage: number;
};

type Store = {
  khatmas: KhatmaRecord[];
  wird: DailyWirdRecord | null;
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptyStore(): Store {
  return { khatmas: [], wird: null };
}

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || !Array.isArray(parsed.khatmas)) return emptyStore();
    return {
      khatmas: parsed.khatmas,
      wird: parsed.wird ?? null,
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function assertEnabled(): void {
  if (!QURAN_EXPERIENCE_NEXT.khatmaWird) {
    throw new Error("QuranKhatmaRepository: feature flag khatmaWird is off");
  }
}

export const QuranKhatmaRepository = {
  isEnabled(): boolean {
    return QURAN_EXPERIENCE_NEXT.khatmaWird;
  },

  listKhatmas(): KhatmaRecord[] {
    if (!this.isEnabled()) return [];
    return readStore().khatmas.filter((k) => !k.archived);
  },

  createKhatma(input: {
    title?: string;
    dailyPagesTarget?: number;
    startPage?: number;
  }): KhatmaRecord | null {
    assertEnabled();
    const store = readStore();
    const record: KhatmaRecord = {
      id: `khatma-${Date.now()}`,
      title: (input.title ?? "ختمة").trim() || "ختمة",
      startedAt: new Date().toISOString(),
      dailyPagesTarget: Math.max(1, Math.min(60, input.dailyPagesTarget ?? 4)),
      lastPage: clampMushafPage(input.startPage ?? MUSHAF_PAGE_MIN),
      archived: false,
    };
    store.khatmas.push(record);
    writeStore(store);
    return record;
  },

  updateProgress(id: string, page: number): void {
    if (!this.isEnabled()) return;
    const store = readStore();
    const row = store.khatmas.find((k) => k.id === id);
    if (!row || row.archived) return;
    row.lastPage = clampMushafPage(page);
    writeStore(store);
  },

  archiveKhatma(id: string): void {
    if (!this.isEnabled()) return;
    const store = readStore();
    const row = store.khatmas.find((k) => k.id === id);
    if (!row) return;
    row.archived = true;
    writeStore(store);
  },

  pagesRemaining(khatma: KhatmaRecord): number {
    return Math.max(0, MUSHAF_PAGE_MAX - khatma.lastPage);
  },

  getWird(): DailyWirdRecord | null {
    if (!this.isEnabled()) return null;
    const store = readStore();
    if (!store.wird) return null;
    if (store.wird.dayKey !== todayKey()) {
      return {
        ...store.wird,
        completedToday: false,
        dayKey: todayKey(),
      };
    }
    return store.wird;
  },

  setWird(pagesTarget: number, lastPage: number): DailyWirdRecord {
    assertEnabled();
    const store = readStore();
    const wird: DailyWirdRecord = {
      mode: "pages",
      pagesTarget: Math.max(1, Math.min(40, pagesTarget)),
      completedToday: false,
      dayKey: todayKey(),
      lastPage: clampMushafPage(lastPage),
    };
    store.wird = wird;
    writeStore(store);
    return wird;
  },

  markWirdDone(): void {
    if (!this.isEnabled()) return;
    const store = readStore();
    if (!store.wird) return;
    store.wird = {
      ...store.wird,
      completedToday: true,
      dayKey: todayKey(),
    };
    writeStore(store);
  },
} as const;
