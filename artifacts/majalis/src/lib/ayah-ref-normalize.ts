/**
 * تطبيع مرجع الآية — وحدة خفيفة بلا أوصاف السور.
 * لا تستوردها وحدات الإقلاع عبر quran-api.
 */
const SURAH_AYAH_COUNTS: readonly number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53,
  89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12,
  12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26,
  30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

const QURAN_GLOBAL_AYAH_MAX = 6236;

export function globalAyahToSurahAyah(global: number): { surah: number; ayah: number } {
  let remaining = Math.floor(global);
  if (!Number.isFinite(remaining) || remaining < 1) return { surah: 1, ayah: 1 };
  if (remaining > QURAN_GLOBAL_AYAH_MAX) remaining = QURAN_GLOBAL_AYAH_MAX;
  for (let s = 1; s <= 114; s++) {
    const count = SURAH_AYAH_COUNTS[s - 1] ?? 1;
    if (remaining <= count) return { surah: s, ayah: remaining };
    remaining -= count;
  }
  return { surah: 114, ayah: SURAH_AYAH_COUNTS[113] ?? 6 };
}

export function normalizeSurahAyah(
  surah: number,
  ayah: number,
): { surah: number; ayah: number } {
  const s = Math.min(114, Math.max(1, Math.floor(surah) || 1));
  const raw = Math.floor(ayah);
  const max = SURAH_AYAH_COUNTS[s - 1] ?? 1;
  if (Number.isFinite(raw) && raw >= 1 && raw <= max) {
    return { surah: s, ayah: raw };
  }
  if (Number.isFinite(raw) && raw > max && raw <= QURAN_GLOBAL_AYAH_MAX) {
    return globalAyahToSurahAyah(raw);
  }
  return { surah: s, ayah: Math.min(max, Math.max(1, Number.isFinite(raw) ? raw : 1)) };
}

export function normalizeAyahKey(ayahKey: string): string | null {
  if (typeof ayahKey !== "string") return null;
  const m = ayahKey.trim().match(/^(\d{1,3}):(\d{1,4})$/);
  if (!m) return null;
  const surah = Number(m[1]);
  const ayah = Number(m[2]);
  if (!Number.isFinite(surah) || !Number.isFinite(ayah)) return null;
  if (surah < 1 || surah > 114 || ayah < 1) return null;
  const n = normalizeSurahAyah(surah, ayah);
  return `${n.surah}:${n.ayah}`;
}
