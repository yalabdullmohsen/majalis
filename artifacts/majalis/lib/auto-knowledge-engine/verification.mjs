/**
 * Enhanced verification — link, date, author, trust, duplicate check
 */

import { trustScoreFromLevel } from "./connector-base.mjs";
import { contentHash, jaccardSimilarity } from "../knowledge-engine/quality.mjs";

export async function verifyUrlAlive(url, timeoutMs = 8000) {
  if (!url) return { alive: false, error: "missing_url" };
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "MajlisIlmBot/2.0" },
    }).catch(async () =>
      fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "User-Agent": "MajlisIlmBot/2.0" },
      }),
    );
    return { alive: response.ok || response.status < 400, statusCode: response.status };
  } catch (err) {
    return { alive: false, error: err.message };
  }
}

export function verifyItem(item, connector, existingItems = []) {
  const errors = [];
  const warnings = [];

  if (!item.raw_url && !item.source_url) errors.push("missing_url");
  if (item.raw_url && !/^https?:\/\//i.test(item.raw_url)) errors.push("invalid_url_protocol");
  if (!item.raw_title?.trim() || item.raw_title.trim().length < 4) errors.push("title_too_short");
  if (!item.raw_body?.trim() && !item.raw_title?.trim()) errors.push("empty_content");

  const connectorType = connector?.connector_type || connector?.connectorType;
  const isManifestItem =
    connectorType === "manifest" ||
    Boolean(item.raw_payload?._manifest_file || item.raw_payload?.source_name);

  let entityMatch = true;
  if (!isManifestItem && connector?.official_url && item.raw_url) {
    entityMatch = domainsRelated(item.raw_url, connector.official_url);
    if (!entityMatch) warnings.push("domain_mismatch");
  }

  const pubDate = item.published_at || item.raw_payload?.pubDate;
  if (pubDate) {
    const d = new Date(pubDate);
    if (Number.isNaN(d.getTime())) warnings.push("invalid_publish_date");
    else if (d > new Date()) warnings.push("future_publish_date");
  }

  const author = item.raw_payload?.author || item.analysis?.ai_scholar;
  if (!author && connector?.entity_type === "publisher") warnings.push("missing_author");

  const h = contentHash(item.raw_title, item.raw_body, item.raw_url);
  let isDuplicate = false;
  let duplicateOf = null;
  let duplicateScore = 0;

  for (const existing of existingItems) {
    if (existing.external_id && item.external_id && existing.external_id === item.external_id) {
      continue;
    }
    if (existing.content_hash === h) {
      isDuplicate = true;
      duplicateOf = existing.id;
      duplicateScore = 1;
      break;
    }
    const score = jaccardSimilarity(item.raw_title, existing.raw_title || existing.ai_title);
    if (score > duplicateScore) {
      duplicateScore = score;
      if (score >= 0.88) {
        isDuplicate = true;
        duplicateOf = existing.id;
      }
    }
  }

  const trustScore = trustScoreFromLevel(connector?.trust_level || connector?.trustLevel || 3);
  const sourceVerified = errors.length === 0 && entityMatch;

  return {
    verified: sourceVerified && !isDuplicate,
    sourceVerified,
    trustScore,
    isDuplicate,
    duplicateOf,
    duplicateScore,
    contentHash: h,
    errors,
    warnings,
    verificationStatus: isDuplicate
      ? "duplicate"
      : errors.length > 0
        ? "needs_review"
        : sourceVerified
          ? "verified"
          : "needs_review",
  };
}

function domainsRelated(urlA, urlB) {
  try {
    const a = new URL(urlA).hostname.replace(/^www\./, "");
    const b = new URL(urlB).hostname.replace(/^www\./, "");
    return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
  } catch {
    return false;
  }
}

export async function verifyBatch(items, connector, existingItems, { checkLinks = false } = {}) {
  const results = [];
  for (const item of items) {
    const verification = verifyItem(item, connector, existingItems);
    if (checkLinks && item.raw_url && verification.sourceVerified) {
      const link = await verifyUrlAlive(item.raw_url);
      if (!link.alive) {
        verification.warnings.push("broken_link");
        verification.verificationStatus = "needs_review";
        verification.verified = false;
      }
      verification.linkCheck = link;
    }
    results.push({ ...item, verification });
    if (!verification.isDuplicate) {
      existingItems.push({ ...item, content_hash: verification.contentHash, id: item.external_id });
    }
  }
  return results;
}
