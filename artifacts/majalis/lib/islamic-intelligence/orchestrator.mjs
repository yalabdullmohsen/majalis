/**
 * Islamic Intelligence Platform — main orchestrator.
 * Runs all 9 agents modularly; each agent is independently invokable.
 */

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { AGENTS, AGENT_IDS, HUMAN_REQUIRED, PERFORMANCE } from "./config.mjs";
import { runKnowledgeAuditor } from "./auditor.mjs";
import { runContentPlanner } from "./planner.mjs";
import { runKnowledgeDiscovery } from "./discovery.mjs";
import { runRelationshipBuilder } from "./relationships.mjs";
import { runQualityScoring } from "./quality.mjs";
import { runSecurityAssistant } from "./security.mjs";
import { runPerformanceOptimizer } from "./performance.mjs";
import { getIntelligenceAnalytics } from "./analytics.mjs";
import { generateWeeklyReport } from "./weekly-report.mjs";

const AGENT_RUNNERS = {
  knowledge_auditor: runKnowledgeAuditor,
  content_planner: runContentPlanner,
  knowledge_discovery: runKnowledgeDiscovery,
  relationship_builder: runRelationshipBuilder,
  quality_scorer: runQualityScoring,
  security_assistant: runSecurityAssistant,
  performance_optimizer: runPerformanceOptimizer,
  analytics: getIntelligenceAnalytics,
  weekly_report: generateWeeklyReport,
};

export async function runIntelligenceAgent(agentId, admin, opts = {}) {
  const runner = AGENT_RUNNERS[agentId];
  if (!runner) throw new Error(`Unknown agent: ${agentId}`);
  return runner(admin || getSupabaseAdmin(), opts);
}

export async function runIslamicIntelligencePlatform(opts = {}) {
  const admin = getSupabaseAdmin();
  const runId = crypto.randomUUID();
  const started = Date.now();
  const mode = opts.mode || "full";

  const agentsToRun =
    opts.agents ||
    (mode === "daily"
      ? ["knowledge_auditor", "quality_scorer", "analytics"]
      : mode === "weekly"
        ? ["knowledge_auditor", "content_planner", "quality_scorer", "security_assistant", "performance_optimizer", "analytics", "weekly_report"]
        : mode === "discovery"
          ? ["knowledge_discovery", "relationship_builder"]
          : AGENT_IDS);

  const summary = {
    id: runId,
    mode,
    status: "running",
    started_at: new Date().toISOString(),
    agents_run: [],
    agents_failed: [],
    results: {},
    duration_ms: 0,
  };

  for (const agentId of agentsToRun) {
    const agentMeta = AGENTS[agentId];
    const agentStarted = Date.now();

    try {
      const result = await runIntelligenceAgent(agentId, admin, opts);
      summary.agents_run.push(agentId);
      summary.results[agentId] = {
        ok: true,
        label: agentMeta?.label_ar || agentId,
        duration_ms: Date.now() - agentStarted,
        items_checked: result.items_checked || result.items_scored || result.items_processed || result.sources_scanned || 0,
        issues_found: result.issues_found || result.flagged_items?.length || 0,
      };
    } catch (error) {
      summary.agents_failed.push({ agent: agentId, error: error.message });
      summary.results[agentId] = { ok: false, error: error.message };
    }

    if (Date.now() - started > PERFORMANCE.maxDurationMs) {
      summary.truncated = true;
      break;
    }
  }

  summary.status = summary.agents_failed.length === 0 ? "completed" : "partial";
  summary.duration_ms = Date.now() - started;
  summary.finished_at = new Date().toISOString();
  summary.automation_pct = Math.round((summary.agents_run.length / AGENT_IDS.length) * 100);

  if (admin) {
    try {
      await admin.from("intelligence_runs").insert({
        id: runId,
        agent_id: "orchestrator",
        status: summary.status,
        items_checked: summary.agents_run.length,
        issues_found: summary.agents_failed.length,
        fixes_suggested: 0,
        report: { mode, agents_run: summary.agents_run, results: summary.results },
        started_at: summary.started_at,
        finished_at: summary.finished_at,
      });
    } catch {
      /* table may not exist */
    }
  }

  return summary;
}

export async function getIntelligenceStatus(admin) {
  admin = admin || getSupabaseAdmin();

  let recentRuns = [];
  let latestWeekly = null;

  if (admin) {
    try {
      const { data: runs } = await admin
        .from("intelligence_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10);
      recentRuns = runs || [];

      const { data: weekly } = await admin
        .from("intelligence_weekly_reports")
        .select("*")
        .order("period_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      latestWeekly = weekly;
    } catch {
      /* tables may not exist */
    }
  }

  const analytics = await getIntelligenceAnalytics(admin, { days: 7 }).catch(() => null);

  return {
    ok: true,
    at: new Date().toISOString(),
    agents: AGENTS,
    agent_count: AGENT_IDS.length,
    recent_runs: recentRuns,
    latest_weekly: latestWeekly,
    analytics,
    human_required: HUMAN_REQUIRED,
  };
}

export { AGENTS, AGENT_IDS, AGENT_RUNNERS, HUMAN_REQUIRED };
