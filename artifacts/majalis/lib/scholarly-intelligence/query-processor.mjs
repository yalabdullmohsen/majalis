/**
 * Arabic query processor — normalization, synonyms, variants for semantic search.
 */

const SYNONYM_GROUPS = [
  ["فقه", "أحكام", "fiqh", "فقهي", "مسائل"],
  ["تفسير", "tafsir", "تفسيري", "قرآن", "آيات"],
  ["حديث", "سنة", "hadith", "sunna", "سنّة", "أحاديث"],
  ["عقيدة", "توحيد", "aqeedah", "عقائد", "إيمان"],
  ["دروس", "درس", "محاضرات", "محاضرة", "lesson", "lessons"],
  ["دورة", "دورات", "course", "courses", "ملتقى"],
  ["شيخ", "مشايخ", "speaker", "sheikh", "عالم", "علماء"],
  ["مسجد", "جامع", "mosque"],
  ["أذكار", "ذكر", "adhkar", "تسبيح", "أوراد"],
  ["فوائد", "فائدة", "benefit", "fawaid"],
  ["سؤال", "أسئلة", "فتوى", "qa", "question", "فتاوى"],
  ["مكتبة", "كتب", "library", "book", "كتاب"],
  ["قرآن", "quran", "مصحف", "سور", "سورة"],
  ["كويت", "kuwait", "الكويت"],
  ["صلاة", "صلوات", "الجماعة", "الفريضة"],
  ["زكاة", "صدقة", "زكوات"],
  ["صيام", "رمضان", "صوم"],
  ["حج", "عمرة", "مناسك"],
  ["طهارة", "وضوء", "غسل", "طهار"],
  ["نكاح", "زواج", "طلاق", "ميراث"],
  ["بيع", "تجارة", "معاملات", "ربا"],
  ["أخلاق", "آداب", "بر", "والدين"],
];

const LOOKUP = new Map();
for (const group of SYNONYM_GROUPS) {
  const normalized = group.map((t) => t.trim().toLowerCase());
  const bucket = new Set(normalized);
  for (const term of normalized) {
    const existing = LOOKUP.get(term) || new Set();
    for (const item of bucket) existing.add(item);
    LOOKUP.set(term, existing);
  }
}

export function normalizeArabic(text) {
  return String(text || "")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ي")
    .replace(/[ة]/g, "ه")
    .replace(/[ى]/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function expandArabicVariants(normalized) {
  const variants = new Set([normalized]);
  if (!normalized) return [];
  variants.add(normalized.replace(/لاس/g, "لس"));
  variants.add(normalized.replace(/([^ا])لس/g, "$1لاس"));
  variants.add(normalized.replace(/ا/g, ""));
  return [...variants].filter(Boolean);
}

export function expandSearchTerms(query) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return [];

  const terms = new Set([trimmed]);
  const parts = trimmed.split(/\s+/).filter(Boolean);

  for (const part of parts) {
    const key = part.trim().toLowerCase();
    terms.add(part);
    const synonyms = LOOKUP.get(key);
    if (synonyms) {
      for (const syn of synonyms) terms.add(syn);
    }
  }

  const fullKey = trimmed.toLowerCase();
  const fullSynonyms = LOOKUP.get(fullKey);
  if (fullSynonyms) {
    for (const syn of fullSynonyms) terms.add(syn);
  }

  return [...terms];
}

export function buildSearchVariants(query) {
  const expanded = expandSearchTerms(query);
  const variants = new Set();
  for (const term of expanded) {
    for (const v of expandArabicVariants(normalizeArabic(term))) {
      variants.add(v);
    }
    variants.add(term);
  }
  return [...variants].filter(Boolean);
}

export function processQuery(rawQuery) {
  const original = String(rawQuery || "").trim();
  const normalized = normalizeArabic(original);
  const expandedTerms = expandSearchTerms(original);
  const variants = buildSearchVariants(original);
  const tokens = normalized.split(/\s+/).filter(Boolean);

  return {
    original,
    normalized,
    expandedTerms,
    variants,
    tokens,
    primary: expandedTerms[0] || original,
    searchString: expandedTerms.slice(0, 5).join(" "),
  };
}

export function scoreTextMatch(haystack, queryInfo) {
  const hay = normalizeArabic(haystack);
  if (!hay || !queryInfo.normalized) return 0;

  let score = 0;
  if (hay.includes(queryInfo.normalized)) score += 40;

  for (const token of queryInfo.tokens) {
    if (token.length >= 2 && hay.includes(token)) score += 12;
  }

  for (const variant of queryInfo.variants) {
    if (variant.length >= 2 && hay.includes(variant)) score += 5;
  }

  return Math.min(score, 100);
}
