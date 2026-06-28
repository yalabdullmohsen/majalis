/**
 * Smart duplicate detection — semantic, title, normalized text, fingerprint, embeddings.
 */

import { detectDuplicate, normalizeUrl, sourceFingerprint } from "../duplicate-detection.mjs";
import { contentHash, jaccardSimilarity } from "../../knowledge-engine/quality.mjs";

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

export function normalizeText(text) {
  return String(text || "")
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function titleSimilarity(a, b) {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  return jaccardSimilarity(na, nb);
}

export function textSimilarity(a, b) {
  const na = normalizeText(a).slice(0, 500);
  const nb = normalizeText(b).slice(0, 500);
  if (!na || !nb) return 0;
  return jaccardSimilarity(na, nb);
}

export function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function detectSmartDuplicate(item, existingItems = [], connector = null, options = {}) {
  const base = detectDuplicate(item, existingItems, connector);
  if (base.isDuplicate) return { ...base, method: base.reason || "base" };

  const urlNorm = normalizeUrl(item.raw_url || item.source_url);
  const canonical = normalizeUrl(item.raw_payload?.canonical_url);
  const fingerprint = sourceFingerprint(item, connector);
  const h = contentHash(item.raw_title, item.raw_body, item.raw_url);
  const normTitle = normalizeText(item.raw_title);
  const normBody = normalizeText(item.raw_body).slice(0, 300);

  let bestMatch = null;
  let bestScore = base.duplicateScore || 0;
  let method = null;

  for (const existing of existingItems) {
    if (existing.external_id === item.external_id && existing.publish_status === "published") continue;

    const exFingerprint = [
      connector?.slug || existing.source_slug,
      normalizeUrl(existing.raw_url),
      normalizeText(existing.raw_title).slice(0, 80),
      existing.source_published_at || "",
    ].join("|");

    if (fingerprint && exFingerprint === fingerprint) {
      return { isDuplicate: true, duplicateOf: existing.id, duplicateScore: 1, reason: "source_fingerprint", method: "fingerprint" };
    }

    const tScore = titleSimilarity(item.raw_title, existing.raw_title || existing.ai_title);
    const bodyScore = textSimilarity(item.raw_body, existing.raw_body || existing.ai_summary);
    const combined = tScore * 0.6 + bodyScore * 0.4;

    const sameDate =
      item.published_at &&
      existing.source_published_at &&
      new Date(item.published_at).toDateString() === new Date(existing.source_published_at).toDateString();

    if (tScore >= 0.95 && sameDate) {
      return { isDuplicate: true, duplicateOf: existing.id, duplicateScore: tScore, reason: "title_date_strict", method: "title_date" };
    }

    if (combined > bestScore) {
      bestScore = combined;
      bestMatch = existing.id;
      method = tScore > bodyScore ? "title_semantic" : "text_semantic";
    }

    if (options.embedding && existing.embedding) {
      const embScore = cosineSimilarity(options.embedding, existing.embedding);
      if (embScore >= 0.92) {
        return { isDuplicate: true, duplicateOf: existing.id, duplicateScore: embScore, reason: "embedding_match", method: "embedding" };
      }
      if (embScore > bestScore) {
        bestScore = embScore;
        bestMatch = existing.id;
        method = "embedding";
      }
    }
  }

  const THRESHOLD = options.strict ? 0.95 : 0.90;
  if (bestScore >= THRESHOLD && bestMatch) {
    return { isDuplicate: true, duplicateOf: bestMatch, duplicateScore: bestScore, reason: method, method };
  }

  const falsePositiveGuard = bestScore >= 0.85 && bestScore < THRESHOLD;
  if (falsePositiveGuard && normTitle.length < 15) {
    return { isDuplicate: false, duplicateOf: null, duplicateScore: bestScore, contentHash: h, fingerprint, nearDuplicate: true };
  }

  return {
    isDuplicate: false,
    duplicateOf: null,
    duplicateScore: bestScore,
    contentHash: h,
    fingerprint,
    nearDuplicate: bestScore >= 0.80,
  };
}

export { normalizeUrl, sourceFingerprint };
