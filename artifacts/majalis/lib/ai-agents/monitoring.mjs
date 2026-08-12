/**
 * Monitoring Agent — monitors cron jobs, errors, performance, system health.
 */

import { getSystemHealth } from "../system-health.mjs";
import { getGovernanceMonitoring } from "../governance/monitoring.mjs";
import { logAgentRun, logAgentError } from "./audit.mjs";

export async function runMonitoringAgent(admin, opts = {}) {
  const started = Date.now();
  const result = {
    agent: "monitoring",
    status: "running",
    system_ok: false,
    cron_status: null,
    errors: [],
    alerts: [],
  };

  try {
    const [health, monitoring] = await Promise.all([
      getSystemHealth(),
      getGovernanceMonitoring(admin),
    ]);

    result.system_health = health;
    result.monitoring = monitoring;
    result.system_ok = health?.ok === true;
    result.cron_status = health?.cron?.status || monitoring?.cron_jobs?.status;

    if (!health?.ok) {
      result.alerts.push(...(health?.errors || []).slice(0, 5));
    }

    if (monitoring?.queue?.failed > 0) {
      result.alerts.push(`Queue failures: ${monitoring.queue.failed}`);
    }

    if (health?.database?.status === "error") {
      result.alerts.push("Database connection error");
    }

    if (!process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
      result.alerts.push("CRON_SECRET not configured");
    }

    result.status = result.alerts.length === 0 ? "completed" : "degraded";
    result.duration_ms = Date.now() - started;

    await logAgentRun(admin, {
      agentId: "monitoring",
      outcome: result.status === "completed" ? "success" : "partial",
      metadata: {
        system_ok: result.system_ok,
        alerts: result.alerts.length,
        cron_status: result.cron_status,
      },
    });
  } catch (err) {
    result.status = "failed";
    result.errors.push(String(err.message || err));
    result.duration_ms = Date.now() - started;
    await logAgentError(admin, "monitoring", err, result);
  }

  return result;
}
