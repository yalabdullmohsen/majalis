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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode */
  }
}

export function markReadingProgress(section: ReadingSection, entry: Omit<ReadingProgressEntry, "at">) {
  const store = readStore();
  const prev = store[section];
  store[section] = {
    ...prev,
    ...entry,
    scrollY: entry.scrollY ?? prev?.scrollY,
    at: new Date().toISOString(),
  };
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
 * إن لم يوجد سجل بعد وكانت الإزاحة معتبرة، يُنشأ سجل خفيف بعنوان الصفحة.
 */
export function saveScrollForSection(section: ReadingSection, scrollY?: number) {
  if (typeof window === "undefined") return;
  const y = Math.max(0, Math.round(scrollY ?? window.scrollY));
  const entry = getReadingProgress(section);
  if (!entry) {
    if (y < 80) return;
    markReadingProgress(section, {
      id: `scroll-${section}`,
      title: document.title || section,
      scrollY: y,
    });
    return;
  }
  markReadingProgress(section, { ...entry, scrollY: y });
}
