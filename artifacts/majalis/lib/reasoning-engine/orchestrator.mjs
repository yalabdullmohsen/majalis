/**
 * Islamic Knowledge Reasoning Engine — orchestrator.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { logGovernanceEvent } from "../governance/audit.mjs";
import { runReasoningQuery } from "./answer.mjs";
import { runRelationInference } from "./inference.mjs";
import { scanReasoningQuality, autoFixQualityIssues } from "./quality.mjs";
import { getReasoningDashboard } from "./dashboard.mjs";
import { retrieveEvidence } from "./retrieve.mjs";
import { seedOfficialKnowledgeGraph } from "./knowledge-graph.mjs";

export async function runReasoningCycle(opts = {}) {
  const admin = getSupabaseAdmin();
  const started = Date.now();
  const result = {
    ok: true,
    at: new Date().toISOString(),
    inference: null,
    quality: null,
    auto_fix: null,
    duration_ms: 0,
    errors: [],
  };

  try {
    if (opts.inferRelations !== false) {
      result.inference = await runRelationInference(admin, {
        limit: opts.inferenceLimit ?? 150,
      });
    }

    if (opts.seedOfficialGraph !== false) {
      result.official_graph = await seedOfficialKnowledgeGraph(admin);
    }

    if (opts.qualityScan !== false) {
      result.quality = await scanReasoningQuality(admin, { limit: opts.qualityLimit ?? 100 });
    }

    if (opts.autoFix === true) {
      result.auto_fix = await autoFixQualityIssues(admin, {
        inferRelations: true,
        inferenceLimit: opts.inferenceLimit ?? 100,
      });
    }

    if (admin && opts.logRun !== false) {
      try {
        await admin.from("reasoning_inference_runs").insert({
          trigger_type: opts.trigger ?? "cron",
          relations_created: result.inference?.created ?? 0,
          entities_processed: result.inference?.processed ?? 0,
          issues_found: result.quality?.count ?? 0,
          duration_ms: Date.now() - started,
          status: result.errors.length ? "partial" : "completed",
          metadata: result,
          finished_at: new Date().toISOString(),
        });
      } catch {
        /* table may not exist */
      }
    }

    await logGovernanceEvent(admin, {
      action: "reasoning_engine_cycle",
      actor_id: opts.actorId ?? "system",
      outcome: result.errors.length ? "partial" : "success",
      metadata: {
        relations_created: result.inference?.created ?? 0,
          official_graph_nodes: result.official_graph?.nodes ?? 0,
          official_graph_edges: result.official_graph?.edges ?? 0,
        issues_found: result.quality?.count ?? 0,
        duration_ms: Date.now() - started,
      },
    });
  } catch (err) {
    result.ok = false;
    result.errors.push(String(err?.message || err));
  }

  result.duration_ms = Date.now() - started;
  return result;
}

export { runReasoningQuery, looksLikeIslamicKnowledgeQuery } from "./answer.mjs";
export { retrieveEvidence } from "./retrieve.mjs";
export { getReasoningDashboard, getTopLinkedEntities } from "./dashboard.mjs";
export { runRelationInference } from "./inference.mjs";
export { scanReasoningQuality, autoFixQualityIssues } from "./quality.mjs";
export { expandEvidenceGraph } from "./graph-expand.mjs";
export { seedOfficialKnowledgeGraph, materializeEvidenceGraph } from "./knowledge-graph.mjs";
export { buildCitationSet, validateCitation, normalizeCitation } from "./citation-engine.mjs";
