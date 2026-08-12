/**
 * Enterprise Governance — main orchestrator.
 */

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getGovernanceMonitoring } from "./monitoring.mjs";
import { getQualityMetrics } from "./quality.mjs";
import { runGovernanceSecurityAudit } from "./security.mjs";
import { runBackupCheck } from "./backup.mjs";
import { getAuditTrail } from "./audit.mjs";
import { getReviewQueue } from "./review.mjs";
import { logGovernanceEvent } from "./audit.mjs";

export async function getGovernanceDashboard(admin) {
  admin = admin || getSupabaseAdmin();

  const [monitoring, quality, audit, reviewQueue, backupHistory] = await Promise.all([
    getGovernanceMonitoring(admin),
    getQualityMetrics(admin),
    getAuditTrail(admin, { limit: 10 }),
    getReviewQueue(admin, { limit: 10 }),
    admin
      ? import("./backup.mjs").then((m) => m.getBackupHistory(admin, 3)).catch(() => [])
      : [],
  ]);

  return {
    ok: true,
    at: new Date().toISOString(),
    monitoring,
    quality,
    recent_audit: audit,
    review_queue: reviewQueue,
    backup_history: backupHistory,
  };
}

export async function runGovernanceCycle(admin, opts = {}) {
  admin = admin || getSupabaseAdmin();
  const runId = crypto.randomUUID();
  const started = Date.now();

  const results = {};

  if (opts.security !== false) {
    results.security = await runGovernanceSecurityAudit(admin, { actor_id: "system" });
  }

  if (opts.backup) {
    results.backup = await runBackupCheck(admin, { exportSamples: true });
  }

  if (opts.quality !== false) {
    results.quality = await getQualityMetrics(admin);
  }

  results.monitoring = await getGovernanceMonitoring(admin);

  await logGovernanceEvent(admin, {
    action: "cron_run",
    actor_id: "system",
    metadata: { cycle: "governance", run_id: runId, duration_ms: Date.now() - started },
  });

  return {
    ok: true,
    run_id: runId,
    duration_ms: Date.now() - started,
    results,
  };
}

export { getGovernanceDashboard as default };
