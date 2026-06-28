/**
 * Unified dedup — SHA256, normalization, Arabic normalization, similarity,
 * semantic comparison (OpenAI or local), source/title/history checks.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { dedupeKeyForRow } from "../content-import/dedupe.mjs";
import { DEDUP_DEFAULTS, SIMILARITY_TOKEN_THRESHOLD } from "./config.mjs";
import { contentHash, normalizeArabicText, normalizeTitle, tokenOverlapSimilarity } from "./normalize.mjs";
import { compareSemantic, getSemanticEmbedding, cosineSimilarity, semanticSimilarityLocal } from "./semantic.mjs";

export function buildFingerprint(contentType, record, sourceSlug) {
  const text = record.text || record.body || record.question || record.title || "";
  const title = record.title || record.question || "";
  const hashParts = [text, title, sourceSlug || record.source_slug || record.source_name || ""];
  const fingerprintHash = contentHash(contentType, hashParts);

  return {
    content_type: contentType,
    fingerprint_hash: fingerprintHash,
    normalized_text: normalizeArabicText(text).slice(0, 2000),
    title_normalized: normalizeTitle(title),
    source_slug: sourceSlug || null,
    import_key: dedupeKeyForRow(contentType === "benefits" ? "benefits" : contentType, record),
  };
}

async function logDuplicateHistory({ contentType, fingerprint, reason, similarity, sourceSlug, existingId }) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    await admin.from("akp_duplicate_history").insert({
      content_type: contentType,
      fingerprint_hash: fingerprint.fingerprint_hash,
      reason,
      similarity: similarity ?? null,
      source_slug: sourceSlug,
      existing_id: existingId ? String(existingId) : null,
    });
  } catch {
    /* optional table */
  }
}

