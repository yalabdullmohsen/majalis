/**
 * Unified dedup — hash, normalization, semantic similarity, embedding comparison.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { dedupeKeyForRow } from "../content-import/dedupe.mjs";
import { generateEmbedding } from "../knowledge-engine/indexer.mjs";
import { DEDUP_DEFAULTS, SIMILARITY_TOKEN_THRESHOLD } from "./config.mjs";
import { contentHash, normalizeArabicText, normalizeTitle, tokenOverlapSimilarity } from "./normalize.mjs";

export function buildFingerprint(contentType, record, sourceSlug) {
  const text = record.text || record.body || record.question || record.title || "";
  const title = record.title || "";
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

export async function checkDuplicate({ contentType, record, source, rules = {} }) {
  const mergedRules = { ...DEDUP_DEFAULTS, ...(source?.dedup_rules || {}), ...rules };
  const fp = buildFingerprint(contentType, record, source?.slug);
  const admin = getSupabaseAdmin();

  const reasons = [];

  if (mergedRules.hash && admin) {
    try {
      const { data } = await admin
        .from("akp_content_fingerprints")
        .select("id, target_id, fingerprint_hash")
        .eq("content_type", contentType)
        .eq("fingerprint_hash", fp.fingerprint_hash)
        .limit(1);
      if (data?.length) {
        return { duplicate: true, reason: "hash", fingerprint: fp, existingId: data[0].target_id };
      }
    } catch {
      /* table optional */
    }
  }

  if (mergedRules.title_match && fp.title_normalized && admin) {
    try {
      const { data } = await admin
        .from("akp_content_fingerprints")
        .select("id, title_normalized, target_id")
        .eq("content_type", contentType)
        .eq("title_normalized", fp.title_normalized)
        .limit(1);
      if (data?.length) {
        return { duplicate: true, reason: "title", fingerprint: fp, existingId: data[0].target_id };
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
        return { duplicate: true, reason: "source_text", fingerprint: fp, existingId: data[0].target_id };
      }
    } catch {
      /* optional */
    }
  }

  const threshold = Number(mergedRules.semantic_threshold || SIMILARITY_TOKEN_THRESHOLD);
  const text = fp.normalized_text;
  if (text && admin) {
    try {
      const { data: recent } = await admin
        .from("akp_content_fingerprints")
        .select("id, normalized_text, target_id")
        .eq("content_type", contentType)
        .order("created_at", { ascending: false })
        .limit(100);

      for (const row of recent || []) {
        const sim = tokenOverlapSimilarity(text, row.normalized_text);
        if (sim >= threshold) {
          return { duplicate: true, reason: "semantic", similarity: sim, fingerprint: fp, existingId: row.target_id };
        }
      }
    } catch {
      /* optional */
    }
  }

  if (mergedRules.semantic_threshold && process.env.OPENAI_API_KEY && fp.normalized_text) {
    const embedding = await generateEmbedding(fp.normalized_text.slice(0, 4000));
    if (embedding) {
      fp.embedding = embedding;
    }
  }

  return { duplicate: false, fingerprint: fp, reasons };
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
      metadata,
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
