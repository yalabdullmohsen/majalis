/**
 * quran-personal.ts
 * تخزين بيانات المستخدم الشخصية للمصحف — إشارات مرجعية، ملاحظات، تقدم، ختمة، سلاسل.
 * كل البيانات تُخزَّن محلياً في localStorage فقط (لا ترسل لأي سيرفر).
 */

import { deleteUserNote, getUserNote, getUserNotes, makeVerseId, parseVerseId, saveNote as saveUserNoteByVerseId } from "@/lib/quran-user-notes";

// ── Bookmarks ────────────────────────────────────────────────────────────────

export type QuranBookmark = {
  surahNum: number;
  ayahNum: number;
  surahName: string;
  text: string;
  list: string;        // اسم القائمة (افتراضي: "المفضلة")
  addedAt: number;
};

const BK_KEY = "mj-quran-bookmarks-v1";

function readBookmarks(): QuranBookmark[] {
  try { return JSON.parse(localStorage.getItem(BK_KEY) || "[]"); } catch { return []; }
}
function writeBookmarks(list: QuranBookmark[]) {
  try { localStorage.setItem(BK_KEY, JSON.stringify(list)); } catch { /* quota */ }
}

export function getBookmarks(listName?: string): QuranBookmark[] {
  const all = readBookmarks();
  return listName ? all.filter((b) => b.list === listName) : all;
}

export function getBookmarkLists(): string[] {
  return [...new Set(readBookmarks().map((b) => b.list))];
}

export function isBookmarked(surahNum: number, ayahNum: number): boolean {
  return readBookmarks().some((b) => b.surahNum === surahNum && b.ayahNum === ayahNum);
}

export function addBookmark(bk: Omit<QuranBookmark, "addedAt" | "list">, list = "المفضلة") {
  const all = readBookmarks().filter((b) => !(b.surahNum === bk.surahNum && b.ayahNum === bk.ayahNum));
  writeBookmarks([{ ...bk, list, addedAt: Date.now() }, ...all]);
}

