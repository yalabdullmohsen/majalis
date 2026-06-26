/**
 * Knowledge Processing Agent — summarizes, classifies, extracts tags, links content.
 */

import {
  aiAnalyzeContent,
  calculateQualityScore,
  detectContentType,
  generateSeoMetadata,
} from "../auto-content/auto-content-utils.mjs";
import { logAgentRun, logAgentError } from "./audit.mjs";

export async function runKnowledgeProcessingAgent(admin, opts = {}) {
  const started = Date.now();
  const result = {
    agent: "knowledge_processing",
    status: "running",
    processed: 0,
    failed: 0,
    errors: [],
  };

  if (!admin) {
    result.status = "skipped";
    result.errors.push("no_admin");
    return result;
  }

  try {
    const limit = opts.limit || 30;
    const { data: items } = await admin
      .from("auto_imported_content")
      .select("*")
      .in("pipeline_stage", ["source_verified", "pending", "ai_processing"])
      .order("created_at", { ascending: false })
      .limit(limit);

    for (const item of items || []) {
      try {
        const contentType = detectContentType(item.title, item.summary || item.content || "");
        const analysis = await aiAnalyzeContent({
          title: item.title,
          summary: item.summary || "",
          content: item.content || item.summary || "",
          sourceName: item.source_name,
        });
        const seo = generateSeoMetadata(item.title, analysis.summary || item.summary);
        const qualityScore = calculateQualityScore({
          title: item.title,
          summary: analysis.summary || item.summary,
          tags: analysis.tags,
          sourceName: item.source_name,
          hasImage: Boolean(item.image_url),
        });

        await admin.from("auto_imported_content").update({
          content_type: contentType,
          summary: analysis.summary || item.summary,
          tags: analysis.tags || item.tags,
          category: analysis.category || item.category,
          seo_title: seo.title,
          seo_description: seo.description,
          quality_score: qualityScore,
          pipeline_stage: "knowledge_processed",
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);

        result.processed += 1;
      } catch (itemErr) {
        result.failed += 1;
        result.errors.push(`${item.id}: ${itemErr.message}`);
      }
    }

    result.status = "completed";
    result.duration_ms = Date.now() - started;

    await logAgentRun(admin, {
      agentId: "knowledge_processing",
      outcome: "success",
      metadata: { processed: result.processed, failed: result.failed },
    });
  } catch (err) {
    result.status = "failed";
    result.errors.push(String(err.message || err));
    result.duration_ms = Date.now() - started;
    await logAgentError(admin, "knowledge_processing", err, result);
  }

  return result;
}
