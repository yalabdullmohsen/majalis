const KEY = "majalis-library-reading-v1";

export type LibraryReadingPosition = {
  bookSlug: string;
  chapterId: string;
  scrollRatio: number;
  at?: number;
};

export type TajweedProgress = {
  completedLessonIds: string[];
  lastLessonId: string;
  at: number;
};

const TAJWEED_KEY = "majalis-tajweed-progress-v1";

export function readLibraryPosition(bookSlug: string): LibraryReadingPosition | null {
  if (typeof window === "undefined") return null;
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, LibraryReadingPosition>;
    return all[bookSlug] || null;
  } catch {
    return null;
  }
}

export function writeLibraryPosition(pos: LibraryReadingPosition) {
  if (typeof window === "undefined") return;
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, LibraryReadingPosition>;
    all[pos.bookSlug] = { ...pos, at: pos.at ?? Date.now() };
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent("majalis-library-reading-updated"));
  } catch {
    /* ignore */
  }
}

export function readTajweedProgress(): TajweedProgress {
  if (typeof window === "undefined") {
    return { completedLessonIds: [], lastLessonId: "", at: 0 };
  }
  try {
    const raw = JSON.parse(localStorage.getItem(TAJWEED_KEY) || "null");
    if (!raw) return { completedLessonIds: [], lastLessonId: "", at: 0 };
    return raw;
  } catch {
    return { completedLessonIds: [], lastLessonId: "", at: 0 };
  }
}

export function writeTajweedProgress(progress: TajweedProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TAJWEED_KEY, JSON.stringify({ ...progress, at: Date.now() }));
  window.dispatchEvent(new CustomEvent("majalis-tajweed-progress-updated"));
}

export function markTajweedLessonComplete(lessonId: string) {
  const p = readTajweedProgress();
  const completed = p.completedLessonIds.includes(lessonId)
    ? p.completedLessonIds
    : [...p.completedLessonIds, lessonId];
  writeTajweedProgress({ ...p, completedLessonIds: completed, lastLessonId: lessonId });
}
