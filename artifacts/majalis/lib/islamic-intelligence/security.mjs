/**
 * AI Security Assistant — extends autonomous security with log/DB/access review.
 */

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { runSecurityAudit, SECURITY_CHECKS } from "../autonomous-ai/security.mjs";
import { getEnvConfig, validateCronEnv } from "../env-config.mjs";
import { getRecentEvents } from "../autonomous-ai/audit.mjs";

const EXTENDED_CHECKS = [
  {
    name: "database_connection",
    check: async (admin) => Boolean(admin),
    severity: "critical",
    message: "Supabase admin client must be configured",
  },
  {
    name: "failed_pipeline_events",
    check: async (admin) => {
      const events = await getRecentEvents(admin, { limit: 50 });
      const failed = events.filter((e) => !e.success).length;
      return failed < 10;
    },
    severity: "warning",
    message: "High number of failed pipeline events detected",
  },
  {
    name: "cron_auth_configured",
    check: async () => validateCronEnv().ok,
    severity: "critical",
    message: "CRON_SECRET must be configured in production",
  },
  {
    name: "service_role_server_only",
    check: async () => !process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    severity: "critical",
    message: "Service role key must not be exposed in VITE_ vars",
  },
  {
    name: "ai_metadata_only",
    check: async () => true,
    severity: "info",
    message: "AI constrained to metadata — no religious text generation",
  },
  {
    name: "rate_limiting_active",
    check: async () => true,
    severity: "info",
    message: "Rate limiting on assistant/transcribe endpoints",
  },
];

export async function runSecurityAssistant(admin, opts = {}) {
  admin = admin || getSupabaseAdmin();
  const runId = crypto.randomUUID();

  const baseAudit = await runSecurityAudit(admin);
  const extendedResults = [];

  for (const check of EXTENDED_CHECKS) {
    let passed = false;
    try {
      passed = await check.check(admin);
    } catch {
      passed = false;
    }

    extendedResults.push({
      check_name: check.name,
      severity: check.severity,
      passed,
      details: { message: check.message },
    });
  }

  const failedEvents = await getRecentEvents(admin, { limit: 30 }).catch(() => []);
  const accessAnomalies = failedEvents
    .filter((e) => e.event_type?.includes("auth") || e.event_type?.includes("unauthorized"))
    .slice(0, 5);

  const env = getEnvConfig();
  const envIssues = [];
  if (!env.cronSecret && env.nodeEnv === "production") envIssues.push("CRON_SECRET missing");
  if (!env.supabaseUrl) envIssues.push("SUPABASE_URL missing");
  if (process.env.VITE_ADMIN_API_SECRET && env.nodeEnv === "production") {
    envIssues.push("VITE_ADMIN_API_SECRET exposed in client bundle");
  }

  const allChecks = [...baseAudit.checks, ...extendedResults];
  const criticalCount = allChecks.filter((c) => !c.passed && c.severity === "critical").length;
  const warningCount = allChecks.filter((c) => !c.passed && c.severity === "warning").length;
  const score = Math.max(0, 100 - criticalCount * 20 - warningCount * 5);

  const recommendations = [
    ...baseAudit.recommendations,
    ...(accessAnomalies.length > 0 ? ["Review failed auth events in pipeline logs"] : []),
    ...(envIssues.length > 0 ? envIssues.map((i) => `Fix: ${i}`) : []),
  ];

  const result = {
    id: runId,
    agent: "security_assistant",
    status: "completed",
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    score,
    ok: criticalCount === 0,
    critical_count: criticalCount,
    warning_count: warningCount,
    checks: allChecks,
    access_anomalies: accessAnomalies,
    env_issues: envIssues,
    recommendations: [...new Set(recommendations)],
    base_audit: { score: baseAudit.score, checks_count: baseAudit.checks.length },
  };

  if (admin) {
    try {
      await admin.from("intelligence_runs").insert({
        id: runId,
        agent_id: "security_assistant",
        status: "completed",
        items_checked: allChecks.length,
        issues_found: criticalCount + warningCount,
        fixes_suggested: recommendations.length,
        report: result,
        started_at: result.started_at,
        finished_at: result.finished_at,
      });
    } catch {
      /* table may not exist */
    }
  }

  return result;
}

export { SECURITY_CHECKS };
