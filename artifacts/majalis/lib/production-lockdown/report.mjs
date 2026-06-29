/**
 * Production Lockdown — unified readiness report (no new features).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { getEnvStatus } from "../env-config.mjs";
import { buildAkpProductionHealth } from "../autonomous-platform/v3/production-health.mjs";
import { probeAutomationRecoveryTables, runAutomationRecoveryMigrations } from "../automation-recovery.mjs";
import { probeTables, countTableRows, probeTableAnon } from "../table-probe.mjs";
import { listAvailableMigrations } from "../migration-paths.mjs";
import {
  USER_FACING_ROUTES,
  PRODUCTION_APIS,
  PRODUCTION_BASE,
} from "../release-gate.mjs";
import { SMART_CMS_TABLES } from "../migration-paths.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

function readVercelCrons() {
  try {
    const parsed = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));
    return parsed.crons || [];
  } catch {
    return [];
  }
}

async function probeHttp(base, path, { method = "GET", timeoutMs = 15000, auth = false, cronSecret = "" } = {}) {
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

async function latestRun(table, select, order = "created_at.desc") {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) return { ok: false, error: "no_supabase_key" };
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=${order}&limit=8`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return { ok: false, status: res.status, error: (await res.text()).slice(0, 200) };
    return { ok: true, rows: await res.json() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function cronStatsFromLogs(cronPath, logs = []) {
  const slug = cronPath.split("/").pop();
  const related = logs.filter((l) =>
    String(l.component || "").includes(slug) ||
    String(l.event || "").includes(slug) ||
    String(l.message || "").includes(slug),
  );
  const successes = related.filter((l) => l.level !== "error" && !String(l.message).includes("fail")).length;
  const failures = related.filter((l) => l.level === "error" || String(l.message).includes("fail")).length;
  const last = related[0];
  return {
    lastRun: last?.created_at ?? null,
    durationMs: last?.duration_ms ?? null,
    lastResult: last?.level === "error" ? "failed" : last ? "success" : "unknown",
    lastError: last?.level === "error" ? last.message : null,
    successCount: successes,
    failureCount: failures,
  };
}

function runLocalGate(name, cmd) {
  const t0 = Date.now();
  try {
    execSync(cmd, { cwd: ROOT, stdio: "pipe", encoding: "utf8" });
    return { name, ok: true, ms: Date.now() - t0 };
  } catch (err) {
    return { name, ok: false, ms: Date.now() - t0, error: String(err.stderr || err.message).slice(0, 500) };
  }
}

async function auditDataIntegrity() {
  const issues = [];
  const checks = [];

  for (const table of ["lessons", "sheikhs", "library_items", "qa_questions"]) {
    const probe = await probeTableAnon(table);
    checks.push({ check: `table:${table}`, ok: probe.ok || probe.restricted, missing: probe.missing });
    if (probe.missing) issues.push({ type: "missing_table", table });
  }

  const importJobs = await latestRun("content_import_jobs", "id,status,type,updated_at,error_message", "updated_at.desc");
  if (importJobs.ok && importJobs.rows?.length) {
    const failed = importJobs.rows.filter((r) => r.status === "failed");
    if (failed.length === importJobs.rows.length) {
      issues.push({ type: "import_jobs_all_failed", count: failed.length });
    }
    checks.push({ check: "import_jobs_recent", ok: true, failed: failed.length });
  }

  const akeRuns = await latestRun("ake_engine_runs", "id,status,started_at", "started_at.desc");
  checks.push({ check: "ake_runs_logged", ok: akeRuns.ok && (akeRuns.rows?.length ?? 0) > 0, count: akeRuns.rows?.length ?? 0 });

  return { issues, checks, issueCount: issues.length };
}

export async function buildProductionLockdownReport(options = {}) {
  const base = options.base || process.env.MAJALIS_PRODUCTION_URL || PRODUCTION_BASE;
  const cronSecret = options.cronSecret || process.env.CRON_SECRET || "";
  const verifyCrons = options.verifyCrons === true && Boolean(cronSecret);
  const skipLocal = options.skipLocal === true;

  const env = getEnvStatus();
  const akpHealth = await buildAkpProductionHealth().catch((err) => ({ error: err.message, readinessPct: 0 }));
  const automationTables = await probeAutomationRecoveryTables().catch((err) => ({ ok: false, error: err.message }));
  const cmsProbe = await probeTables(SMART_CMS_TABLES).catch(() => ({}));
  const cmsMissing = SMART_CMS_TABLES.filter((t) => cmsProbe[t] !== true);

  const migrationsInfo = listAvailableMigrations();
  const migrations = migrationsInfo.present || migrationsInfo.allSqlInDir || [];
  const crons = readVercelCrons();

  let structuredLogs = [];
  const logProbe = await latestRun("akp_structured_logs", "component,event,level,message,duration_ms,created_at", "created_at.desc");
  if (logProbe.ok) structuredLogs = logProbe.rows || [];

  const cronDetails = [];
  for (const cron of crons) {
    const path = cron.path;
    const authProbe = await probeHttp(base, path, { method: "POST", timeoutMs: 20000 });
    const endpointOk = [200, 401, 405, 503].includes(authProbe.status);
    const stats = cronStatsFromLogs(path, structuredLogs);
    const entry = {
      path,
      schedule: cron.schedule,
      endpointRegistered: true,
      endpointReachable: endpointOk,
      httpStatus: authProbe.status,
      probeMs: authProbe.ms,
      ...stats,
    };

    if (verifyCrons) {
      const exec = await probeHttp(base, path, { method: "POST", timeoutMs: 55000, auth: true, cronSecret });
      entry.executed = exec.status === 200;
      entry.executionMs = exec.ms;
      entry.executionOk = exec.status === 200 && exec.json?.ok !== false;
      entry.executionError = exec.error || (exec.json?.error ?? null);
      entry.lastRun = entry.lastRun || new Date().toISOString();
      entry.lastResult = entry.executionOk ? "success" : entry.executed ? "partial" : "failed";
    }

    cronDetails.push(entry);
  }

  const routes = [];
  for (const route of USER_FACING_ROUTES) {
    const r = await probeHttp(base, route, { timeoutMs: 12000 });
    routes.push({
      route,
      ok: r.ok || r.status === 200,
      status: r.status,
      ms: r.ms,
      spaShell: r.status === 200 && String(r.json?.raw || "").includes("<!DOCTYPE") || r.status === 200,
    });
  }

  const apis = [];
  for (const api of PRODUCTION_APIS) {
    const r = await probeHttp(base, api.path, { method: api.method || "GET", timeoutMs: 15000 });
    apis.push({ ...api, status: r.status, ok: r.ok, ms: r.ms, error: r.error });
  }

  const localGates = skipLocal
    ? []
    : [
        runLocalGate("typecheck", "pnpm run typecheck"),
        runLocalGate("build", "PORT=24216 BASE_PATH=/ pnpm run build"),
        runLocalGate("lint", "pnpm run lint"),
      ];

  const integrity = await auditDataIntegrity();

  const systems = [
    {
      id: "akp_v3",
      name: "AKP v3",
      status: akpHealth.readinessPct >= 70 ? "operational" : akpHealth.blockers?.length ? "degraded" : "unknown",
      readinessPct: akpHealth.readinessPct ?? 0,
      evidence: akpHealth.blockers?.[0]?.impact || `tables ok: ${akpHealth.migration?.present?.length ?? 0}`,
      cron: "/api/cron/autonomous-platform-v3",
    },
    {
      id: "question_generation",
      name: "Question Generation",
      status: automationTables.counts?.question_generation_jobs != null ? "operational" : "migration_missing",
      evidence: `jobs=${automationTables.counts?.question_generation_jobs ?? "N/A"}`,
      cron: "/api/cron/question-answer-daily",
    },
    {
      id: "sin_jeem",
      name: "Sin Jeem / سؤال وجواب",
      status: (automationTables.counts?.sin_jeem_questions ?? 0) > 0 ? "operational" : "empty",
      evidence: `questions=${automationTables.counts?.sin_jeem_questions ?? 0}`,
      cron: "/api/cron/question-answer-daily",
    },
    {
      id: "mke",
      name: "MKE",
      status: automationTables.tables?.mke_runs ? "operational" : "migration_missing",
      evidence: `runs=${automationTables.counts?.mke_runs ?? 0}`,
      cron: "/api/cron/majlis-knowledge-engine",
    },
    {
      id: "content_import",
      name: "Content Import",
      status: automationTables.tables?.content_import_jobs ? "operational" : "migration_missing",
      evidence: `jobs=${automationTables.counts?.content_import_jobs ?? 0}`,
      cron: "/api/cron/process-import-jobs",
    },
    {
      id: "fiqh_council",
      name: "Fiqh Council",
      status: (automationTables.counts?.fiqh_council_items ?? 0) > 0 ? "operational" : automationTables.tables?.fiqh_council_items ? "empty" : "migration_missing",
      evidence: `items=${automationTables.counts?.fiqh_council_items ?? 0}`,
      cron: "/api/cron/sync-fiqh-council",
    },
    {
      id: "ake_orchestrator",
      name: "AKE Orchestrator",
      status: (automationTables.counts?.ake_engine_runs ?? 0) > 0 ? "operational" : automationTables.tables?.ake_engine_runs ? "empty" : "migration_missing",
      evidence: `runs=${automationTables.counts?.ake_engine_runs ?? 0}`,
      cron: "/api/cron/auto-knowledge-sync",
    },
    {
      id: "smart_cms",
      name: "Smart CMS",
      status: cmsMissing.length === 0 ? "operational" : cmsMissing.length < SMART_CMS_TABLES.length ? "partial" : "migration_missing",
      evidence: cmsMissing.length ? `missing: ${cmsMissing.slice(0, 3).join(", ")}` : "all tables present",
      cron: null,
    },
  ];

  const operational = systems.filter((s) => s.status === "operational").length;
  const routesOk = routes.filter((r) => r.ok).length;
  const apisOk = apis.filter((a) => a.ok).length;
  const cronsReachable = cronDetails.filter((c) => c.endpointReachable).length;
  const localOk = localGates.every((g) => g.ok);

  const healthScore = Math.round(
    (operational / systems.length) * 35 +
      (routesOk / Math.max(routes.length, 1)) * 20 +
      (apisOk / Math.max(apis.length, 1)) * 15 +
      (cronsReachable / Math.max(cronDetails.length, 1)) * 15 +
      (localOk || skipLocal ? 10 : 0) +
      (integrity.issueCount === 0 ? 5 : Math.max(0, 5 - integrity.issueCount)),
  );

  const readinessPct = Math.min(100, Math.round(
    (operational / systems.length) * 50 +
      (akpHealth.readinessPct ?? 0) * 0.3 +
      (routesOk / Math.max(routes.length, 1)) * 20,
  ));

  return {
    at: new Date().toISOString(),
    base,
    healthScore,
    readinessPct,
    mergedBranches: ["cursor/automation-recovery-92e6 (PR #194)", "cursor/smart-cms-production-92e6 (PR #195)"],
    deferredFeaturePrs: "PRs #196–#197 and UI/feature branches deferred until lockdown passes",
    env: Object.fromEntries(Object.entries(env).map(([k, v]) => [k, Boolean(v)])),
    localGates,
    migrations: {
      available: migrations.length,
      dir: migrationsInfo.dir,
      missing: migrationsInfo.missing?.slice(0, 10) ?? [],
      files: migrations.slice(0, 20),
    },
    automationRecovery: automationTables,
    cmsTables: { missing: cmsMissing, present: SMART_CMS_TABLES.length - cmsMissing.length },
    akpHealth: {
      readinessPct: akpHealth.readinessPct,
      blockers: akpHealth.blockers?.slice(0, 8) ?? [],
      migration: akpHealth.migration,
    },
    systems,
    crons: cronDetails,
    routes,
    apis,
    dataIntegrity: integrity,
    scores: {
      systemsOperational: `${operational}/${systems.length}`,
      routesOk: `${routesOk}/${routes.length}`,
      apisOk: `${apisOk}/${apis.length}`,
      cronsReachable: `${cronsReachable}/${cronDetails.length}`,
      integrityIssues: integrity.issueCount,
    },
  };
}

export { runAutomationRecoveryMigrations };
