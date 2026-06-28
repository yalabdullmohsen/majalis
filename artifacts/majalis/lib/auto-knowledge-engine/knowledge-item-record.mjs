/**
 * Build knowledge_items upsert payload — only columns that exist in production schema.
 */

import { extractSourcePublishedAt } from "./sync-window.mjs";

const ANALYSIS_COLUMNS = [
  "ai_title",
  "ai_summary",
  "ai_keywords",
  "ai_category",
  "ai_country",
  "ai_scholar",
  "ai_language",
  "ai_topic",
  "ai_verse_refs",
  "ai_hadith_refs",
];

export function pickAnalysisFields(analysis = {}) {
  const picked = {};
  for (const key of ANALYSIS_COLUMNS) {
    if (analysis[key] !== undefined && analysis[key] !== null) {
      picked[key] = analysis[key];
    }
  }
  return picked;
}

export function analysisFromKnowledgeRow(row = {}) {
  return {
    ai_title: row.ai_title,
    ai_summary: row.ai_summary,
    ai_keywords: row.ai_keywords,
    ai_category: row.ai_category,
    ai_country: row.ai_country,
    ai_scholar: row.ai_scholar,
    ai_language: row.ai_language || "ar",
    ai_topic: row.ai_topic,
    ai_verse_refs: row.ai_verse_refs,
    ai_hadith_refs: row.ai_hadith_refs,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    ai_confidence: 62,
    needs_human_review: false,
  };
}

export function buildKnowledgeItemRecord({
  connectorConfig,
  runId,
  item,
  gate,
  seo,
  importMode,
}) {
  const sourcePublished = extractSourcePublishedAt(item);
  const now = new Date().toISOString();

  return {
    source_id: connectorConfig.source_id || null,
    pipeline_run_id: null,
    sync_run_id: runId || null,
    external_id: item.external_id,
    content_kind: item.content_kind,
    raw_url: item.raw_url,
    raw_title: item.raw_title,
    raw_body: item.raw_body,
    raw_payload: item.raw_payload || {},
    content_hash: item.verification.contentHash,
    source_attribution: item.source_attribution,
    source_url: item.raw_url,
    original_url: item.raw_url || item.source_url || null,
    source_published_at: sourcePublished ? sourcePublished.toISOString() : null,
    imported_at: now,
    import_mode: importMode || null,
    ...pickAnalysisFields(item.analysis),
    seo_title: seo.title,
    seo_description: seo.description,
    og_description: seo.og_description,
    twitter_description: seo.twitter_description,
    structured_data: seo.json_ld,
    quality_score: gate.quality_score,
    completeness_score: gate.completeness_score,
    trust_score: item.verification.trustScore,
    verification_status: gate.verificationStatus,
    publish_status: "pending",
    pipeline_stage: gate.autoPublish && gate.canPublish ? "verified" : "analyzed",
    duplicate_of: item.verification.duplicateOf,
    duplicate_score: item.verification.duplicateScore,
    rejection_reason: item.analysis?.review_reason || null,
    version: 1,
    updated_at: new Date().toISOString(),
  };
}
