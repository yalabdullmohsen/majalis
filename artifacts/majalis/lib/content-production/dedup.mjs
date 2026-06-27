/**
 * Deduplication — hash, normalization, semantic similarity, embedding proxy.
 */
import { DEDUP_CONFIG } from "./config.mjs";
import {
  contentHash,
  titleHash,
  tokenSimilarity,
  buildSemanticFingerprint,
  buildEmbeddingProxy,
  normalizeArabicText,
} from "./normalize.mjs";

export function buildDedupKeys(item) {
  const body = item.body || item.text || item.question || "";
  const title = item.title || "";
  return {
    content_hash: contentHash(body),
    title_hash: title ? titleHash(title) : null,
    semantic_fingerprint: buildSemanticFingerprint(`${title} ${body}`),
    embedding: buildEmbeddingProxy(body),
    normalized_preview: normalizeArabicText(body).slice(0, 160),
  };
}

export async function checkDuplicate(admin, pipeline, item, registryRows = null) {
  const keys = buildDedupKeys(item);
  const reasons = [];

  if (!admin) {
    return { isDuplicate: false, keys, reasons, match: null };
  }

  let rows = registryRows;
  if (!rows) {
    const { data } = await admin
      .from("content_dedup_registry")
      .select("*")
      .eq("pipeline", pipeline)
      .order("created_at", { ascending: false })
      .limit(500);
    rows = data || [];
  }

  const exact = rows.find((r) => r.content_hash === keys.content_hash);
  if (exact) {
    reasons.push("content_hash_match");
    return { isDuplicate: true, keys, reasons, match: exact };
  }

  if (keys.title_hash) {
    const titleMatch = rows.find((r) => r.title_hash && r.title_hash === keys.title_hash);
    if (titleMatch) {
      reasons.push("title_hash_match");
      return { isDuplicate: true, keys, reasons, match: titleMatch };
    }
  }

  const sourceUrl = item.source_url || item.metadata?.source_url;
  if (sourceUrl) {
    const sourceMatch = rows.find((r) => r.source_url === sourceUrl);
    if (sourceMatch) {
      reasons.push("source_url_match");
      return { isDuplicate: true, keys, reasons, match: sourceMatch };
    }
  }

  const body = item.body || item.text || item.question || "";
  for (const row of rows.slice(0, 100)) {
    if (!row.normalized_preview) continue;
    const sim = tokenSimilarity(body, row.normalized_preview);
    if (sim >= DEDUP_CONFIG.similarityThreshold) {
      reasons.push(`semantic_similarity:${sim.toFixed(3)}`);
      return { isDuplicate: true, keys, reasons, match: row };
    }
  }

  if (item.title) {
    for (const row of rows.slice(0, 50)) {
      if (!row.normalized_preview) continue;
      const sim = tokenSimilarity(item.title, row.normalized_preview.slice(0, 80));
      if (sim >= DEDUP_CONFIG.titleSimilarityThreshold) {
        reasons.push(`title_similarity:${sim.toFixed(3)}`);
        return { isDuplicate: true, keys, reasons, match: row };
      }
    }
  }

  return { isDuplicate: false, keys, reasons, match: null };
}

export async function registerDedup(admin, pipeline, keys, publishedId, sourceUrl) {
  if (!admin) return null;
  const { data, error } = await admin
    .from("content_dedup_registry")
    .upsert(
      {
        pipeline,
        content_hash: keys.content_hash,
        title_hash: keys.title_hash,
        source_url: sourceUrl || null,
        normalized_preview: keys.normalized_preview,
        published_id: publishedId,
        embedding: keys.embedding,
      },
      { onConflict: "pipeline,content_hash" },
    )
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return data?.id;
}
