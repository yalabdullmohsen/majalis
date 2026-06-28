/**
 * Mushaf (604-page Madani/Kuwait layout) — page fetch, index, bookmarks.
 */

import { getSurahList } from "@/lib/quran-content";

export const MUSHAF_TOTAL_PAGES = 604;
export const MUSHAF_EDITION = "quran-uthmani";
export const MUSHAF_LABEL = "طبعة دولة الكويت — 604 صفحة";

const STORAGE_LAST_PAGE = "majalis-mushaf-last-page";
const STORAGE_BOOKMARKS = "majalis-mushaf-bookmarks-v1";
const STORAGE_ZOOM = "majalis-mushaf-zoom";
const pageCache = new Map<number, MushafPageData>();

export type MushafAyah = {
  number: number;
  text: string;
  numberInSurah: number;
  surahNumber: number;
  surahName: string;
  juz: number;
  hizbQuarter: number;
  page: number;
  sajda: boolean;
};

export type MushafPageData = {
  number: number;
  ayahs: MushafAyah[];
};

export type MushafBookmark = {
  page: number;
  label: string;
  createdAt: string;
};

/** Juz start pages (standard 604-page mushaf) */
export const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
] as const;

/** Surah start pages (604-page mushaf) */
export const SURAH_START_PAGES: Record<number, number> = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
  11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282, 18: 293, 19: 305, 20: 312,
  21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 385, 29: 396,
  30: 404, 31: 411, 32: 415, 33: 418, 34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458,
  40: 467, 41: 477, 42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515,
  50: 518, 51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537, 58: 542, 59: 545,
  60: 549, 61: 551, 62: 553, 63: 554, 64: 556, 65: 558, 66: 560, 67: 562, 68: 564, 69: 566,
  70: 568, 71: 570, 72: 572, 73: 574, 74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583,
  80: 585, 81: 586, 82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593,
  90: 594, 91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598, 98: 598, 99: 599,
  100: 599, 101: 600, 102: 600, 103: 601, 104: 601, 105: 602, 106: 602, 107: 603, 108: 603,
  109: 604, 110: 604, 111: 604, 112: 604, 113: 604, 114: 604,
};

export function getJuzList() {
  return JUZ_START_PAGES.map((page, i) => ({
    number: i + 1,
    startPage: page,
    label: `الجزء ${i + 1}`,
  }));
}

export function getHizbList() {
  const out: { number: number; juz: number; quarter: number; startPage: number; label: string }[] = [];
  for (let j = 0; j < JUZ_START_PAGES.length; j++) {
    const juzStart = JUZ_START_PAGES[j];
    const juzEnd = j < JUZ_START_PAGES.length - 1 ? JUZ_START_PAGES[j + 1] - 1 : MUSHAF_TOTAL_PAGES;
    const juzPages = juzEnd - juzStart + 1;
    const quarterSize = Math.floor(juzPages / 4);
    for (let q = 0; q < 4; q++) {
      const hizbNum = j * 2 + (q < 2 ? 1 : 2);
      const startPage = Math.min(juzStart + q * quarterSize, MUSHAF_TOTAL_PAGES);
      out.push({
        number: hizbNum,
        juz: j + 1,
        quarter: q + 1,
        startPage,
        label: `الحزب ${hizbNum} — ربع ${q + 1}`,
      });
    }
  }
  return out;
}

export function getQuarterList() {
  const out: { number: number; juz: number; startPage: number; label: string }[] = [];
  for (let q = 1; q <= 240; q++) {
    const juz = Math.ceil(q / 8);
    const juzStart = JUZ_START_PAGES[juz - 1] ?? 1;
    const juzEnd = juz < JUZ_START_PAGES.length ? JUZ_START_PAGES[juz] - 1 : MUSHAF_TOTAL_PAGES;
    const quarterInJuz = ((q - 1) % 8) + 1;
    const pageOffset = Math.floor(((juzEnd - juzStart + 1) / 8) * (quarterInJuz - 1));
    out.push({
      number: q,
      juz,
      startPage: Math.min(juzStart + pageOffset, MUSHAF_TOTAL_PAGES),
      label: `الربع ${q}`,
    });
  }
  return out;
}

