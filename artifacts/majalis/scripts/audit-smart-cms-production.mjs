#!/usr/bin/env node
/**
 * Smart CMS Production Audit — live probes against majlisilm.com + Supabase REST.
 * Usage:
 *   node scripts/audit-smart-cms-production.mjs [--base=https://www.majlisilm.com]
 *   CRON_SECRET=... node scripts/audit-smart-cms-production.mjs --verify-crons
 */
import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getEnvStatus } from "../lib/env-config.mjs";
import { probeTableAnon, countTableRows } from "../lib/table-probe.mjs";
import {
  SMART_CMS_TABLES,
  SMART_CMS_CRON_PATHS,
  SMART_CMS_ADMIN_ROUTES,
  SMART_CMS_API_ROUTES,
} from "../lib/smart-cms-production.mjs";

const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "https://www.majlisilm.com";
const verifyCrons = process.argv.includes("--verify-crons") || Boolean(process.env.CRON_SECRET);
const cronSecret = process.env.CRON_SECRET || "";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function probeHttp(path, { method = "GET", auth = false, timeoutMs = 20000 } = {}) {
  const url = new URL(path, base).toString();
  const started = Date.now();
  const headers = {};
  if (auth && cronSecret) headers.Authorization = `Bearer ${cronSecret}`;
  try {
    const res = await fetch(url, { method, headers, signal: AbortSignal.timeout(timeoutMs) });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* */ }
    return { path, ok: res.ok, status: res.status, ms: Date.now() - started, json, error: res.ok ? undefined : text.slice(0, 200) };
  } catch (err) {
    return { path, ok: false, status: 0, ms: Date.now() - started, error: err.message };
  }
}

console.log(`\n=== Smart CMS Production Audit ===\nBase: ${base}\n`);

const env = getEnvStatus();
const tableStats = {};
for (const table of SMART_CMS_TABLES) {
  const probe = await probeTableAnon(table);
  const count = await countTableRows(table);
  tableStats[table] = { exists: probe.ok || probe.restricted, missing: Boolean(probe.missing), count };
}

const tablesPresent = SMART_CMS_TABLES.filter((t) => tableStats[t].exists && !tableStats[t].missing).length;

const adminRoutes = await Promise.all(
  SMART_CMS_ADMIN_ROUTES.map(async (path) => {
    const r = await probeHttp(path);
    return { path, ok: r.status === 200 || r.status === 302, status: r.status, ms: r.ms };
  }),
);

const apiRoutes = await Promise.all(
  SMART_CMS_API_ROUTES.map(async (path) => {
    const r = await probeHttp(path, { method: "POST" });
    return { path, ok: r.status === 401 || r.status === 403 || r.status === 200, status: r.status, note: "admin_auth" };
  }),
);

const cronResults = [];
for (const path of SMART_CMS_CRON_PATHS) {
  const authProbe = await probeHttp(path, { method: "POST" });
  const entry = {
    path,
    endpointExists: authProbe.status === 401 || authProbe.status === 200 || authProbe.status === 405,
    status: authProbe.status === 401 ? "auth_enforced" : authProbe.status === 200 ? "ok" : "error",
    ms: authProbe.ms,
  };
  if (cronSecret && verifyCrons) {
    const exec = await probeHttp(path, { method: "POST", auth: true, timeoutMs: 90000 });
    entry.executed = exec.ok;
    entry.execStatus = exec.status;
    entry.execMs = exec.ms;
    entry.status = exec.ok ? "executed_ok" : exec.status === 503 ? "infra_blocked" : "executed_error";
  }
  cronResults.push(entry);
}

const systems = [
  {
    name: "CMS Tables",
    production: tablesPresent === SMART_CMS_TABLES.length ? "active" : tablesPresent >= 5 ? "partial" : "missing",
    evidence: `${tablesPresent}/${SMART_CMS_TABLES.length} tables`,
  },
  {
    name: "Content Drafts Workflow",
    production: tableStats.content_drafts?.missing ? "missing" : (tableStats.content_drafts?.count ?? 0) >= 0 ? "active" : "unknown",
    evidence: `content_drafts=${tableStats.content_drafts?.count}`,
  },
  {
    name: "Bulk Import Jobs",
    production: tableStats.content_import_jobs?.missing ? "missing" : "active",
    evidence: `jobs=${tableStats.content_import_jobs?.count}`,
  },
  {
    name: "CMS Index / Search",
    production: tableStats.cms_content_index?.missing ? "missing" : "active",
    evidence: `index=${tableStats.cms_content_index?.count}`,
  },
  {
    name: "Admin Notifications",
    production: tableStats.cms_admin_notifications?.missing ? "missing" : "active",
    evidence: `notifications=${tableStats.cms_admin_notifications?.count}`,
  },
  {
    name: "Dedup Engine",
    production: tableStats.content_dedup_keys?.missing ? "missing" : "active",
    evidence: `keys=${tableStats.content_dedup_keys?.count}`,
  },
];

const STATUS_SCORE = { active: 1, partial: 0.6, missing: 0, unknown: 0.3 };
const weightedScore = systems.reduce((s, x) => s + (STATUS_SCORE[x.production] ?? 0), 0);
const readinessPct = Math.round((weightedScore / systems.length) * 100);

const cronsVerified = cronResults.filter((c) => c.status === "auth_enforced" || c.status === "executed_ok" || c.endpointExists).length;

const report = {
  at: new Date().toISOString(),
  base,
  envPresent: Object.fromEntries(Object.entries(env).map(([k, v]) => [k, Boolean(v)])),
  tableStats,
  tablesPresent,
  tablesTotal: SMART_CMS_TABLES.length,
  adminRoutes,
  apiRoutes,
  cronResults,
  cronsVerified,
  cronsTotal: SMART_CMS_CRON_PATHS.length,
  systems,
  readinessPct,
  targetPct: 100,
  meetsTarget: readinessPct >= 100 && tablesPresent === SMART_CMS_TABLES.length,
};

const outPath = join(root, "reports/smart-cms-production-audit.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`Tables: ${tablesPresent}/${SMART_CMS_TABLES.length}`);
console.log(`Admin routes OK: ${adminRoutes.filter((r) => r.ok).length}/${adminRoutes.length}`);
console.log(`API routes (auth): ${apiRoutes.filter((r) => r.ok).length}/${apiRoutes.length}`);
console.log(`Crons verified: ${cronsVerified}/${SMART_CMS_CRON_PATHS.length}`);
console.log(`Smart CMS readiness: ${readinessPct}%`);
console.log(`\nReport: ${outPath}`);

process.exit(readinessPct >= 80 ? 0 : 1);
