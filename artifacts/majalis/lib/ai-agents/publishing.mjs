/**
 * Publishing Agent — publishes ONLY content that passed verification and QA.
 * No religious content published without verified source.
 */

import { applyScholarlyGateToAutoContentRecord } from "../scholarly-verification/bridge.mjs";
import { MIN_TRUST_FOR_PUBLISH, MIN_QUALITY_FOR_PUBLISH } from "./config.mjs";
import { logAgentRun, logAgentError } from "./audit.mjs";

export async function runPublishingAgent(admin, opts = {}) {
  const started = Date.now();
  const result = {
    agent: "publishing",
    status: "running",
    published: 0,
    blocked: 0,
    needs_review: 0,
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
      .in("pipeline_stage", ["qa_passed", "source_verified", "knowledge_processed"])
      .eq("verification_status", "verified")
      .order("quality_score", { ascending: false })
      .limit(limit);

    for (const item of items || []) {
      const trustOk = (item.trust_level || 0) >= MIN_TRUST_FOR_PUBLISH;
      const qualityOk = (item.quality_score || 0) >= MIN_QUALITY_FOR_PUBLISH;
      const hasSource = Boolean(item.source_url || item.original_url || item.source_name);

      if (!hasSource || !trustOk) {
        result.blocked += 1;
        await admin.from("auto_imported_content").update({
          status: "needs_review",
          pipeline_stage: "publish_blocked",
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);
        continue;
      }

      const gate = await applyScholarlyGateToAutoContentRecord(admin, item);

      if (gate.status === "rejected") {
        result.blocked += 1;
        await admin.from("auto_imported_content").update({
          status: "rejected",
          verification_status: "rejected",
          pipeline_stage: "publish_rejected",
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);
        continue;
      }

      if (!qualityOk || gate.status === "needs_review") {
        result.needs_review += 1;
        await admin.from("auto_imported_content").update({
          status: "needs_review",
          pipeline_stage: "publish_pending_review",
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);
        continue;
      }

      await admin.from("auto_imported_content").update({
        status: "published",
        verification_status: "verified",
        pipeline_stage: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);

      try {
        await admin.from("publishing_history").insert({
          content_id: item.id,
          action: "auto_publish",
          actor: "publishing_agent",
          metadata: { trust_level: item.trust_level, quality_score: item.quality_score },
        });
      } catch {
        /* table may not exist */
      }

      result.published += 1;
    }

    result.status = "completed";
    result.duration_ms = Date.now() - started;

    await logAgentRun(admin, {
      agentId: "publishing",
      outcome: "success",
      metadata: {
        published: result.published,
        blocked: result.blocked,
        needs_review: result.needs_review,
      },
    });
  } catch (err) {
    result.status = "failed";
    result.errors.push(String(err.message || err));
    result.duration_ms = Date.now() - started;
    await logAgentError(admin, "publishing", err, result);
  }

  return result;
}
