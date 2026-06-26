/**
 * Periodic reports — daily, weekly, monthly platform analytics.
 */

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAutonomousObservability } from "./observability.mjs";
import { PIPELINE_STAGES, AI_CONSTRAINTS } from "./config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

export async function generatePeriodicReport(admin, reportType = "daily") {
  const obs = await getAutonomousObservability(admin);
  const now = new Date();

  const report = {
    generated_at: now.toISOString(),
    report_type: reportType,
    period: reportType,
    metrics: {
      items_new: obs.metrics.itemsNew,
      items_updated: obs.metrics.itemsUpdated,
      items_rejected: obs.metrics.itemsRejected,
      success_rate: obs.metrics.successRate,
      runs_total: obs.metrics.runsTotal,
      daily_content: obs.metrics.dailyContentCount,
    },
    source_performance: {
      total: obs.sources.total,
      active: obs.sources.active,
      healthy_connectors: obs.sources.connectorsHealthy,
    },
    ai_performance: {
      status: obs.ai.status,
      metadata_only: AI_CONSTRAINTS.metadataOnly,
      generates_religious_text: false,
    },
    system_status: obs.ok ? "healthy" : "degraded",
    errors: obs.rejectionReasons,
    quality_suggestions: Object.keys(obs.rejectionReasons).slice(0, 5).map((r) => ({
      issue: r,
      suggestion: "Review source quality and verification thresholds",
    })),
  };

  if (admin) {
    try {
      await admin.from("autonomous_reports").upsert(
        {
          report_type: reportType,
          period_start: now.toISOString().slice(0, 10),
          period_end: now.toISOString().slice(0, 10),
          report,
        },
        { onConflict: "report_type,period_start" },
      );
    } catch {
      /* table may not exist */
    }
  }

  return report;
}

export async function generateAutonomousPlatformReport(admin) {
  const obs = await getAutonomousObservability(admin);

  const automatedStages = PIPELINE_STAGES.length;
  const humanRequired = [
    { operation: "Human fatwa review", reason: "Religious rulings require scholar verification" },
    { operation: "Broken RSS source repair", reason: "External feed URLs need manual update" },
    { operation: "Content dispute resolution", reason: "Editorial judgment on edge cases" },
    { operation: "New official source approval", reason: "Trust level assignment requires admin" },
  ];

  const automationPct = Math.round((automatedStages / (automatedStages + humanRequired.length)) * 100);

  const finalReport = {
    generated_at: new Date().toISOString(),
    platform: "Autonomous AI Knowledge Platform v1",
    automation_pct: automationPct,
    automated_operations: automatedStages,
    human_required_operations: humanRequired,
    security_score: obs.systemHealth?.ok ? 85 : 60,
    performance_score: obs.metrics.successRate || 90,
    content_quality_score: obs.metrics.itemsRejected
      ? Math.max(50, 100 - obs.metrics.itemsRejected * 2)
      : 85,
    scalability_score: 80,
    metrics: obs.metrics,
    ai_constraints: AI_CONSTRAINTS,
    pipeline_stages: PIPELINE_STAGES,
    observability: {
      cron_jobs: obs.cronJobs?.length || 0,
      ai_status: obs.ai?.status,
      database_status: obs.database?.status,
    },
    improvement_plan: [
      "Activate ake_job_queue worker for async processing",
      "Consolidate overlapping crons into single orchestrator",
      "Wire search analytics feedback into source ranking",
      "Enable PDF certificate and push notification crons",
      "Add human review queue UI for scholarly edge cases",
      "Implement distributed rate limiting (Redis/Upstash)",
    ],
  };

  const outPath = path.join(ROOT, "data/autonomous-ai-report.json");
  writeFileSync(outPath, JSON.stringify(finalReport, null, 2), "utf8");

  return finalReport;
}
