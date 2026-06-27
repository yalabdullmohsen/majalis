import { getSurahList, getSurahMeta, type SurahMeta } from "@/lib/quran-content";

/** Standard mushaf juz starting points (surah:ayah). */
export const JUZ_STARTS: { juz: number; surah: number; ayah: number; label: string }[] = [
  { juz: 1, surah: 1, ayah: 1, label: "الجزء الأول" },
  { juz: 2, surah: 2, ayah: 142, label: "الجزء الثاني" },
  { juz: 3, surah: 2, ayah: 253, label: "الجزء الثالث" },
  { juz: 4, surah: 3, ayah: 93, label: "الجزء الرابع" },
  { juz: 5, surah: 4, ayah: 24, label: "الجزء الخامس" },
  { juz: 6, surah: 4, ayah: 148, label: "الجزء السادس" },
  { juz: 7, surah: 5, ayah: 82, label: "الجزء السابع" },
  { juz: 8, surah: 6, ayah: 111, label: "الجزء الثامن" },
  { juz: 9, surah: 7, ayah: 88, label: "الجزء التاسع" },
  { juz: 10, surah: 8, ayah: 41, label: "الجزء العاشر" },
  { juz: 11, surah: 9, ayah: 93, label: "الجزء الحادي عشر" },
  { juz: 12, surah: 11, ayah: 6, label: "الجزء الثاني عشر" },
  { juz: 13, surah: 12, ayah: 53, label: "الجزء الثالث عشر" },
  { juz: 14, surah: 15, ayah: 1, label: "الجزء الرابع عشر" },
  { juz: 15, surah: 17, ayah: 1, label: "الجزء الخامس عشر" },
  { juz: 16, surah: 18, ayah: 75, label: "الجزء السادس عشر" },
  { juz: 17, surah: 21, ayah: 1, label: "الجزء السابع عشر" },
  { juz: 18, surah: 23, ayah: 1, label: "الجزء الثامن عشر" },
  { juz: 19, surah: 25, ayah: 21, label: "الجزء التاسع عشر" },
  { juz: 20, surah: 27, ayah: 56, label: "الجزء العشرون" },
  { juz: 21, surah: 29, ayah: 46, label: "الجزء الحادي والعشرون" },
  { juz: 22, surah: 33, ayah: 31, label: "الجزء الثاني والعشرون" },
  { juz: 23, surah: 36, ayah: 28, label: "الجزء الثالث والعشرون" },
  { juz: 24, surah: 39, ayah: 32, label: "الجزء الرابع والعشرون" },
  { juz: 25, surah: 41, ayah: 47, label: "الجزء الخامس والعشرون" },
  { juz: 26, surah: 46, ayah: 1, label: "الجزء السادس والعشرون" },
  { juz: 27, surah: 51, ayah: 31, label: "الجزء السابع والعشرون" },
  { juz: 28, surah: 58, ayah: 1, label: "الجزء الثامن والعشرون" },
  { juz: 29, surah: 67, ayah: 1, label: "الجزء التاسع والعشرون" },
  { juz: 30, surah: 78, ayah: 1, label: "الجزء الثلاثون" },
];

