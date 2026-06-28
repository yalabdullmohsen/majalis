/**
 * Smart duplicate detection — URL, canonical, title, date, hash, fingerprint.
 */

import { contentHash, jaccardSimilarity } from "../knowledge-engine/quality.mjs";

export function normalizeUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    let path = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.protocol}//${u.hostname}${path}${u.search}`;
  } catch {
    return String(url).trim().toLowerCase();
  }
}

export function sourceFingerprint(item, connector) {
  const parts = [
    connector?.slug || item.source_slug,
    normalizeUrl(item.raw_url || item.source_url),
    (item.raw_title || "").slice(0, 80).toLowerCase(),
    item.published_at || item.raw_payload?.pubDate || "",
  ];
  return parts.join("|");
}

export function detectDuplicate(item, existingItems = [], connector = null) {
  const h = contentHash(item.raw_title, item.raw_body, item.raw_url);
  const urlNorm = normalizeUrl(item.raw_url || item.source_url);
  const canonical = normalizeUrl(item.raw_payload?.canonical_url || item.raw_payload?.link);
  const fingerprint = sourceFingerprint(item, connector);

  let duplicateOf = null;
  let duplicateScore = 0;
  let reason = null;

  for (const existing of existingItems) {
    if (existing.external_id && item.external_id && existing.external_id === item.external_id) {
      if (existing.publish_status === "published") continue;
      return { isDuplicate: false, isUpdate: true, existingId: existing.id, duplicateScore: 0 };
    }

    const exUrl = normalizeUrl(existing.raw_url || existing.source_url);
    if (urlNorm && exUrl && urlNorm === exUrl) {
      return { isDuplicate: true, duplicateOf: existing.id, duplicateScore: 1, reason: "url_match" };
    }

    if (canonical && exUrl && canonical === exUrl) {
      return { isDuplicate: true, duplicateOf: existing.id, duplicateScore: 1, reason: "canonical_match" };
    }

    if (existing.content_hash === h) {
      return { isDuplicate: true, duplicateOf: existing.id, duplicateScore: 1, reason: "content_hash" };
    }

    const titleScore = jaccardSimilarity(item.raw_title, existing.raw_title || existing.ai_title);
    if (titleScore > duplicateScore) duplicateScore = titleScore;

    const sameDate =
      item.published_at &&
      existing.source_published_at &&
      new Date(item.published_at).toDateString() === new Date(existing.source_published_at).toDateString();

    if (titleScore >= 0.88 && sameDate) {
      return { isDuplicate: true, duplicateOf: existing.id, duplicateScore: titleScore, reason: "title_date" };
    }

    if (titleScore >= 0.92) {
      duplicateOf = existing.id;
      reason = "title_similarity";
    }
  }

  if (duplicateScore >= 0.92 && duplicateOf) {
    return { isDuplicate: true, duplicateOf, duplicateScore, reason };
  }

  return { isDuplicate: false, duplicateOf: null, duplicateScore, contentHash: h, fingerprint };
}
