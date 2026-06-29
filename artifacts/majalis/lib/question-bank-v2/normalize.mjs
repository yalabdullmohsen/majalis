/** @fileoverview تطبيع النص العربي للمقارنة ومنع التكرار */

const DIACRITICS = /[\u064B-\u065F\u0670\u0640]/g;
const TATWEEL = /\u0640/g;
const ALEF_VARIANTS = /[أإآ]/g;
const TA_MARBUTA = /ة/g;
const YA_VARIANTS = /[ىي]/g;
const PUNCT = /[^\u0600-\u06FFa-zA-Z0-9\s]/g;

export function normalizeArabic(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(DIACRITICS, '')
    .replace(TATWEEL, '')
    .replace(ALEF_VARIANTS, 'ا')
    .replace(TA_MARBUTA, 'ه')
    .replace(YA_VARIANTS, 'ي')
    .replace(PUNCT, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function tokenize(text) {
  const n = normalizeArabic(text);
  if (!n) return [];
  return n.split(/\s+/).filter((t) => t.length > 1);
}

export function jaccardSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const t of setA) {
    if (setB.has(t)) inter++;
  }
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function contentHash(parts) {
  const joined = parts.map((p) => normalizeArabic(String(p ?? ''))).join('|');
  let h = 0;
  for (let i = 0; i < joined.length; i++) {
    h = (Math.imul(31, h) + joined.charCodeAt(i)) | 0;
  }
  return `h${Math.abs(h).toString(16)}`;
}

export function embeddingSimilarity(a, b) {
  const ta = tokenize(a);
  const tb = tokenize(b);
  const vocab = new Set([...ta, ...tb]);
  const vec = (tokens) => {
    const counts = new Map();
    for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1);
    const v = [];
    for (const w of vocab) v.push(counts.get(w) || 0);
    return v;
  };
  const va = vec(ta);
  const vb = vec(tb);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < va.length; i++) {
    dot += va[i] * vb[i];
    na += va[i] * va[i];
    nb += vb[i] * vb[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function combinedSimilarity(a, b) {
  const j = jaccardSimilarity(a, b);
  const e = embeddingSimilarity(a, b);
  return Math.max(j, e);
}
