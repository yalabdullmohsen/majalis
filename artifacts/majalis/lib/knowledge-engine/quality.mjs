/**
 * Quality scoring, source verification, duplicate detection.
 */

import { createHash } from "node:crypto";
import {
  DUPLICATE_THRESHOLD,
  MIN_QUALITY_TO_PUBLISH,
  MIN_TRUST_TO_PUBLISH,
  sourceTrustScore,
} from "./sources-registry.mjs";

function normalizeText(t) {
  return String(t || "")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text) {
  return new Set(normalizeText(text).split(" ").filter((w) => w.length >= 2));
}

export function jaccardSimilarity(a, b) {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function verifySource(item, source) {
  const errors = [];
  if (!item.raw_url && !item.source_url) errors.push("لا رابط مصدر");
  if (!item.raw_title?.trim() || item.raw_title.trim().length < 4) errors.push("عنوان قصير");
  if (!item.raw_body?.trim() && !item.raw_title?.trim()) errors.push("محتوى فارغ");
  if (item.raw_url && !/^https?:\/\//i.test(item.raw_url)) errors.push("رابط غير صالح");

  const trust = source ? sourceTrustScore(source) : 60;
  const verified = errors.length === 0 && trust >= MIN_TRUST_TO_PUBLISH;

  return {
    verified,
    trust_score: trust,
    verification_status: verified ? "verified" : "needs_review",
    errors,
  };
}

export function scoreQuality(item, analysis, verification) {
  let score = 0;
  let completeness = 0;

  if (item.raw_title?.trim()) { score += 15; completeness += 15; }
  if (item.raw_body?.trim()?.length > 50) { score += 20; completeness += 20; }
  if (item.raw_url || item.source_url) { score += 15; completeness += 15; }
  if (item.source_attribution) { score += 10; completeness += 10; }
  if (analysis?.ai_summary?.length > 40) { score += 15; completeness += 15; }
  if (analysis?.ai_keywords?.length >= 3) { score += 10; completeness += 10; }
  if (analysis?.ai_category) { score += 5; completeness += 5; }
  if (verification?.verified) { score += 10; }

  if (analysis?.needs_human_review) score -= 15;
  if (analysis?.ai_confidence < 50) score -= 10;
  if (!item.raw_body?.trim()) completeness -= 20;

  score = Math.max(0, Math.min(100, score));
  completeness = Math.max(0, Math.min(100, completeness));

  const canPublish =
    score >= MIN_QUALITY_TO_PUBLISH &&
    verification.trust_score >= MIN_TRUST_TO_PUBLISH &&
    !analysis?.needs_human_review;

  return {
    quality_score: score,
    completeness_score: completeness,
    trust_score: verification.trust_score,
    can_publish: canPublish,
    verification_status: canPublish ? "verified" : "needs_review",
    publish_status: canPublish ? "pending" : "pending",
  };
}

export function detectDuplicates(newItem, existingItems) {
  const titleNorm = normalizeText(newItem.raw_title || newItem.ai_title);
  let bestMatch = null;
  let bestScore = 0;

  for (const existing of existingItems) {
    const existingTitle = normalizeText(existing.raw_title || existing.ai_title);
    const score = jaccardSimilarity(titleNorm, existingTitle);

    if (existing.content_hash && newItem.content_hash === existing.content_hash) {
      return { isDuplicate: true, duplicate_of: existing.id, duplicate_score: 1, matchType: "hash" };
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = existing;
    }
  }

  if (bestScore >= DUPLICATE_THRESHOLD && bestMatch) {
    return {
      isDuplicate: true,
      duplicate_of: bestMatch.id,
      duplicate_score: bestScore,
      matchType: "fuzzy_title",
    };
  }

  return { isDuplicate: false, duplicate_of: null, duplicate_score: bestScore };
}

export function contentHash(title, body, url) {
  return createHash("sha256")
    .update([normalizeText(title), normalizeText(body).slice(0, 500), url || ""].join("|"))
    .digest("hex")
    .slice(0, 32);
}

export function mergeDuplicateFields(primary, duplicate) {
  return {
    ...primary,
    ai_keywords: [...new Set([...(primary.ai_keywords || []), ...(duplicate.ai_keywords || [])])].slice(0, 15),
    quality_score: Math.max(primary.quality_score || 0, duplicate.quality_score || 0),
  };
}
