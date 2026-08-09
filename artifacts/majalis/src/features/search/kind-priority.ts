/**
 * أولوية الأقسام داخل نفس مرتبة المطابقة (الأكثر استخدامًا أولًا).
 * أقل رقم = أعلى أولوية.
 */
export const KIND_PRIORITY: Record<string, number> = {
  surah: 0,
  quran: 0,
  page: 1,
  ayah: 1,
  tafsir: 2,
  hadith: 3,
  book: 4,
  library: 4,
  lesson: 5,
  course: 6,
  fatwa: 7,
  qa: 7,
  ruling: 8,
  fiqh: 8,
  fiqh_decision: 8,
  scholar: 9,
  sheikh: 9,
  adhkar: 10,
  dua: 10,
  seerah: 11,
  story: 11,
  nation: 12,
  prophet: 12,
  ulum: 13,
  tajweed: 13,
  hifz: 14,
  memorization: 14,
  settings: 15,
  app: 15,
  occasion: 16,
  fawaid: 16,
  miracle: 17,
  update: 18,
};

export function kindPriority(kind: string): number {
  return KIND_PRIORITY[kind] ?? 50;
}
