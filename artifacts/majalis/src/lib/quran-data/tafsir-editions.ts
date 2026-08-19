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
  /** مختصر يظهر افتراضيًا في شيت الآية (2–4 أسطر) */
  brief?: boolean;
  /** مناسب للتوسّع من زر «التفسير المطوّل» */
  extended?: boolean;
  /** مصدر التوثيق (حرفي — بلا توليد) */
  sourceNoteAr: string;
  caution?: string;
};

/**
 * التفاسير المعتمدة — النص من Quran.com/QUL حرفياً.
 * الافتراضي: الميسّر (مختصر موثّق). «المختصر» غير متاح حالياً على api.quran.com.
 */
export const MUSHAF_TAFSIR_EDITIONS: MushafTafsirEdition[] = [
  {
    id: "ar-tafsir-muyassar",
    label: "التفسير الميسّر",
    author: "مجمع الملك فهد",
    level: "مبتدئ",
    quranComSlug: "ar-tafsir-muyassar",
    brief: true,
    sourceNoteAr: "Quran.com / QUL — ar-tafsir-muyassar",
  },
  {
    id: "ar-tafseer-al-saddi",
    label: "تفسير السعدي",
    author: "عبد الرحمن بن ناصر السعدي",
    level: "مبتدئ",
    quranComSlug: "ar-tafseer-al-saddi",
    extended: true,
    sourceNoteAr: "Quran.com / QUL — ar-tafseer-al-saddi",
  },
  {
    id: "ar-tafsir-ibn-kathir",
    label: "تفسير ابن كثير",
    author: "ابن كثير",
    level: "متوسط",
    quranComSlug: "ar-tafsir-ibn-kathir",
    extended: true,
    sourceNoteAr: "Quran.com / QUL — ar-tafsir-ibn-kathir",
  },
  {
    id: "ar-tafsir-al-baghawi",
    label: "تفسير البغوي",
    author: "البغوي",
    level: "متوسط",
    quranComSlug: "ar-tafsir-al-baghawi",
    sourceNoteAr: "Quran.com / QUL — ar-tafsir-al-baghawi",
  },
  {
    id: "ar-tafsir-al-tabari",
    label: "تفسير الطبري",
    author: "ابن جرير الطبري",
    level: "متقدم",
    quranComSlug: "ar-tafsir-al-tabari",
    sourceNoteAr: "Quran.com / QUL — ar-tafsir-al-tabari",
  },
];

export const DEFAULT_MUSHAF_TAFSIR_EDITION = "muyassar";
export const DEFAULT_EXTENDED_TAFSIR_EDITION =
  MUSHAF_TAFSIR_EDITIONS.find((e) => e.id === "ar-tafsir-ibn-kathir")?.id ??
  MUSHAF_TAFSIR_EDITIONS[1]!.id;

/** مفاتيح تفضيل قديمة → معرفات السجل v1 */
const LEGACY_TAFSIR_IDS: Record<string, string> = {
  "ar-tafsir-muyassar": "muyassar",
  "ar-tafseer-al-saddi": "saadi",
  "ar-tafsir-ibn-kathir": "ibn-kathir",
  "ar-tafsir-al-baghawi": "baghawi",
  "ar-tafsir-al-tabari": "tabari",
  "ar.muyassar": "muyassar",
  "ar.baghawi": "baghawi",
};

export function resolveMushafTafsirEditionId(raw: string | null | undefined): string {
  if (!raw) return "muyassar";
  return LEGACY_TAFSIR_IDS[raw] ?? raw;
}

const REGISTRY_ID_TO_QCOM: Record<string, string> = {
  muyassar: "ar-tafsir-muyassar",
  saadi: "ar-tafseer-al-saddi",
  "ibn-kathir": "ar-tafsir-ibn-kathir",
  baghawi: "ar-tafsir-al-baghawi",
  tabari: "ar-tafsir-al-tabari",
};

export function getMushafTafsirEdition(id: string): MushafTafsirEdition | undefined {
  const resolved = resolveMushafTafsirEditionId(id);
  const direct = MUSHAF_TAFSIR_EDITIONS.find((e) => e.id === id || e.id === resolved);
  if (direct) return direct;
  const slug = REGISTRY_ID_TO_QCOM[resolved];
  return slug ? MUSHAF_TAFSIR_EDITIONS.find((e) => e.quranComSlug === slug) : undefined;
}

const TAFSIR_PREF_KEY = "majlisilm.mushaf.tafsir-edition";

export function loadMushafTafsirEdition(): string {
  try {
    return resolveMushafTafsirEditionId(localStorage.getItem(TAFSIR_PREF_KEY));
  } catch {
    return DEFAULT_MUSHAF_TAFSIR_EDITION;
  }
}

export function saveMushafTafsirEdition(id: string): void {
  const resolved = resolveMushafTafsirEditionId(id);
  try {
    localStorage.setItem(TAFSIR_PREF_KEY, resolved);
    localStorage.setItem("majalis-mushaf-tafsir-edition-v1", resolved);
  } catch {
    /* ignore */
  }
}
