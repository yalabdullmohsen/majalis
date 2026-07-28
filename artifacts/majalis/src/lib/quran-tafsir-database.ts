/**
 * Web port of the RN QuranReader tafsir sketch:
 *
 * ```
 * // 1. هيكل بيانات بسيط (ملف منفصل)
 * const tafsirDatabase = {
 *   "verse_id_1": "تفسير الآية الأولى: …",
 *   "verse_id_2": "تفسير الآية الثانية: …",
 * };
 * // 2. حالة العرض
 * const [showTafsir, setShowTafsir] = useState(false);
 * // 3. طريقة العرض
 * const toggleTafsir = () => setShowTafsir(!showTafsir);
 * ```
 *
 * Keys use stable `surah:ayah` verse ids (e.g. `"2:255"`).
 * Entries are filled from AlQuran Cloud via `fetchTafsirAyahs` (same path as
 * TafseerService) — not a static bundled corpus.
 */

import { fetchTafsirAyahs, type TafsirAyah } from "@/lib/quran-api";
import { DEFAULT_TAFSEER_SOURCE } from "@/core/tafseer/TafseerService";

/** RN `tafsirDatabase` — verse_id → تفسير. */
export type TafsirDatabase = Record<string, string>;

export const QURAN_TAFSIR_TOGGLE_KEY = "quranReaderShowTafsir";
export const QURAN_INLINE_TAFSIR_EDITION_KEY = "majalis-mushaf-tafsir-edition-v1";

/** 1. هيكل البيانات — يُملأ عند تحميل السورة / الآية. */
export const tafsirDatabase: TafsirDatabase = Object.create(null) as TafsirDatabase;

/** مفتاح الآية المستقر (RN `verse_id`). */
export function verseTafsirId(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

export function getTafsirFromDatabase(verseId: string): string | undefined {
  const text = tafsirDatabase[verseId];
  return text && text.trim() ? text : undefined;
}

export function getTafsirForAyah(surah: number, ayah: number): string | undefined {
  return getTafsirFromDatabase(verseTafsirId(surah, ayah));
}

export function setTafsirInDatabase(verseId: string, text: string): void {
  if (!text.trim()) return;
  tafsirDatabase[verseId] = text.trim();
}

/** دمج صفوف سورة كاملة في القاعدة (بعد fetchTafsirAyahs). */
export function mergeTafsirRowsIntoDatabase(surah: number, rows: TafsirAyah[]): number {
  let n = 0;
  for (const row of rows) {
    if (!row.text?.trim()) continue;
    setTafsirInDatabase(verseTafsirId(surah, row.numberInSurah), row.text);
    n += 1;
  }
  return n;
}

/** خريطة numberInSurah → نص لعرض قائمة الآيات (من القاعدة الحالية للسورة). */
export function tafsirByAyahFromDatabase(surah: number, ayahCountHint?: number): Record<number, string> {
  const map: Record<number, string> = {};
  const prefix = `${surah}:`;
  for (const [key, text] of Object.entries(tafsirDatabase)) {
    if (!key.startsWith(prefix) || !text) continue;
    const ayah = Number(key.slice(prefix.length));
    if (!Number.isFinite(ayah)) continue;
    if (ayahCountHint != null && (ayah < 1 || ayah > ayahCountHint)) continue;
    map[ayah] = text;
  }
  return map;
}

export function readStoredShowTafsir(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const raw = localStorage.getItem(QURAN_TAFSIR_TOGGLE_KEY);
    if (raw == null) return false;
    return raw === "1" || raw === "true";
  } catch {
    return false;
  }
}

export function persistShowTafsir(show: boolean): void {
  try {
    localStorage.setItem(QURAN_TAFSIR_TOGGLE_KEY, show ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function readInlineTafsirEdition(): string {
  try {
    if (typeof localStorage === "undefined") return DEFAULT_TAFSEER_SOURCE;
    const v = localStorage.getItem(QURAN_INLINE_TAFSIR_EDITION_KEY);
    if (v?.trim()) return v.trim();
  } catch {
    /* ignore */
  }
  return DEFAULT_TAFSEER_SOURCE;
}

/**
 * تحميل تفسير السورة إلى `tafsirDatabase` (ذاكرة الجلسة + كاش fetchTafsirAyahs).
 * @returns عدد الآيات التي دخلت القاعدة
 */
export async function loadSurahTafsirIntoDatabase(
  surah: number,
  edition: string = readInlineTafsirEdition(),
): Promise<{ count: number; byAyah: Record<number, string> }> {
  const rows = await fetchTafsirAyahs(surah, edition);
  const count = mergeTafsirRowsIntoDatabase(surah, rows);
  return { count, byAyah: tafsirByAyahFromDatabase(surah) };
}

/** اختبارات — تفريغ القاعدة دون لمس localStorage. */
export function __resetTafsirDatabaseForTests(): void {
  for (const key of Object.keys(tafsirDatabase)) {
    delete tafsirDatabase[key];
  }
}
