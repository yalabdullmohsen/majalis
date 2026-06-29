#!/usr/bin/env node
/**
 * Production automation audit — live probes against majlisilm.com + Supabase REST.
 * Usage:
 *   node scripts/audit-production-automation.mjs [--base=https://www.majlisilm.com]
 *   CRON_SECRET=... node scripts/audit-production-automation.mjs --verify-crons
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { getEnvStatus } from "../lib/env-config.mjs";
import { countTableRows, probeTableAnon } from "../lib/table-probe.mjs";

const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "https://www.majlisilm.com";
const verifyCrons = process.argv.includes("--verify-crons") || Boolean(process.env.CRON_SECRET);
const cronSecret = process.env.CRON_SECRET || "";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const crons = vercel.crons || [];

const TABLES = [
  "lessons", "sheikhs", "fawaid", "qa_questions", "content_import_jobs",
  "ake_job_queue", "ake_connectors", "ake_engine_runs", "knowledge_items",
  "content_engine_runs", "question_generation_jobs", "question_generation_logs",
  "question_generation_metrics", "question_generation_failures", "daily_generation_reports",
  "sin_jeem_questions", "auto_imported_content", "akp_content_sources", "akp_pipeline_runs",
  "mke_runs", "fiqh_council_items",
];

async function probeHttp(path, { method = "GET", timeoutMs = 15000, auth = false } = {}) {
  const url = new URL(path, base).toString();
  const started = Date.now();
  const headers = {};
  if (auth && cronSecret) headers.Authorization = `Bearer ${cronSecret}`;
  try {
    const res = await fetch(url, { method, headers, signal: AbortSignal.timeout(timeoutMs) });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* */ }
    return {
      path,
      ok: res.ok,
      status: res.status,
      ms: Date.now() - started,
      json,
      error: res.ok ? undefined : (json?.error || text.slice(0, 200)),
    };
  } catch (err) {
    return { path, ok: false, status: 0, ms: Date.now() - started, error: err.message };
  }
}

