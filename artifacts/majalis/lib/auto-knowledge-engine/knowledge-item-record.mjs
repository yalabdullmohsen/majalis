/**
 * Build knowledge_items upsert payload — only columns that exist in production schema.
 */

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

export function buildKnowledgeItemRecord({
  connectorConfig,
  runId,
  item,
  gate,
  seo,
}) {
  return {
    source_id: connectorConfig.source_id || null,
    pipeline_run_id: runId,
    external_id: item.external_id,
    content_kind: item.content_kind,
    raw_url: item.raw_url,
    raw_title: item.raw_title,
    raw_body: item.raw_body,
    raw_payload: item.raw_payload || {},
    content_hash: item.verification.contentHash,
    source_attribution: item.source_attribution,
    source_url: item.raw_url,
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
