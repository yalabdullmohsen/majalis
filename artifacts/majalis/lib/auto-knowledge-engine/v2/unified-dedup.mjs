/**
 * AKE v2 — Unified cross-source deduplication with source priority.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { normalizeUrl } from "../duplicate-detection.mjs";
import { createHash } from "node:crypto";
import { resolveConnectorAuthority, mapLegacyPriority } from "./source-quality.mjs";

function normalizeTitle(title) {
  return String(title || "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildFingerprint({ title, body, date, speaker, mosque }) {
  const parts = [
    normalizeTitle(title),
    normalizeTitle(speaker),
    normalizeTitle(mosque),
    date ? String(date).slice(0, 10) : "",
    createHash("sha256").update(String(body || "").slice(0, 500)).digest("hex").slice(0, 16),
  ].filter(Boolean);
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

export function computeUnifiedFingerprint(item, extraction = {}) {
  const fields = extraction.extracted_fields || item.extracted_fields || item.raw_payload?.extracted || {};
  return buildFingerprint({
    title: item.raw_title || item.title || fields.title,
    body: item.raw_body || item.body || fields.description,
    date: fields.gregorian_date || fields.date || item.published_at,
    speaker: fields.speaker_name || fields.scholar || extraction.ai_scholar,
    mosque: fields.mosque || fields.mosque_name,
  });
}

export async function checkUnifiedDuplicate(item, connectorConfig) {
  const admin = getSupabaseAdmin();
  const fingerprint = computeUnifiedFingerprint(item);
  const canonicalUrl = normalizeUrl(item.raw_url || item.source_url);

  if (!admin) {
    return { isDuplicate: false, fingerprint, isCrossSource: false };
  }

  try {
    const { data: existing } = await admin
      .from("ake_unified_fingerprints")
      .select("*")
      .eq("fingerprint", fingerprint)
      .maybeSingle();

    if (existing) {
      const newAuth = resolveConnectorAuthority(connectorConfig).authorityScore;
      const existingAuth = existing.source_priority >= 1 && existing.source_priority <= 10
        ? mapLegacyPriority(existing.source_priority)
        : (existing.source_priority || 30);
      const shouldMerge = newAuth >= existingAuth;

      return {
        isDuplicate: true,
        isCrossSource: true,
        fingerprint,
        match: existing,
        action: shouldMerge ? "merge_source" : "skip_lower_priority",
        knowledgeItemId: existing.knowledge_item_id,
        authorityScore: newAuth,
        existingAuthority: existingAuth,
      };
    }

    if (canonicalUrl) {
      const { data: urlMatch } = await admin
        .from("ake_unified_fingerprints")
        .select("*")
        .eq("canonical_url", canonicalUrl)
        .maybeSingle();
      if (urlMatch) {
        return {
          isDuplicate: true,
          isCrossSource: true,
          fingerprint,
          match: urlMatch,
          action: "url_match",
          knowledgeItemId: urlMatch.knowledge_item_id,
        };
      }
    }
  } catch {
    /* table optional pre-migration */
  }

  return { isDuplicate: false, fingerprint, isCrossSource: false };
}

export async function registerUnifiedFingerprint({
  fingerprint,
  item,
  connectorConfig,
  knowledgeItemId,
  lessonId,
}) {
  const admin = getSupabaseAdmin();
  if (!admin || !fingerprint) return { ok: false };

  const sourceEntry = {
    slug: connectorConfig.slug,
    url: item.raw_url || item.source_url,
    priority: resolveConnectorAuthority(connectorConfig).authorityScore,
    fetched_at: new Date().toISOString(),
  };

  const { data: existing } = await admin
    .from("ake_unified_fingerprints")
    .select("*")
    .eq("fingerprint", fingerprint)
    .maybeSingle();

  if (existing) {
    const sources = [...(existing.sources || [])];
    if (!sources.some((s) => s.slug === sourceEntry.slug && s.url === sourceEntry.url)) {
      sources.push(sourceEntry);
    }
    await admin
      .from("ake_unified_fingerprints")
      .update({
        source_count: sources.length,
        sources,
        updated_at: new Date().toISOString(),
        knowledge_item_id: knowledgeItemId || existing.knowledge_item_id,
        lesson_id: lessonId || existing.lesson_id,
      })
      .eq("id", existing.id);

    if (knowledgeItemId) {
      await admin.from("ake_content_sources").upsert(
        {
          knowledge_item_id: knowledgeItemId,
          connector_slug: connectorConfig.slug,
          source_url: sourceEntry.url,
          source_priority: sourceEntry.priority,
          raw_payload: item.raw_payload || {},
        },
        { onConflict: "knowledge_item_id,connector_slug,source_url" },
      );
    }
    return { ok: true, merged: true, id: existing.id };
  }

  const { data } = await admin
    .from("ake_unified_fingerprints")
    .insert({
      fingerprint,
      canonical_url: normalizeUrl(item.raw_url),
      title_normalized: normalizeTitle(item.raw_title),
      content_hash: createHash("sha256").update(String(item.raw_body || "")).digest("hex"),
      knowledge_item_id: knowledgeItemId || null,
      lesson_id: lessonId || null,
      primary_source_slug: connectorConfig.slug,
      source_priority: resolveConnectorAuthority(connectorConfig).authorityScore,
      source_count: 1,
      sources: [sourceEntry],
    })
    .select("id")
    .maybeSingle();

  if (knowledgeItemId) {
    await admin.from("ake_content_sources").insert({
      knowledge_item_id: knowledgeItemId,
      connector_slug: connectorConfig.slug,
      source_url: sourceEntry.url,
      source_priority: sourceEntry.priority,
      raw_payload: item.raw_payload || {},
    });
  }

  return { ok: true, id: data?.id };
}

export async function mergeSourceAttribution(admin, knowledgeItemId, sources) {
  if (!admin || !knowledgeItemId) return;
  await admin
    .from("knowledge_items")
    .update({
      source_attributions: sources,
      updated_at: new Date().toISOString(),
    })
    .eq("id", knowledgeItemId);
}
