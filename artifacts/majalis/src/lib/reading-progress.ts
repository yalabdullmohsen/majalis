import { readLocalJson, writeLocalJson, isPlainObject } from "@/lib/safe-json";
import { registerUnloadPersist } from "@/lib/unload-persist";
import { enqueueProgress } from "@/lib/progress-batch";

export const READING_PROGRESS_LS_KEY = "majalis-reading-progress-v1";
const STORAGE_KEY = READING_PROGRESS_LS_KEY;

export type ReadingSection = "adhkar" | "qa" | "fawaid" | "hadith" | "rulings" | "stories" | "assistant";

export type ReadingProgressEntry = {
  id: string;
  title?: string;
  at: string;
  scrollY?: number;
};

type ReadingProgressStore = Partial<Record<ReadingSection, ReadingProgressEntry>>;

const SECTIONS: ReadingSection[] = [
  "adhkar",
  "qa",
  "fawaid",
  "hadith",
  "rulings",
  "stories",
  "assistant",
];

/** Pending scroll offsets staged between rAF saves — flushed on unload. */
const pendingScroll = new Map<ReadingSection, number>();
let unloadRegistered = false;

function isEntry(v: unknown): v is ReadingProgressEntry {
  return isPlainObject(v) && typeof v.id === "string";
}

function isStore(v: unknown): v is ReadingProgressStore {
  if (!isPlainObject(v)) return false;
  for (const key of Object.keys(v)) {
    if (!SECTIONS.includes(key as ReadingSection)) continue;
    const entry = (v as Record<string, unknown>)[key];
    if (entry != null && !isEntry(entry)) return false;
  }
  return true;
}

function ensureUnloadRegistration(): void {
  if (unloadRegistered || typeof window === "undefined") return;
  unloadRegistered = true;
  registerUnloadPersist("reading-progress", () => {
    if (pendingScroll.size === 0) {
      const store = readStore();
      return Object.keys(store).length ? { [STORAGE_KEY]: JSON.stringify(store) } : null;
    }
    const store = readStore();
    for (const [section, y] of pendingScroll) {
      const prev = store[section];
      if (!prev) {
        if (y < 80) continue;
        store[section] = {
          id: `scroll-${section}`,
          title: section,
          scrollY: y,
          at: new Date().toISOString(),
        };
      } else {
        store[section] = { ...prev, scrollY: y, at: new Date().toISOString() };
      }
    }
    pendingScroll.clear();
    return { [STORAGE_KEY]: JSON.stringify(store) };
  });
}

function readStore(): ReadingProgressStore {
  if (typeof window === "undefined") return {};
  return readLocalJson<ReadingProgressStore>(STORAGE_KEY, {}, isStore);
}

function writeStore(store: ReadingProgressStore) {
  if (typeof window === "undefined") return;
  writeLocalJson(STORAGE_KEY, store);
}

export function markReadingProgress(section: ReadingSection, entry: Omit<ReadingProgressEntry, "at">) {
  ensureUnloadRegistration();
  const store = readStore();
  const prev = store[section];
  store[section] = {
    ...prev,
    ...entry,
    scrollY: entry.scrollY ?? prev?.scrollY,
    at: new Date().toISOString(),
  };
  if (typeof entry.scrollY === "number") pendingScroll.set(section, entry.scrollY);
  writeStore(store);
}

export function getReadingProgress(section: ReadingSection): ReadingProgressEntry | null {
  return readStore()[section] ?? null;
}

export function getAllReadingProgress(): ReadingProgressStore {
  return readStore();
}

/** يعيد موضع التمرير المحفوظ دون التمرير — للاستخدام من الهوك. */
export function getScrollForSection(section: ReadingSection): number | null {
  const pending = pendingScroll.get(section);
  if (typeof pending === "number" && pending > 0) return pending;
  const y = getReadingProgress(section)?.scrollY;
  return typeof y === "number" && y > 0 ? y : null;
}

/** يستعيد موضع التمرير مباشرة (سلوك قديم متوافق). */
export function restoreScrollForSection(section: ReadingSection) {
  const y = getScrollForSection(section);
  if (y == null || typeof window === "undefined") return;
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: y, behavior: "smooth" });
  });
}

/**
 * يحفظ موضع التمرير للقسم.
 * Part 14: stage offset + enqueue batch flush (no sync LS rewrite every rAF).
 */
export function saveScrollForSection(section: ReadingSection, scrollY?: number) {
  if (typeof window === "undefined") return;
  ensureUnloadRegistration();
  const y = Math.max(0, Math.round(scrollY ?? window.scrollY));
  pendingScroll.set(section, y);
  enqueueProgress({ kind: "scroll-section", section, scrollY: y });
  // Only create first entry eagerly when meaningful; subsequent updates flush via batch/unload
  const entry = getReadingProgress(section);
  if (!entry) {
    if (y < 80) return;
    markReadingProgress(section, {
      id: `scroll-${section}`,
      title: document.title || section,
      scrollY: y,
    });
  }
}