export function removeBookmark(surahNum: number, ayahNum: number) {
  writeBookmarks(readBookmarks().filter((b) => !(b.surahNum === surahNum && b.ayahNum === ayahNum)));
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export type QuranNote = {
  surahNum: number;
  ayahNum: number;
  text: string;
  updatedAt: number;
};

const NOTE_KEY = "mj-quran-notes-v1";

function readNotes(): QuranNote[] {
  try { return JSON.parse(localStorage.getItem(NOTE_KEY) || "[]"); } catch { return []; }
}

export function getNote(surahNum: number, ayahNum: number): string {
  const fromList = readNotes().find((n) => n.surahNum === surahNum && n.ayahNum === ayahNum)?.text ?? "";
  if (fromList) return fromList;
  // Fallback: RN `userNotes` map (`surah:ayah`)
  return getUserNote(makeVerseId(surahNum, ayahNum));
}

export function saveNote(surahNum: number, ayahNum: number, text: string) {
  const trimmed = text.trim();
  const all = readNotes().filter((n) => !(n.surahNum === surahNum && n.ayahNum === ayahNum));
  if (trimmed) all.unshift({ surahNum, ayahNum, text: trimmed, updatedAt: Date.now() });
  try { localStorage.setItem(NOTE_KEY, JSON.stringify(all)); } catch { /* quota */ }

  // Dual-write RN sketch key `userNotes` so both stores stay in sync.
  const verseId = makeVerseId(surahNum, ayahNum);
  if (trimmed) {
    void saveUserNoteByVerseId(verseId, trimmed);
  } else {
    void deleteUserNote(verseId);
  }
}

export function getAllNotes(): QuranNote[] {
  const list = readNotes();
  const seen = new Set(list.map((n) => makeVerseId(n.surahNum, n.ayahNum)));
  const extras: QuranNote[] = [];
  for (const [id, text] of Object.entries(getUserNotes())) {
    const trimmed = text.trim();
    if (!trimmed || seen.has(id)) continue;
    const parsed = parseVerseId(id);
    if (!parsed) continue;
    extras.push({ surahNum: parsed.surahNum, ayahNum: parsed.ayahNum, text: trimmed, updatedAt: 0 });
  }
  return extras.length ? [...list, ...extras] : list;
}

// ── Hifz Progress ────────────────────────────────────────────────────────────

export type HifzSurahStatus = "not_started" | "memorizing" | "memorized" | "reviewing";

export type HifzSurahProgress = {
  surahNum: number;
  status: HifzSurahStatus;
  memorizedAyahs: number;   // عدد الآيات المحفوظة
  totalAyahs: number;
  lastReviewedAt?: number;
  nextReviewAt?: number;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
};

const HIFZ_KEY = "mj-quran-hifz-v1";

function readHifz(): HifzSurahProgress[] {
  try { return JSON.parse(localStorage.getItem(HIFZ_KEY) || "[]"); } catch { return []; }
}

export function getHifzProgress(): HifzSurahProgress[] {
  return readHifz();
}

export function getHifzSurah(surahNum: number): HifzSurahProgress | null {
  return readHifz().find((h) => h.surahNum === surahNum) ?? null;
}

export function saveHifzSurah(p: HifzSurahProgress) {
  const all = readHifz().filter((h) => h.surahNum !== p.surahNum);
  try { localStorage.setItem(HIFZ_KEY, JSON.stringify([p, ...all])); } catch { /* quota */ }
}

export function getDueForReview(): HifzSurahProgress[] {
  const now = Date.now();
  return readHifz().filter(
    (h) => h.status === "reviewing" && h.nextReviewAt && h.nextReviewAt <= now,
  );
}

// ── Reading Progress & Khatmah ────────────────────────────────────────────────

export type KhatmahPlan = {
  id: string;
  name: string;
  targetDays: number;
  startedAt: number;
  targetEndAt: number;
  totalPagesRead: number;
  completedAt?: number;
};

export type DailyReadingEntry = {
  date: string;          // YYYY-MM-DD
  pagesRead: number;
  ayahsRead: number;
  minutesRead: number;
};

const KHATMAH_KEY = "mj-quran-khatmah-v1";
const READING_KEY = "mj-quran-reading-v1";
const STREAK_KEY  = "mj-quran-streak-v1";

export function getKhatmahPlans(): KhatmahPlan[] {
  try { return JSON.parse(localStorage.getItem(KHATMAH_KEY) || "[]"); } catch { return []; }
}

export function createKhatmahPlan(name: string, targetDays: number): KhatmahPlan {
  const plan: KhatmahPlan = {
    id: crypto.randomUUID(),
    name,
    targetDays,
    startedAt: Date.now(),
    targetEndAt: Date.now() + targetDays * 86400000,
    totalPagesRead: 0,
  };
  const all = getKhatmahPlans();
  try { localStorage.setItem(KHATMAH_KEY, JSON.stringify([plan, ...all])); } catch { /* quota */ }
  return plan;
}

export function updateKhatmahPages(planId: string, pages: number) {
  const all = getKhatmahPlans().map((p) =>
    p.id === planId ? { ...p, totalPagesRead: pages, completedAt: pages >= 604 ? Date.now() : undefined } : p,
  );
  try { localStorage.setItem(KHATMAH_KEY, JSON.stringify(all)); } catch { /* quota */ }
}

// سجل القراءة اليومي
export function getDailyReading(): DailyReadingEntry[] {
  try { return JSON.parse(localStorage.getItem(READING_KEY) || "[]"); } catch { return []; }
}

export function recordDailyReading(ayahsRead: number, pagesRead = 0, minutesRead = 0) {
  const today = new Date().toISOString().slice(0, 10);
  const snap = getDailyReading();
  const all = snap.map((e) => ({ ...e }));
  const idx = all.findIndex((e) => e.date === today);
  if (idx >= 0) {
    all[idx] = {
      date: today,
      ayahsRead: all[idx].ayahsRead + ayahsRead,
      pagesRead: all[idx].pagesRead + pagesRead,
      minutesRead: all[idx].minutesRead + minutesRead,
    };
  } else {
    all.unshift({ date: today, ayahsRead, pagesRead, minutesRead });
  }
  try {
    localStorage.setItem(READING_KEY, JSON.stringify(all.slice(0, 365)));
  } catch {
    // Part 22: quota failure → leave previous counters intact (no partial write)
    try {
      localStorage.setItem(READING_KEY, JSON.stringify(snap));
    } catch {
      /* ignore */
    }
  }
}

/**
 * Part 22: push reading progress via adaptive transport fallback
 * (WebTransport → WebSocket → HTTP Fetch) without blocking the UI.
 */
export async function syncDailyReadingRemote(): Promise<boolean> {
  // Remote persist requires reading_sync_events (+ VITE_READING_SYNC=1). Local streak stays authoritative.
  try {
    if (import.meta.env.VITE_READING_SYNC !== "1") return false;
    const entries = getDailyReading().slice(0, 7);
    const { syncWithTransportFallback } = await import("@/lib/adaptive-transport");
    const result = await syncWithTransportFallback(
      { type: "daily-reading", entries, at: Date.now() },
      {
        httpUrl: "/api/reading-sync",
        prefer: ["webtransport", "websocket", "fetch"],
        probeTimeoutMs: 3_000,
      },
    );
    return result.ok;
  } catch {
    return false;
  }
}

// سلسلة الأيام المتتالية
type StreakData = { current: number; longest: number; lastDate: string };

export function getStreak(): StreakData {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || "{}") as StreakData;
  } catch {
    return { current: 0, longest: 0, lastDate: "" };
  }
}

export function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const streak = getStreak();
  if (streak.lastDate === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yd = yesterday.toISOString().slice(0, 10);

  const current = streak.lastDate === yd ? streak.current + 1 : 1;
  const longest = Math.max(streak.longest, current);
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify({ current, longest, lastDate: today }));
  } catch { /* quota */ }
}