async function checkVectorSimilarity(admin, contentType, embedding, threshold) {
  if (!embedding?.length) return null;
  try {
    const { data } = await admin.rpc("akp_match_fingerprints", {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: 3,
      p_content_type: contentType,
    });
    if (data?.length) {
      return { duplicate: true, reason: "vector", similarity: data[0].similarity, existingId: data[0].target_id };
    }
  } catch {
    /* RPC optional — fall back to token/semantic */
  }

  try {
    const { data: recent } = await admin
      .from("akp_content_fingerprints")
      .select("id, target_id, embedding")
      .eq("content_type", contentType)
      .not("embedding", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    for (const row of recent || []) {
      if (!row.embedding?.length) continue;
      const sim = cosineSimilarity(embedding, row.embedding);
      if (sim >= threshold) {
        return { duplicate: true, reason: "embedding", similarity: sim, existingId: row.target_id };
      }
    }
  } catch {
    /* optional */
  }
  return null;
}

export async function checkDuplicate({ contentType, record, source, rules = {} }) {
  const mergedRules = { ...DEDUP_DEFAULTS, ...(source?.dedup_rules || {}), ...rules };
  const fp = buildFingerprint(contentType, record, source?.slug);
  const admin = getSupabaseAdmin();
  const threshold = Number(mergedRules.semantic_threshold || SIMILARITY_TOKEN_THRESHOLD);

  const markDup = async (result) => {
    await logDuplicateHistory({
      contentType,
      fingerprint: fp,
      reason: result.reason,
      similarity: result.similarity,
      sourceSlug: source?.slug,
      existingId: result.existingId,
    });
    return result;
  };

  if (mergedRules.hash && admin) {
    try {
      const { data } = await admin
        .from("akp_content_fingerprints")
        .select("id, target_id, fingerprint_hash")
        .eq("content_type", contentType)
        .eq("fingerprint_hash", fp.fingerprint_hash)
        .limit(1);
      if (data?.length) {
        return markDup({ duplicate: true, reason: "hash", fingerprint: fp, existingId: data[0].target_id });
      }
    } catch {
      /* table optional */
    }
  }

  if (mergedRules.title_match && fp.title_normalized && admin) {
    try {
      const { data } = await admin
        .from("akp_content_fingerprints")
        .select("id, title_normalized, target_id, source_slug")
        .eq("content_type", contentType)
        .eq("title_normalized", fp.title_normalized)
        .limit(3);
      if (data?.length) {
        return markDup({ duplicate: true, reason: "title", fingerprint: fp, existingId: data[0].target_id });
      }
    } catch {
      /* optional */
    }
  }

  if (mergedRules.source_match && source?.slug && admin) {
    try {
      const { data } = await admin
        .from("akp_content_fingerprints")
        .select("id, normalized_text, target_id")
        .eq("content_type", contentType)
        .eq("source_slug", source.slug)
        .eq("normalized_text", fp.normalized_text)
        .limit(1);
      if (data?.length) {
        return markDup({ duplicate: true, reason: "source_text", fingerprint: fp, existingId: data[0].target_id });
      }
    } catch {
      /* optional */
    }
  }

  const text = fp.normalized_text;
  if (text && admin) {
    try {
      const { data: recent } = await admin
        .from("akp_content_fingerprints")
        .select("id, normalized_text, target_id, title_normalized")
        .eq("content_type", contentType)
        .order("created_at", { ascending: false })
        .limit(150);

      for (const row of recent || []) {
        const tokenSim = tokenOverlapSimilarity(text, row.normalized_text);
        if (tokenSim >= threshold) {
          return markDup({ duplicate: true, reason: "token", similarity: tokenSim, fingerprint: fp, existingId: row.target_id });
        }

        if (fp.title_normalized && row.title_normalized === fp.title_normalized) {
          return markDup({ duplicate: true, reason: "title_cross", fingerprint: fp, existingId: row.target_id });
        }
      }
    } catch {
      /* optional */
    }
  }

  const semantic = await getSemanticEmbedding(text);
  fp.semantic_fingerprint = semantic.fingerprint;
  if (semantic.embedding) fp.embedding = semantic.embedding;

  if (semantic.embedding && admin) {
    const vectorDup = await checkVectorSimilarity(admin, contentType, semantic.embedding, threshold);
    if (vectorDup) {
      return markDup({ ...vectorDup, fingerprint: fp });
    }
  }

  if (text && admin) {
    try {
      const { data: recent } = await admin
        .from("akp_content_fingerprints")
        .select("id, normalized_text, target_id, metadata")
        .eq("content_type", contentType)
        .order("created_at", { ascending: false })
        .limit(80);

      for (const row of recent || []) {
        const storedFp = row.metadata?.semantic_fingerprint;
        const { similarity, mode } = await compareSemantic(text, row.normalized_text, row.embedding);
        const localSim = storedFp && semantic.fingerprint
          ? semanticSimilarityLocal(storedFp, semantic.fingerprint)
          : 0;
        const effectiveSim = Math.max(similarity, localSim);
        if (effectiveSim >= threshold) {
          return markDup({
            duplicate: true,
            reason: mode === "embedding" ? "semantic_embedding" : "semantic_local",
            similarity: effectiveSim,
            fingerprint: fp,
            existingId: row.target_id,
          });
        }
      }
    } catch {
      /* optional */
    }
  }

  return { duplicate: false, fingerprint: fp };
}

export async function registerFingerprint({ fingerprint, targetTable, targetId, metadata = {} }) {
  const admin = getSupabaseAdmin();
  if (!admin || !fingerprint) return { ok: false };

  try {
    const row = {
      content_type: fingerprint.content_type,
      fingerprint_hash: fingerprint.fingerprint_hash,
      normalized_text: fingerprint.normalized_text,
      title_normalized: fingerprint.title_normalized,
      source_slug: fingerprint.source_slug,
      target_table: targetTable,
      target_id: String(targetId),
      metadata: {
        ...metadata,
        semantic_fingerprint: fingerprint.semantic_fingerprint || null,
        import_key: fingerprint.import_key,
      },
    };
    if (fingerprint.embedding) {
      row.embedding = fingerprint.embedding;
    }
    const { error } = await admin.from("akp_content_fingerprints").upsert(row, {
      onConflict: "content_type,fingerprint_hash",
    });
    return { ok: !error, error: error?.message };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}