/** 60 hizb starting points (2 per juz). */
export const HIZB_STARTS: { hizb: number; surah: number; ayah: number }[] = [
  { hizb: 1, surah: 1, ayah: 1 }, { hizb: 2, surah: 2, ayah: 26 },
  { hizb: 3, surah: 2, ayah: 44 }, { hizb: 4, surah: 2, ayah: 60 },
  { hizb: 5, surah: 2, ayah: 75 }, { hizb: 6, surah: 2, ayah: 92 },
  { hizb: 7, surah: 2, ayah: 106 }, { hizb: 8, surah: 2, ayah: 124 },
  { hizb: 9, surah: 2, ayah: 142 }, { hizb: 10, surah: 2, ayah: 158 },
  { hizb: 11, surah: 2, ayah: 177 }, { hizb: 12, surah: 2, ayah: 189 },
  { hizb: 13, surah: 2, ayah: 203 }, { hizb: 14, surah: 2, ayah: 219 },
  { hizb: 15, surah: 2, ayah: 233 }, { hizb: 16, surah: 2, ayah: 243 },
  { hizb: 17, surah: 2, ayah: 253 }, { hizb: 18, surah: 2, ayah: 263 },
  { hizb: 19, surah: 2, ayah: 272 }, { hizb: 20, surah: 2, ayah: 283 },
  { hizb: 21, surah: 3, ayah: 15 }, { hizb: 22, surah: 3, ayah: 33 },
  { hizb: 23, surah: 3, ayah: 52 }, { hizb: 24, surah: 3, ayah: 75 },
  { hizb: 25, surah: 3, ayah: 93 }, { hizb: 26, surah: 3, ayah: 113 },
  { hizb: 27, surah: 3, ayah: 133 }, { hizb: 28, surah: 3, ayah: 153 },
  { hizb: 29, surah: 3, ayah: 171 }, { hizb: 30, surah: 3, ayah: 186 },
  { hizb: 31, surah: 4, ayah: 1 }, { hizb: 32, surah: 4, ayah: 12 },
  { hizb: 33, surah: 4, ayah: 24 }, { hizb: 34, surah: 4, ayah: 36 },
  { hizb: 35, surah: 4, ayah: 58 }, { hizb: 36, surah: 4, ayah: 74 },
  { hizb: 37, surah: 4, ayah: 88 }, { hizb: 38, surah: 4, ayah: 100 },
  { hizb: 39, surah: 4, ayah: 114 }, { hizb: 40, surah: 4, ayah: 135 },
  { hizb: 41, surah: 4, ayah: 148 }, { hizb: 42, surah: 4, ayah: 163 },
  { hizb: 43, surah: 5, ayah: 1 }, { hizb: 44, surah: 5, ayah: 12 },
  { hizb: 45, surah: 5, ayah: 27 }, { hizb: 46, surah: 5, ayah: 41 },
  { hizb: 47, surah: 5, ayah: 51 }, { hizb: 48, surah: 5, ayah: 67 },
  { hizb: 49, surah: 5, ayah: 82 }, { hizb: 50, surah: 5, ayah: 97 },
  { hizb: 51, surah: 6, ayah: 13 }, { hizb: 52, surah: 6, ayah: 36 },
  { hizb: 53, surah: 6, ayah: 59 }, { hizb: 54, surah: 6, ayah: 74 },
  { hizb: 55, surah: 6, ayah: 95 }, { hizb: 56, surah: 6, ayah: 111 },
  { hizb: 57, surah: 6, ayah: 127 }, { hizb: 58, surah: 6, ayah: 141 },
  { hizb: 59, surah: 6, ayah: 151 }, { hizb: 60, surah: 6, ayah: 165 },
];

/** 240 rub al-hizb (quarter-hizb) — sample every 15 for navigation grid; full list generated. */
export function getHizbQuarters(): { quarter: number; hizb: number; rub: number; surah: number; ayah: number }[] {
  const quarters: { quarter: number; hizb: number; rub: number; surah: number; ayah: number }[] = [];
  for (let i = 0; i < 240; i++) {
    const hizb = Math.floor(i / 4) + 1;
    const rub = (i % 4) + 1;
    const start = HIZB_STARTS[Math.min(hizb - 1, HIZB_STARTS.length - 1)];
    quarters.push({ quarter: i + 1, hizb, rub, surah: start.surah, ayah: start.ayah + (rub - 1) });
  }
  return quarters;
}

export type SurahCardInfo = SurahMeta & {
  juz: number;
  hizb: number;
  readMinutes: number;
};

function juzForSurah(surah: number): number {
  for (let i = JUZ_STARTS.length - 1; i >= 0; i--) {
    if (surah >= JUZ_STARTS[i].surah) return JUZ_STARTS[i].juz;
  }
  return 1;
}

function hizbForSurah(surah: number): number {
  for (let i = HIZB_STARTS.length - 1; i >= 0; i--) {
    if (surah >= HIZB_STARTS[i].surah) return HIZB_STARTS[i].hizb;
  }
  return 1;
}

export function getSurahCardInfo(surahNumber: number): SurahCardInfo {
  const meta = getSurahMeta(surahNumber);
  return {
    ...meta,
    juz: juzForSurah(surahNumber),
    hizb: hizbForSurah(surahNumber),
    readMinutes: Math.max(1, Math.round(meta.ayahs * 0.35)),
  };
}

export function getAllSurahCards(): SurahCardInfo[] {
  return getSurahList().map((s) => getSurahCardInfo(s.number));
}

export function filterSurahCards(
  cards: SurahCardInfo[],
  query: string,
): SurahCardInfo[] {
  const q = query.trim();
  if (!q) return cards;
  const lower = q.toLowerCase();
  const num = Number(q);
  return cards.filter(
    (s) =>
      s.name.includes(q) ||
      s.englishName.toLowerCase().includes(lower) ||
      String(s.number) === q ||
      (Number.isFinite(num) && s.number === num),
  );
}

export function parseAyahRef(input: string): { surah: number; ayah: number } | null {
  const m = input.trim().match(/^(\d{1,3})\s*[:-]\s*(\d{1,3})$/);
  if (!m) return null;
  const surah = Number(m[1]);
  const ayah = Number(m[2]);
  if (surah < 1 || surah > 114 || ayah < 1) return null;
  const meta = getSurahMeta(surah);
  if (ayah > meta.ayahs) return null;
  return { surah, ayah };
}

export function getAdjacentSurah(surah: number, dir: -1 | 1): number | null {
  const next = surah + dir;
  if (next < 1 || next > 114) return null;
  return next;
}
