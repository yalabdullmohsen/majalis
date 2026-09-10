/**
 * أعلام معمارية لمصحف سُنّة v2 — بلا اختيار مستخدم في الإنتاج النهائي.
 * التراجع الداخلي المؤقت عبر localStorage فقط أثناء دورة TestFlight.
 */

import { QURAN_DATA_FEATURES } from "@/lib/quran-data/flags";

export const MUSHAF_READER_V2_FLAG_KEY = "ssunnah-mushaf-reader-v2";

export const MUSHAF_V2_FEATURES = {
  architectureLayers: true,
  settledLastPageSave: true,
  navigationLock: true,
  localSearchEngine: true,
  userDataMigration: true,
  offlineTafsirPacks: QURAN_DATA_FEATURES.offlineTafsirPacks,
  ayahMeaningsTab: QURAN_DATA_FEATURES.ayahMeaningsTab,
  ayahTajweedTab: QURAN_DATA_FEATURES.ayahTajweedTab,
} as const;

/** تراجع داخلي مؤقت: localStorage[key]="0" يعطّل طبقات v2 دون حذف القارئ القديم. */
export function isMushafReaderV2Enabled(): boolean {
  if (!MUSHAF_V2_FEATURES.architectureLayers) return false;
  try {
    if (typeof localStorage === "undefined") return true;
    const raw = localStorage.getItem(MUSHAF_READER_V2_FLAG_KEY);
    if (raw === "0" || raw === "false") return false;
  } catch {
    /* ignore */
  }
  return true;
}