export function getSurahIndex() {
  return getSurahList().map((s) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    startPage: SURAH_START_PAGES[s.number] ?? 1,
    ayahs: s.ayahs,
  }));
}

export function searchSurahs(query: string) {
  const q = query.trim();
  if (!q) return getSurahIndex();
  return getSurahIndex().filter(
    (s) => s.name.includes(q) || s.englishName.toLowerCase().includes(q.toLowerCase()) || String(s.number) === q,
  );
}

export async function fetchMushafPage(pageNumber: number): Promise<MushafPageData> {
  const page = Math.max(1, Math.min(MUSHAF_TOTAL_PAGES, Math.round(pageNumber)));
  const cached = pageCache.get(page);
  if (cached) return cached;

  const response = await fetch(`https://api.alquran.cloud/v1/page/${page}/${MUSHAF_EDITION}`);
  if (!response.ok) throw new Error(`تعذّر تحميل الصفحة ${page}`);
  const json = await response.json();
  const ayahs: MushafAyah[] = (json.data?.ayahs ?? []).map((a: {
    number: number;
    text: string;
    numberInSurah: number;
    surah: { number: number; name: string };
    juz: number;
    hizbQuarter: number;
    page: number;
    sajda: boolean;
  }) => ({
    number: a.number,
    text: a.text.replace(/^\uFEFF/, ""),
    numberInSurah: a.numberInSurah,
    surahNumber: a.surah.number,
    surahName: a.surah.name,
    juz: a.juz,
    hizbQuarter: a.hizbQuarter,
    page: a.page,
    sajda: a.sajda,
  }));

  const data: MushafPageData = { number: page, ayahs };
  pageCache.set(page, data);
  if (pageCache.size > 30) {
    const first = pageCache.keys().next().value;
    if (first !== undefined) pageCache.delete(first);
  }
  return data;
}

export function prefetchMushafPage(pageNumber: number) {
  const page = Math.max(1, Math.min(MUSHAF_TOTAL_PAGES, pageNumber));
  if (!pageCache.has(page)) {
    void fetchMushafPage(page).catch(() => {});
  }
}

export function readLastMushafPage(): number {
  if (typeof window === "undefined") return 1;
  try {
    const n = Number(localStorage.getItem(STORAGE_LAST_PAGE));
    return n >= 1 && n <= MUSHAF_TOTAL_PAGES ? n : 1;
  } catch {
    return 1;
  }
}

export function writeLastMushafPage(page: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_LAST_PAGE, String(Math.max(1, Math.min(MUSHAF_TOTAL_PAGES, page))));
}

export function readMushafBookmarks(): MushafBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_BOOKMARKS);
    return raw ? (JSON.parse(raw) as MushafBookmark[]) : [];
  } catch {
    return [];
  }
}

export function writeMushafBookmarks(bookmarks: MushafBookmark[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_BOOKMARKS, JSON.stringify(bookmarks));
}

export function toggleMushafBookmark(page: number, label?: string): MushafBookmark[] {
  const existing = readMushafBookmarks();
  const idx = existing.findIndex((b) => b.page === page);
  if (idx >= 0) {
    existing.splice(idx, 1);
  } else {
    existing.unshift({
      page,
      label: label || `صفحة ${page}`,
      createdAt: new Date().toISOString(),
    });
  }
  writeMushafBookmarks(existing);
  return existing;
}

export function readMushafZoom(): number {
  if (typeof window === "undefined") return 100;
  try {
    const n = Number(localStorage.getItem(STORAGE_ZOOM));
    return n >= 80 && n <= 160 ? n : 100;
  } catch {
    return 100;
  }
}

export function writeMushafZoom(zoom: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_ZOOM, String(Math.max(80, Math.min(160, zoom))));
}

export function clampPage(n: number) {
  return Math.max(1, Math.min(MUSHAF_TOTAL_PAGES, Math.round(n)));
}
