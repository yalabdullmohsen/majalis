/**
 * Web port of RN QuranReader translation toggle:
 *
 * ```
 * const [showTranslation, setShowTranslation] = useState(false);
 * const toggleTranslation = () => setShowTranslation(!showTranslation);
 * {showTranslation && <Text>{verse.translation}</Text>}
 * ```
 *
 * Translations are not on local Uthmani ayah objects — loaded live via
 * `fetchTafsirAyahs(surah, edition)` on api.alquran.cloud (same helper as tafsir).
 */

/** Saheeh International — default English translation edition. */
export const DEFAULT_TRANSLATION_EDITION = "en.sahih";

export const QURAN_TRANSLATION_TOGGLE_KEY = "quranReaderShowTranslation";
export const QURAN_TRANSLATION_EDITION_KEY = "quranReaderTranslationEdition";

export function readStoredShowTranslation(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const raw = localStorage.getItem(QURAN_TRANSLATION_TOGGLE_KEY);
    if (raw == null) return false;
    return raw === "1" || raw === "true";
  } catch {
    return false;
  }
}

export function persistShowTranslation(show: boolean): void {
  try {
    localStorage.setItem(QURAN_TRANSLATION_TOGGLE_KEY, show ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function readTranslationEdition(): string {
  try {
    if (typeof localStorage === "undefined") return DEFAULT_TRANSLATION_EDITION;
    const v = localStorage.getItem(QURAN_TRANSLATION_EDITION_KEY);
    if (v && v.trim()) return v.trim();
  } catch {
    /* ignore */
  }
  return DEFAULT_TRANSLATION_EDITION;
}

/** Map AlQuran Cloud rows → numberInSurah → translation text (RN `verse.translation`). */
export function translationMapFromRows(
  rows: Array<{ numberInSurah: number; text: string }>,
): Record<number, string> {
  const map: Record<number, string> = {};
  for (const row of rows) {
    if (row.text) map[row.numberInSurah] = row.text;
  }
  return map;
}