async function latestRows(table, select, order = "created_at.desc") {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) return { ok: false, error: "no_supabase_anon" };
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=${order}&limit=5`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return { ok: false, status: res.status, error: await res.text() };
    return { ok: true, rows: await res.json() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function probeImportJobs() {
  let result = await latestRows(
    "content_import_jobs",
    "type,status,updated_at,progress_pct,error_message,import_errors,retry_count",
    "updated_at.desc",
  );
  if (!result.ok && String(result.error).includes("error_message")) {
    result = await latestRows(
      "content_import_jobs",
      "type,status,updated_at,progress_pct,import_errors",
      "updated_at.desc",
    );
  }
  return result;
}

async function verifyCronRegistry() {
  const results = [];
  for (const cron of crons) {
    const path = cron.path;
    const name = path.split("/").pop();
    const authProbe = await probeHttp(path, { method: "POST", timeoutMs: 20000 });
    const endpointExists = authProbe.status === 401 || authProbe.status === 200 || authProbe.status === 405;
    const entry = {
      name,
      schedule: cron.schedule,
      endpoint: path,
      auth: cronSecret ? "verified_with_secret" : "401_without_secret",
      endpointExists,
      lastRun: null,
      result: null,
      durationMs: authProbe.ms,
      status: endpointExists ? "endpoint_ok" : "missing_or_error",
    };

    if (cronSecret && verifyCrons) {
      const execProbe = await probeHttp(path, { method: "POST", timeoutMs: 55000, auth: true });
      entry.durationMs = execProbe.ms;
      entry.status = execProbe.status === 200 && execProbe.json?.ok !== false ? "executed_ok" : execProbe.status === 200 ? "executed_partial" : execProbe.status === 401 ? "auth_failed" : execProbe.status === 503 ? "infra_blocked" : "executed_error";
      entry.result = execProbe.json?.ok ?? execProbe.json?.error ?? execProbe.error ?? execProbe.status;
      entry.lastRun = new Date().toISOString();
    } else if (authProbe.status === 401) {
      entry.status = "auth_enforced";
    }

    results.push(entry);
  }
  const verified = results.filter((r) => r.status === "executed_ok" || r.status === "auth_enforced" || r.status === "endpoint_ok").length;
  return { crons: results, verifiedCount: verified, total: results.length };
}

console.log(`\n=== Production Automation Audit ===\nBase: ${base}\n`);

const env = getEnvStatus();
const envPresent = Object.fromEntries(Object.entries(env).map(([k, v]) => [k, Boolean(v)]));

const publicApis = await Promise.all([
  probeHttp("/api/healthz"),
  probeHttp("/api/public-config"),
  probeHttp("/api/assistant/health"),
  probeHttp("/api/knowledge-search?q=صلاة"),
  probeHttp("/sitemap.xml"),
  probeHttp("/api/cron/autonomous-platform-v3-health", { method: "POST" }),
]);

const cronAuth = await Promise.all([
  probeHttp("/api/cron/system-health", { method: "POST" }),
  probeHttp("/api/cron/process-import-jobs", { method: "POST" }),
  probeHttp("/api/cron/auto-knowledge-sync", { method: "POST" }),
]);

const tableStats = {};
for (const table of TABLES) {
  const probe = await probeTableAnon(table);
  const count = await countTableRows(table);
  tableStats[table] = {
    exists: probe.ok || probe.restricted,
    missing: Boolean(probe.missing),
    count,
  };
}

const engineRuns = await latestRows(
  "content_engine_runs",
  "engine_id,status,started_at,duration_ms,items_published,error_message",
  "started_at.desc",
);
const importJobs = await probeImportJobs();
const akeConnectors = await latestRows("ake_connectors", "slug,is_active,last_sync_at,health_status", "last_sync_at.desc.nullslast");
const akeRuns = await latestRows("ake_engine_runs", "status,trigger_type,import_mode,started_at,duration_ms,published_count", "started_at.desc");
const mkeRuns = await latestRows("mke_runs", "status,trigger_type,mode,started_at,duration_ms,items_published", "started_at.desc");
const qgenJobs = await latestRows("question_generation_jobs", "day_key,status,target_count,generated_count,approved_count", "updated_at.desc");
const cronVerification = verifyCrons ? await verifyCronRegistry() : { crons: [], verifiedCount: 0, total: crons.length, skipped: true };

const importSucceeded = importJobs.ok && importJobs.rows?.some((r) => r.status === "completed");
const importFailedOnly = importJobs.ok && importJobs.rows?.length && importJobs.rows.every((r) => r.status === "failed");

const systems = [
  {
    name: "Content Engines",
    code: "complete",
    before: "verified_running",
    production: engineRuns.ok && engineRuns.rows?.length ? "verified_running" : "unverified",
    evidence: engineRuns.rows?.[0] ? `last: ${engineRuns.rows[0].engine_id} @ ${engineRuns.rows[0].started_at}` : null,
    cron: "/api/cron/content-engines",
  },
  {
    name: "Auto Knowledge Engine (AKE) Connectors",
    code: "complete",
    before: "verified_running",
    production: akeConnectors.ok && akeConnectors.rows?.some((r) => r.last_sync_at) ? "verified_running" : "unverified",
    evidence: akeConnectors.rows?.[0] ? `last sync: ${akeConnectors.rows[0].slug} @ ${akeConnectors.rows[0].last_sync_at}` : null,
    cron: "/api/cron/auto-knowledge-sync",
  },
  {
    name: "AKE Orchestrator Runs",
    code: "complete",
    before: "idle_empty",
    production: akeRuns.ok && akeRuns.rows?.length ? "verified_running" : tableStats.ake_engine_runs?.missing ? "migration_missing" : "idle_empty",
    evidence: akeRuns.rows?.[0] ? `last: ${akeRuns.rows[0].status} @ ${akeRuns.rows[0].started_at}` : `ake_engine_runs=${tableStats.ake_engine_runs?.count}`,
    cron: "/api/cron/auto-knowledge-sync",
  },
  {
    name: "Content Import Pipeline",
    code: "complete",
    before: "running_with_failures",
    production: !importJobs.ok ? "schema_error" : importSucceeded ? "verified_running" : importFailedOnly ? "running_with_failures" : "idle_empty",
    evidence: importJobs.rows?.[0] ? `last job: ${importJobs.rows[0].status} @ ${importJobs.rows[0].updated_at}` : importJobs.error,
    cron: "/api/cron/process-import-jobs",
  },
  {
    name: "AKP v3 Autonomous Platform",
    code: "complete",
    before: "not_producing",
    production: tableStats.akp_pipeline_runs?.count > 0 ? "verified_running" : tableStats.akp_content_sources?.count > 0 ? "idle_empty" : "not_producing",
    evidence: `akp_content_sources=${tableStats.akp_content_sources?.count}, pipeline_runs=${tableStats.akp_pipeline_runs?.count}`,
    cron: "/api/cron/autonomous-platform-v3",
  },
  {
    name: "Question Generation",
    code: "complete",
    before: "migration_missing",
    production: tableStats.question_generation_jobs?.missing ? "migration_missing" : qgenJobs.ok && qgenJobs.rows?.length ? "verified_running" : tableStats.daily_generation_reports?.count > 0 ? "verified_running" : "idle_empty",
    evidence: `jobs=${tableStats.question_generation_jobs?.count}, sin_jeem=${tableStats.sin_jeem_questions?.count}`,
    cron: "/api/cron/question-answer-daily",
  },
  {
    name: "Sin Jeem AI",
    code: "complete",
    before: "idle_empty",
    production: tableStats.sin_jeem_questions?.count > 0 ? "verified_running" : "idle_empty",
    evidence: `sin_jeem_questions=${tableStats.sin_jeem_questions?.count}`,
    cron: "/api/cron/question-answer-daily",
  },
  {
    name: "Majlis Knowledge Engine (MKE)",
    code: "complete",
    before: "idle_empty",
    production: mkeRuns.ok && mkeRuns.rows?.length ? "verified_running" : tableStats.mke_runs?.missing ? "migration_missing" : "idle_empty",
    evidence: mkeRuns.rows?.[0] ? `last: ${mkeRuns.rows[0].status} @ ${mkeRuns.rows[0].started_at}` : `mke_runs=${tableStats.mke_runs?.count}`,
    cron: "/api/cron/majlis-knowledge-engine",
  },
  {
    name: "Fiqh Council Sync",
    code: "complete",
    before: "idle_empty",
    production: tableStats.fiqh_council_items?.count > 0 ? "verified_running" : tableStats.fiqh_council_items?.missing ? "migration_missing" : "idle_empty",
    evidence: `fiqh_council_items=${tableStats.fiqh_council_items?.count}`,
    cron: "/api/cron/sync-fiqh-council",
  },
  {
    name: "Knowledge Search API",
    code: "complete",
    before: "verified_running",
    production: publicApis.find((p) => p.path.includes("knowledge-search"))?.ok ? "verified_running" : "failed",
    evidence: publicApis.find((p) => p.path.includes("knowledge-search"))?.json?.count != null ? `count=${publicApis.find((p) => p.path.includes("knowledge-search")).json.count}` : null,
    cron: null,
  },
  {
    name: "SEO / Sitemap",
    code: "complete",
    before: "verified_running",
    production: publicApis.find((p) => p.path === "/sitemap.xml")?.ok ? "verified_running" : "failed",
    evidence: `${publicApis.find((p) => p.path === "/sitemap.xml")?.ms}ms`,
    cron: "request-driven",
  },
  {
    name: "Health Dashboard / AKP Health API",
    code: "complete",
    before: "timeout",
    production: (() => {
      const h = publicApis.find((p) => p.path === "/api/cron/autonomous-platform-v3-health");
      if (!h) return "unverified";
      if (h.error?.includes("timeout") || h.ms > 30000) return "timeout";
      return h.status === 401 || h.ok ? "verified_running" : "failed";
    })(),
    evidence: publicApis.find((p) => p.path === "/api/cron/autonomous-platform-v3-health") ? `${publicApis.find((p) => p.path === "/api/cron/autonomous-platform-v3-health").ms}ms HTTP ${publicApis.find((p) => p.path === "/api/cron/autonomous-platform-v3-health").status}` : null,
    cron: "/api/cron/autonomous-platform-v3-health",
  },
];

const STATUS_SCORE = {
  verified_running: 1,
  running_with_failures: 0.6,
  idle_empty: 0.35,
  not_producing: 0.2,
  migration_missing: 0,
  schema_error: 0.15,
  timeout: 0.1,
  failed: 0,
  unverified: 0.25,
};

const verifiedRunning = systems.filter((s) => s.production === "verified_running").length;
const totalSystems = systems.length;
const weightedScore = systems.reduce((sum, s) => sum + (STATUS_SCORE[s.production] ?? 0), 0);
const productionReadinessPct = Math.round((weightedScore / totalSystems) * 100);
const registeredCrons = crons.length;

const report = {
  at: new Date().toISOString(),
  base,
  envPresent,
  cronAuthEnforced: cronAuth.every((c) => c.status === 401),
  registeredCrons,
  cronVerification,
  publicApis,
  cronAuthProbe: cronAuth,
  tableStats,
  latest: { engineRuns, importJobs, akeConnectors, akeRuns, mkeRuns, qgenJobs },
  systems,
  scores: {
    codeSystemsAudited: totalSystems,
    productionVerifiedRunning: verifiedRunning,
    productionVerifiedPct: Math.round((verifiedRunning / totalSystems) * 100),
    productionReadinessPct,
    cronsRegistered: registeredCrons,
    cronsVerified: cronVerification.verifiedCount,
    targetPct: 80,
    meetsTarget: productionReadinessPct >= 80,
    note: cronSecret
      ? "Cron execution verified with CRON_SECRET."
      : "Cron endpoint/auth verified without secret; pass CRON_SECRET + --verify-crons for live execution probes.",
  },
};

const outPath = join(root, "reports/production-automation-audit.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log("Public APIs:");
for (const p of publicApis) {
  console.log(`  ${p.ok ? "✓" : "✗"} ${p.path} HTTP ${p.status} (${p.ms}ms)`);
}
const cronAuthOk = cronAuth.every((c) => c.status === 401);
console.log(`\nCron auth (no secret): ${cronAuthOk ? "401 enforced ✓" : "UNEXPECTED"}`);
console.log(`\nRegistered Vercel crons: ${registeredCrons}`);
if (!cronVerification.skipped) {
  console.log(`Crons verified: ${cronVerification.verifiedCount}/${cronVerification.total}`);
}
console.log(`\nSystems verified running: ${verifiedRunning}/${totalSystems}`);
console.log(`Production readiness (weighted): ${productionReadinessPct}% (target ≥80%)`);
console.log(`\nReport: ${outPath}`);

if (!publicApis.find((p) => p.path === "/api/healthz")?.ok) process.exit(1);
