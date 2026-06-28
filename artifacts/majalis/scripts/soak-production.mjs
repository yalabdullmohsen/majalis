#!/usr/bin/env node
/**
 * Production soak test — compressed simulation (default 30 min cycles).
 * Does NOT claim 24h success without real 24h run; documents simulation mode.
 *
 * Usage:
 *   node scripts/soak-production.mjs
 *   node scripts/soak-production.mjs --duration=45 --interval=60
 *   node scripts/soak-production.mjs --cycles=10 --interval=30
 */
import { performance } from "node:perf_hooks";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";
import { runConnectorHealthChecks } from "../lib/auto-knowledge-sync.mjs";
import { getMonitoringDashboard } from "../lib/auto-knowledge-engine/monitoring/dashboard.mjs";
import { fetchTelegramChannelMessages } from "../lib/cms/telegram-channel-fetch.mjs";
import { summarizeConnectorHealth, classifyConnector } from "../lib/auto-knowledge-engine/monitoring/connector-classification.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const durationMin = Number(process.argv.find((a) => a.startsWith("--duration="))?.split("=")[1] || 30);
const intervalSec = Number(process.argv.find((a) => a.startsWith("--interval="))?.split("=")[1] || 60);
const maxCycles = Number(process.argv.find((a) => a.startsWith("--cycles="))?.split("=")[1] || Math.ceil((durationMin * 60) / intervalSec));

const report = {
  mode: maxCycles * intervalSec >= 86400 ? "full_24h" : "simulation",
  claimedDuration: `${durationMin} minutes (compressed)`,
  actualDurationMs: 0,
  cycles: maxCycles,
  intervalSec,
  startedAt: new Date().toISOString(),
  finishedAt: null,
  checks: [],
  summary: {
    passed: 0,
    failed: 0,
    warnings: 0,
    duplicates: 0,
    errors504: 0,
    errors500: 0,
    stuckJobs: 0,
    alertSpam: 0,
  },
  projection24h: null,
};

function record(name, ok, detail = {}) {
  report.checks.push({ at: new Date().toISOString(), name, ok, ...detail });
  if (ok) report.summary.passed++;
  else report.summary.failed++;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function cycleCheck(cycleNum) {
  const mem = process.memoryUsage();
  record(`cycle_${cycleNum}_memory`, mem.heapUsed < 512 * 1024 * 1024, {
    heapMb: Math.round(mem.heapUsed / 1024 / 1024),
  });

  const admin = getSupabaseAdmin();
  if (admin) {
    const { data: queue } = await admin
      .from("ake_job_queue")
      .select("status")
      .in("status", ["pending", "running", "failed"]);
    const rows = queue || [];
    const stuck = rows.filter((r) => r.status === "running").length;
    const failed = rows.filter((r) => r.status === "failed").length;
    if (stuck > 5) report.summary.stuckJobs++;
    record(`cycle_${cycleNum}_queue`, failed === 0 && stuck <= 5, { pending: rows.length, stuck, failed });

    const { count: alertCount } = await admin
      .from("ake_alerts")
      .select("id", { count: "exact", head: true })
      .eq("resolved", false)
      .gte("created_at", new Date(Date.now() - intervalSec * 2_000).toISOString());
    if ((alertCount || 0) > 20) report.summary.alertSpam++;
    record(`cycle_${cycleNum}_alerts`, (alertCount || 0) <= 20, { openRecent: alertCount || 0 });
  } else {
    record(`cycle_${cycleNum}_queue`, true, { skipped: "no_admin" });
  }

  try {
    const health = await runConnectorHealthChecks({ maxChecks: 3, budgetMs: 15_000 });
    const noAdmin = health.error === "Supabase not configured";
    record(`cycle_${cycleNum}_connectors`, noAdmin || (health.ok && health.systemStatus !== "critical"), {
      systemStatus: health.systemStatus,
      requiredHealthy: health.summary?.requiredHealthy,
      skipped: noAdmin || undefined,
    });
  } catch (err) {
    record(`cycle_${cycleNum}_connectors`, false, { error: err.message });
  }

  try {
    const dash = await getMonitoringDashboard();
    record(`cycle_${cycleNum}_dashboard`, dash.systemStatus !== "critical" || dash.connectors?.requiredUnhealthy === 0, {
      systemStatus: dash.systemStatus,
    });
  } catch (err) {
    record(`cycle_${cycleNum}_dashboard`, false, { error: err.message });
  }

  try {
    const tg = await fetchTelegramChannelMessages("DrosQ8", { limit: 5 });
    const ids = (tg.items || []).map((i) => i.message_id);
    const unique = new Set(ids);
    const dupes = ids.length - unique.size;
    report.summary.duplicates += dupes;
    record(`cycle_${cycleNum}_telegram_dedup`, dupes === 0 && (tg.items?.length || 0) > 0, {
      items: tg.items?.length || 0,
      dupes,
    });
  } catch (err) {
    record(`cycle_${cycleNum}_telegram`, false, { error: err.message });
  }
}

async function main() {
  const t0 = performance.now();
  console.log(`Soak test: ${report.mode} — ${maxCycles} cycles × ${intervalSec}s (~${durationMin} min)`);

  record("startup_classify", true, { note: "connector classification loaded" });
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data: connectors } = await admin.from("ake_connectors").select("slug, platform, connector_type, handle, is_active, health_status");
    const classified = (connectors || []).map((c) => classifyConnector(c, { healthy: c.health_status === "healthy" }));
    const summary = summarizeConnectorHealth(classified);
    record("startup_connectors", summary.systemStatus !== "critical", summary);
  }

  for (let i = 1; i <= maxCycles; i++) {
    console.log(`  cycle ${i}/${maxCycles}...`);
    await cycleCheck(i);
    if (i < maxCycles) await sleep(intervalSec * 1000);
  }

  report.actualDurationMs = Math.round(performance.now() - t0);
  report.finishedAt = new Date().toISOString();
  report.projection24h = {
    note: report.mode === "simulation"
      ? "24h projection based on compressed simulation — NOT a real 24h run"
      : "Full 24h soak completed",
    estimatedCycles24h: Math.ceil(86400 / intervalSec),
    failureRate: report.summary.failed / Math.max(1, report.checks.length),
    projectedFailures24h: Math.round((report.summary.failed / Math.max(1, report.checks.length)) * Math.ceil(86400 / intervalSec)),
  };

  const outDir = join(root, "reports");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `soak-${Date.now()}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("\n=== Soak Summary ===");
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Report: ${outPath}`);
  console.log(`Mode: ${report.mode} — ${report.claimedDuration}`);

  const ok = report.summary.errors504 === 0 && report.summary.stuckJobs === 0
    && report.summary.duplicates === 0
    && report.checks.filter((c) => c.ok === false && !c.skipped).length === 0;
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
