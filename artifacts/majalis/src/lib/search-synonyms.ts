/** مرادفات البحث — عربي/إنجليزي/اختصارات شائعة */
const SYNONYM_GROUPS: string[][] = [
  ["فقه", "أحكام", "fiqh", "فقهي"],
  ["تفسير", "tafsir", "تفسيري", "قرآن"],
  ["حديث", "سنة", "hadith", "sunna", "سنّة"],
  ["عقيدة", "توحيد", "aqeedah", "عقائد"],
  ["دروس", "درس", "lesson", "lessons"],
  ["دورة", "دورات", "course", "courses", "ملتقى"],
  ["شيخ", "مشايخ", "speaker", "sheikh"],
  ["مسجد", "جامع", "mosque"],
  ["أذكار", "ذكر", "adhkar", "تسبيح"],
  ["فوائد", "فائدة", "benefit", "fawaid"],
  ["سؤال", "أسئلة", "فتوى", "qa", "question"],
  ["مكتبة", "كتب", "library", "book"],
  ["قرآن", "quran", "مصحف", "سور"],
  ["كويت", "kuwait", "الكويت"],
];

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

const LOOKUP = new Map<string, Set<string>>();

for (const group of SYNONYM_GROUPS) {
  const normalized = group.map(normalizeKey);
  const bucket = new Set(normalized);
  for (const term of normalized) {
    const existing = LOOKUP.get(term) || new Set<string>();
    for (const item of bucket) existing.add(item);
    LOOKUP.set(term, existing);
  }
}

/** يوسّع الاستعلام بمرادفاته للبحث الذكي */
export function expandSearchTerms(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const terms = new Set<string>([trimmed]);
  const parts = trimmed.split(/\s+/).filter(Boolean);

  for (const part of parts) {
    const key = normalizeKey(part);
    terms.add(part);
    const synonyms = LOOKUP.get(key);
    if (synonyms) {
      for (const syn of synonyms) terms.add(syn);
    }
  }

  const fullKey = normalizeKey(trimmed);
  const fullSynonyms = LOOKUP.get(fullKey);
  if (fullSynonyms) {
    for (const syn of fullSynonyms) terms.add(syn);
  }

  return [...terms];
}
