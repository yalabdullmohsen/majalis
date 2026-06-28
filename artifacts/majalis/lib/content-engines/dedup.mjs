/**
 * Deduplication via source fingerprints.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { contentHash, normalizeUrl } from "./pipeline.mjs";

export async function checkFingerprint({ engineId, sourceUrl, body, externalKey }) {
  const admin = getSupabaseAdmin();
  const hash = contentHash(`${normalizeUrl(sourceUrl)}|${externalKey || ""}|${body || ""}`);
  if (!admin) return { isDuplicate: false, contentHash: hash };

  const { data } = await admin
    .from("content_engine_source_fingerprints")
    .select("id, target_table, target_id")
    .eq("engine_id", engineId)
    .eq("content_hash", hash)
    .maybeSingle();

  return {
    isDuplicate: Boolean(data),
    contentHash: hash,
    match: data || null,
  };
}

export async function registerFingerprint({
  engineId,
  sourceUrl,
  body,
  externalKey,
  targetTable,
  targetId,
}) {
  const admin = getSupabaseAdmin();
  const hash = contentHash(`${normalizeUrl(sourceUrl)}|${externalKey || ""}|${body || ""}`);
  if (!admin) return { ok: false, contentHash: hash };

  const { error } = await admin.from("content_engine_source_fingerprints").upsert(
    {
      engine_id: engineId,
      source_url: normalizeUrl(sourceUrl) || sourceUrl,
      external_key: externalKey || null,
      content_hash: hash,
      target_table: targetTable || null,
      target_id: targetId ? String(targetId) : null,
    },
    { onConflict: "engine_id,content_hash" },
  );

  return { ok: !error, contentHash: hash, error: error?.message };
}
