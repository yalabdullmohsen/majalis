#!/usr/bin/env node
/**
 * Production automation audit — live probes against majlisilm.com + Supabase REST.
 * Usage: node scripts/audit-production-automation.mjs [--base=https://www.majlisilm.com]
 *
 * Does NOT assume crons work without evidence. Marks unverified items explicitly.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { getEnvStatus } from "../lib/env-config.mjs";
import { countTableRows, probeTableAnon } from "../lib/table-probe.mjs";

const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "https://www.majlisilm.com";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const crons = vercel.crons || [];

const TABLES = [
  "lessons", "sheikhs", "fawaid", "qa_questions", "content_import_jobs",
  "ake_job_queue", "ake_connectors", "ake_engine_runs", "knowledge_items",
  "content_engine_runs", "question_generation_jobs", "sin_jeem_questions",
  "auto_imported_content", "akp_content_sources", "akp_pipeline_runs", "mke_runs",
];

async function probeHttp(path, { method = "GET", timeoutMs = 15000 } = {}) {
  const url = new URL(path, base).toString();
  const started = Date.now();
  try {
    const res = await fetch(url, { method, signal: AbortSignal.timeout(timeoutMs) });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* */ }
    return { path, ok: res.ok, status: res.status, ms: Date.now() - started, json: json?.ok != null ? { ok: json.ok } : null };
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

console.log(`\n=== Production Automation Audit ===\nBase: ${base}\n`);

const env = getEnvStatus();
const envPresent = Object.fromEntries(Object.entries(env).map(([k, v]) => [k, Boolean(v)]));

const publicApis = await Promise.all([
  probeHttp("/api/healthz"),
  probeHttp("/api/public-config"),
  probeHttp("/api/assistant/health"),
  probeHttp("/api/knowledge-search?q=صلاة"),
  probeHttp("/sitemap.xml"),
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
const importJobs = await latestRows("content_import_jobs", "type,status,updated_at,progress_pct,error_message", "updated_at.desc");
const akeConnectors = await latestRows("ake_connectors", "slug,is_active,last_sync_at,health_status", "last_sync_at.desc.nullslast");

const systems = [
  {
    name: "Content Engines",
    code: "complete",
    production: engineRuns.ok && engineRuns.rows?.length ? "verified_running" : "unverified",
    evidence: engineRuns.rows?.[0] ? `last: ${engineRuns.rows[0].engine_id} @ ${engineRuns.rows[0].started_at}` : null,
    cron: "/api/cron/content-engines",
  },
  {
    name: "Auto Knowledge Engine (AKE)",
    code: "complete",
    production: akeConnectors.ok && akeConnectors.rows?.some((r) => r.last_sync_at) ? "verified_running" : "unverified",
    evidence: akeConnectors.rows?.[0] ? `last sync: ${akeConnectors.rows[0].slug} @ ${akeConnectors.rows[0].last_sync_at}` : null,
    cron: "/api/cron/auto-knowledge-sync",
  },
  {
    name: "Content Import Pipeline",
    code: "complete",
    production: importJobs.ok ? (importJobs.rows?.[0]?.status === "failed" ? "running_with_failures" : "verified_running") : "unverified",
    evidence: importJobs.rows?.[0] ? `last job: ${importJobs.rows[0].status} @ ${importJobs.rows[0].updated_at}` : null,
    cron: "/api/cron/process-import-jobs",
  },
  {
    name: "AKP v3 Autonomous Platform",
    code: "complete",
    production: tableStats.akp_pipeline_runs?.count > 0 ? "verified_running" : "not_producing",
    evidence: `akp_content_sources=${tableStats.akp_content_sources?.count}, pipeline_runs=${tableStats.akp_pipeline_runs?.count}`,
    cron: "/api/cron/autonomous-platform-v3",
  },
  {
    name: "Question Generation (Sin Jeem)",
    code: "complete",
    production: tableStats.question_generation_jobs?.missing ? "migration_missing" : tableStats.sin_jeem_questions?.count > 0 ? "verified_running" : "idle_empty",
    evidence: `sin_jeem_questions=${tableStats.sin_jeem_questions?.count}`,
    cron: "/api/cron/question-answer-daily",
  },
  {
    name: "Majlis Knowledge Engine (MKE)",
    code: "complete",
    production: tableStats.mke_runs?.count > 0 ? "verified_running" : "idle_empty",
    evidence: `mke_runs=${tableStats.mke_runs?.count}`,
    cron: "/api/cron/majlis-knowledge-engine",
  },
  {
    name: "Knowledge Search API",
    code: "complete",
    production: publicApis.find((p) => p.path.includes("knowledge-search"))?.ok ? "verified_running" : "failed",
    evidence: publicApis.find((p) => p.path.includes("knowledge-search"))?.json?.count != null ? `count=${publicApis.find((p) => p.path.includes("knowledge-search")).json.count}` : null,
    cron: null,
  },
  {
    name: "SEO / Sitemap",
    code: "complete",
    production: publicApis.find((p) => p.path === "/sitemap.xml")?.ok ? "verified_running" : "failed",
    evidence: `${publicApis.find((p) => p.path === "/sitemap.xml")?.ms}ms`,
    cron: "request-driven",
  },
];

const verifiedRunning = systems.filter((s) => s.production === "verified_running").length;
const totalSystems = systems.length;
const registeredCrons = crons.length;

const report = {
  at: new Date().toISOString(),
  base,
  envPresent,
  cronAuthEnforced: cronAuth.every((c) => c.status === 401),
  registeredCrons,
  publicApis,
  cronAuthProbe: cronAuth,
  tableStats,
  latest: { engineRuns, importJobs, akeConnectors },
  systems,
  scores: {
    codeSystemsAudited: totalSystems,
    productionVerifiedRunning: verifiedRunning,
    productionVerifiedPct: Math.round((verifiedRunning / totalSystems) * 100),
    cronsRegistered: registeredCrons,
    note: "Cron execution inferred from DB activity + HTTP auth probes; individual cron last-run not verified without CRON_SECRET or Vercel logs.",
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
console.log(`\nSystems sampled: ${verifiedRunning}/${totalSystems} verified running in production`);
console.log(`\nReport: ${outPath}`);

if (!publicApis.find((p) => p.path === "/api/healthz")?.ok) process.exit(1);
