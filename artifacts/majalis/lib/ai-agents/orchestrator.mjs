/**
 * AI Agents Orchestrator — runs the full agent pipeline in order.
 */

import crypto from "node:crypto";
import { AGENT_PIPELINE, AGENTS } from "./config.mjs";
import { runContentDiscoveryAgent } from "./content-discovery.mjs";
import { runSourceVerificationAgent } from "./source-verification.mjs";
import { runKnowledgeProcessingAgent } from "./knowledge-processing.mjs";
import { runQualityAssuranceAgent } from "./quality-assurance.mjs";
import { runPublishingAgent } from "./publishing.mjs";
import { runMonitoringAgent } from "./monitoring.mjs";
import { logAgentRun } from "./audit.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const RUNNERS = {
  content_discovery: runContentDiscoveryAgent,
  source_verification: runSourceVerificationAgent,
  knowledge_processing: runKnowledgeProcessingAgent,
  quality_assurance: runQualityAssuranceAgent,
  publishing: runPublishingAgent,
  monitoring: runMonitoringAgent,
};

export async function runAgent(admin, agentId, opts = {}) {
  const runner = RUNNERS[agentId];
  if (!runner) throw new Error(`Unknown agent: ${agentId}`);
  return runner(admin, opts);
}

export async function runAgentPipeline(admin, opts = {}) {
  admin = admin || getSupabaseAdmin();
  const runId = crypto.randomUUID();
  const started = Date.now();
  const agents = opts.agents || AGENT_PIPELINE;
  const results = {};

  await logAgentRun(admin, {
    agentId: "orchestrator",
    action: "agent.pipeline.start",
    outcome: "started",
    metadata: { run_id: runId, agents },
  });

  for (const agentId of agents) {
    if (agentId === "content_discovery" && opts.skipDiscovery) continue;
    try {
      results[agentId] = await runAgent(admin, agentId, opts);
      if (results[agentId]?.status === "failed" && opts.stopOnError) break;
    } catch (err) {
      results[agentId] = { status: "failed", error: String(err.message || err) };
      if (opts.stopOnError) break;
    }
  }

  const summary = {
    run_id: runId,
    status: Object.values(results).every((r) => r.status !== "failed") ? "completed" : "partial",
    duration_ms: Date.now() - started,
    agents_run: Object.keys(results).length,
    results,
  };

  await logAgentRun(admin, {
    agentId: "orchestrator",
    action: "agent.pipeline.complete",
    outcome: summary.status === "completed" ? "success" : "partial",
    metadata: { run_id: runId, agents_run: summary.agents_run, duration_ms: summary.duration_ms },
  });

  return summary;
}

export async function getAgentsDashboard(admin) {
  admin = admin || getSupabaseAdmin();
  const agents = Object.values(AGENTS).map((a) => ({
    ...a,
    last_run: null,
  }));

  if (admin) {
    try {
      const { data: logs } = await admin
        .from("governance_audit_log")
        .select("action, created_at, outcome, metadata")
        .like("action", "agent.%")
        .order("created_at", { ascending: false })
        .limit(50);

      for (const agent of agents) {
        const last = (logs || []).find((l) => l.metadata?.agent === agent.id || l.action === `agent.${agent.id}`);
        if (last) agent.last_run = last.created_at;
      }
    } catch {
      /* table may not exist */
    }
  }

  return { agents, pipeline: AGENT_PIPELINE };
}

export { AGENTS, AGENT_PIPELINE, RUNNERS };
