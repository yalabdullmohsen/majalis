/**
 * Arabic text normalization for deduplication.
 */
import { createHash } from "node:crypto";

const DIACRITICS = /[\u064B-\u065F\u0670\u0640]/g;
const TATWEEL = /\u0640/g;

export function normalizeArabicText(text) {
  return String(text || "")
    .replace(TATWEEL, "")
    .replace(DIACRITICS, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function contentHash(text) {
  const normalized = normalizeArabicText(text);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function titleHash(title) {
  return contentHash(String(title || "").slice(0, 200));
}

export function tokenSet(text) {
  return new Set(normalizeArabicText(text).split(" ").filter((t) => t.length > 1));
}

/** Jaccard similarity on word tokens — lightweight semantic proxy without embeddings API. */
export function tokenSimilarity(a, b) {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function buildSemanticFingerprint(text) {
  const tokens = [...tokenSet(text)].sort().slice(0, 40);
  return createHash("sha256").update(tokens.join("|"), "utf8").digest("hex").slice(0, 32);
}

export function buildEmbeddingProxy(text) {
  const normalized = normalizeArabicText(text);
  const tokens = normalized.split(" ").filter(Boolean);
  const freq = new Map();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 32)
    .map(([word, count]) => ({ word, count }));
}
