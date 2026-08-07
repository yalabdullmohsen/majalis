/**
 * تفاسير قارئ المصحف — مرحلة ٢ (القسم ١١-د).
 * القائمة الأساسية: الميسّر، السعدي، ابن كثير، البغوي، الطبري.
 * الجلب كسول لكل آية عبر Quran.com API v4 (انظر fetch-ayah-content.ts).
 */

export type MushafTafsirEdition = {
  id: string;
  label: string;
  author: string;
  level: "مبتدئ" | "متوسط" | "متقدم";
  /** slug على api.quran.com/v4/tafsirs */
  quranComSlug: string;
  caution?: string;
};

/** التفاسير المعتمدة في شيت الآية وقسم علم التفسير */
export const MUSHAF_TAFSIR_EDITIONS: MushafTafsirEdition[] = [
  {
    id: "ar-tafsir-muyassar",
    label: "التفسير الميسّر",
    author: "مجمع الملك فهد",
    level: "مبتدئ",
    quranComSlug: "ar-tafsir-muyassar",
  },
  {
    id: "ar-tafseer-al-saddi",
    label: "تفسير السعدي",
    author: "عبد الرحمن بن ناصر السعدي",
    level: "مبتدئ",
    quranComSlug: "ar-tafseer-al-saddi",
  },
  {
    id: "ar-tafsir-ibn-kathir",
    label: "تفسير ابن كثير",
    author: "ابن كثير",
    level: "متوسط",
    quranComSlug: "ar-tafsir-ibn-kathir",
  },
  {
    id: "ar-tafsir-al-baghawi",
    label: "تفسير البغوي",
    author: "البغوي",
    level: "متوسط",
    quranComSlug: "ar-tafsir-al-baghawi",
  },
  {
    id: "ar-tafsir-al-tabari",
    label: "تفسير الطبري",
    author: "ابن جرير الطبري",
    level: "متقدم",
    quranComSlug: "ar-tafsir-al-tabari",
  },
];

export const DEFAULT_MUSHAF_TAFSIR_EDITION = MUSHAF_TAFSIR_EDITIONS[0]!.id;

/** مفاتيح تفضيل قديمة (AlQuran Cloud) → معرفات مرحلة ٢ */
const LEGACY_TAFSIR_IDS: Record<string, string> = {
  "ar.muyassar": "ar-tafsir-muyassar",
  "ar.baghawi": "ar-tafsir-al-baghawi",
};

export function resolveMushafTafsirEditionId(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_MUSHAF_TAFSIR_EDITION;
  const mapped = LEGACY_TAFSIR_IDS[raw] ?? raw;
  if (MUSHAF_TAFSIR_EDITIONS.some((e) => e.id === mapped)) return mapped;
  return DEFAULT_MUSHAF_TAFSIR_EDITION;
}

export function getMushafTafsirEdition(id: string): MushafTafsirEdition | undefined {
  return MUSHAF_TAFSIR_EDITIONS.find((e) => e.id === id);
}
