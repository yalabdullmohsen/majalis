const STORAGE_KEY = "majalis-reading-progress-v1";

export type ReadingSection = "adhkar" | "qa" | "fawaid" | "hadith" | "rulings" | "stories" | "assistant";

export type ReadingProgressEntry = {
  id: string;
  title?: string;
  at: string;
  scrollY?: number;
};

type ReadingProgressStore = Partial<Record<ReadingSection, ReadingProgressEntry>>;

function readStore(): ReadingProgressStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as ReadingProgressStore;
  } catch {
    return {};
  }
}

function writeStore(store: ReadingProgressStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function markReadingProgress(section: ReadingSection, entry: Omit<ReadingProgressEntry, "at">) {
  const store = readStore();
  store[section] = { ...entry, at: new Date().toISOString() };
  writeStore(store);
}

export function getReadingProgress(section: ReadingSection): ReadingProgressEntry | null {
  return readStore()[section] ?? null;
}

export function getAllReadingProgress(): ReadingProgressStore {
  return readStore();
}

export function restoreScrollForSection(section: ReadingSection) {
  const entry = getReadingProgress(section);
  if (!entry?.scrollY || typeof window === "undefined") return;
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: entry.scrollY, behavior: "smooth" });
  });
}

export function saveScrollForSection(section: ReadingSection) {
  const entry = getReadingProgress(section);
  if (!entry || typeof window === "undefined") return;
  markReadingProgress(section, { ...entry, scrollY: window.scrollY });
}
