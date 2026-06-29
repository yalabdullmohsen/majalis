import { normalizeArabic } from "./extract-normalize.mjs";

export function findDuplicateItem(candidate, existing) {
  for (const ex of existing) {
    if (candidate.external_id && ex.external_id === candidate.external_id && candidate.source_id === ex.source_id) {
      return { duplicate: true, reason: "external_id", match: ex, score: 1 };
    }
    if (candidate.original_url && ex.original_url === candidate.original_url) {
      return { duplicate: true, reason: "source_url", match: ex, score: 1 };
    }
    if (candidate.title_hash && ex.title_hash === candidate.title_hash) {
      return { duplicate: true, reason: "title_hash", match: ex, score: 1 };
    }
    if (candidate.normalized_title && ex.normalized_title === candidate.normalized_title) {
      return { duplicate: true, reason: "normalized_title", match: ex, score: 1 };
    }
    const sim = tokenSimilarity(candidate.normalized_title || "", ex.normalized_title || "");
    if (sim >= 0.92) {
      return { duplicate: true, reason: "semantic_similarity", match: ex, score: sim };
    }
    if (candidate.scholar_name && candidate.event_date && ex.scholar_name === candidate.scholar_name
      && candidate.event_date === ex.event_date && candidate.location === ex.location) {
      return { duplicate: true, reason: "scholar_date_place", match: ex, score: 0.95 };
    }
    if (candidate.content_hash && ex.content_hash === candidate.content_hash) {
      return { duplicate: true, reason: "content_hash", match: ex, score: 1 };
    }
  }
  return { duplicate: false };
}

function tokenSimilarity(a, b) {
  const ta = new Set(normalizeArabic(a).split(/\s+/).filter(Boolean));
  const tb = new Set(normalizeArabic(b).split(/\s+/).filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.max(ta.size, tb.size);
}

export function mergeIntoExisting(existing, incoming) {
  return {
    ...existing,
    description: existing.description || incoming.description,
    scholar_name: existing.scholar_name || incoming.scholar_name,
    event_date: existing.event_date || incoming.event_date,
    event_time: existing.event_time || incoming.event_time,
    stream_url: existing.stream_url || incoming.stream_url,
    map_url: existing.map_url || incoming.map_url,
    file_url: existing.file_url || incoming.file_url,
    keywords: [...new Set([...(existing.keywords || []), ...(incoming.keywords || [])])],
    updated_at: new Date().toISOString(),
  };
}
