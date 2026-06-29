/**
 * Production Full Audit — generates 12 subsystem reports + master summary.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getEnvStatus } from "../env-config.mjs";
import { buildUnifiedAutonomousPlatform } from "../autonomous-platform/v3/unified-platform.mjs";
import { buildProductionLockdownReport } from "../production-lockdown/report.mjs";
import { detectMigrationState } from "../zero-touch/migration-detector.mjs";
import { runStartupValidation } from "../zero-touch/startup-validation.mjs";
import { listAvailableMigrations, GKE_TABLES, SMART_CMS_TABLES, AUTOMATION_RECOVERY_TABLES } from "../migration-paths.mjs";
import { probeTables } from "../table-probe.mjs";
import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

function readVercelCrons() {
  try {
    return JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8")).crons || [];
  } catch {
    return [];
  }
}

async function probeCron(base, path, cronSecret) {
  const started = Date.now();
  try {
    const headers = cronSecret ? { Authorization: `Bearer ${cronSecret}`, "x-vercel-cron": "1" } : {};
    const res = await fetch(new URL(path, base).toString(), {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(25_000),
    });
    const json = await res.json().catch(() => null);
    return {
      path,
      ok: res.ok,
      status: res.status,
      ms: Date.now() - started,
      authenticated: Boolean(cronSecret),
      executed: res.ok && json?.ok !== false,
      error: res.ok ? undefined : json?.error || `HTTP ${res.status}`,
    };
  } catch (err) {
    return { path, ok: false, ms: Date.now() - started, error: err.message, authenticated: Boolean(cronSecret) };
  }
}

export async function runProductionFullAudit(options = {}) {
  const started = Date.now();
  const base = options.base || process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com";
  const cronSecret = options.cronSecret || process.env.CRON_SECRET || "";
  const verifyCrons = options.verifyCrons === true || Boolean(cronSecret);

  const env = getEnvStatus();
  const secrets = [
    { key: "DATABASE_URL", envKeys: ["DATABASE_URL"] },
    { key: "SUPABASE_SERVICE_ROLE_KEY", envKeys: ["SUPABASE_SERVICE_ROLE_KEY"] },
    { key: "SUPABASE_URL", envKeys: ["SUPABASE_URL"] },
    { key: "SUPABASE_ANON_KEY", envKeys: ["SUPABASE_ANON_KEY"] },
    { key: "CRON_SECRET", envKeys: ["CRON_SECRET"] },
    { key: "OPENAI_API_KEY", envKeys: ["OPENAI_API_KEY"] },
    { key: "ANTHROPIC_API_KEY", envKeys: ["ANTHROPIC_API_KEY"] },
    { key: "UPSTASH_REDIS_REST_URL", envKeys: ["UPSTASH_REDIS_REST_URL"] },
    { key: "UPSTASH_REDIS_REST_TOKEN", envKeys: ["UPSTASH_REDIS_REST_TOKEN"] },
    { key: "BLOB_TOKEN", envKeys: ["BLOB_TOKEN", "BLOB_READ_WRITE_TOKEN"] },
    { key: "RESEND_API_KEY", envKeys: ["RESEND_API_KEY"] },
    { key: "YOUTUBE_API_KEY", envKeys: ["YOUTUBE_API_KEY", "GOOGLE_API_KEY"] },
    { key: "INSTAGRAM_TOKEN", envKeys: ["INSTAGRAM_GRAPH_ACCESS_TOKEN", "INSTAGRAM_TOKEN"] },
    { key: "TELEGRAM_TOKEN", envKeys: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_TOKEN"] },
    { key: "GOOGLE_DRIVE_TOKEN", envKeys: ["GOOGLE_DRIVE_TOKEN", "GOOGLE_SERVICE_ACCOUNT_JSON"] },
  ].map(({ key, envKeys }) => ({
    key,
    present: envKeys.some((k) => Boolean(env[k])),
  }));

  const [unified, lockdown, migrations, startup, migrationsList] = await Promise.all([
    buildUnifiedAutonomousPlatform(),
    buildProductionLockdownReport({ base, verifyCrons, skipLocal: true, cronSecret }),
    detectMigrationState(),
    runStartupValidation(),
    Promise.resolve(listAvailableMigrations()),
  ]);

  const vercelCrons = readVercelCrons();
  const cronProbes = verifyCrons
    ? await Promise.all(
        vercelCrons.slice(0, 12).map((c) => probeCron(base, c.path, cronSecret)),
      )
    : vercelCrons.map((c) => ({ path: c.path, schedule: c.schedule, verified: false, reason: "no_cron_secret" }));

  const allTables = [...new Set([...GKE_TABLES, ...SMART_CMS_TABLES, ...AUTOMATION_RECOVERY_TABLES])];
  const tableProbe = await probeTables(allTables);
  const tablesPresent = allTables.filter((t) => tableProbe[t] === true).length;

  const healthReport = {
    at: new Date().toISOString(),
    healthScore: unified.healthScore,
    healthScoreTarget: 95,
    readinessPct: lockdown.readinessPct,
    operational: unified.healthScore >= 95 && unified.criticalSecretsMissing.length === 0,
    breakdown: unified.breakdown,
    blockers: unified.akp.blockers,
    alerts: unified.alerts,
  };

  const productionReport = {
    at: new Date().toISOString(),
    base,
    healthScore: lockdown.healthScore,
    readinessPct: lockdown.readinessPct,
    systemsOperational: lockdown.scores?.systemsOperational,
    routesOk: lockdown.scores?.routesOk,
    apisOk: lockdown.scores?.apisOk,
    systems: lockdown.systems,
  };

  const automationReport = {
    at: new Date().toISOString(),
    akpVersion: unified.platformVersion,
    gkeVersion: unified.gkeVersion,
    shadowMode: unified.shadow_mode,
    autoPublishEnabled: unified.auto_publish_enabled,
    importJobs: unified.import_jobs,
    workers: unified.workers,
  };

  const cronReport = {
    at: new Date().toISOString(),
    registered: vercelCrons.length,
    verified: verifyCrons,
    crons: lockdown.crons || [],
    probes: cronProbes,
    working: (lockdown.crons || []).filter((c) => c.lastRun || c.endpointReachable).length,
    reachable: (lockdown.crons || []).filter((c) => c.endpointReachable).length,
  };

  const queueReport = {
    at: new Date().toISOString(),
    status: unified.queue.status,
    dlqCount: unified.queue.dlq_count,
    queues: unified.queue.queues,
  };

  const workerReport = {
    at: new Date().toISOString(),
    akp: unified.workers.akp_v3,
    gke: unified.workers.gke_acquisition,
    queue: unified.workers.queue,
    selfHealing: unified.akp.database?.selfHealing?.slice(0, 20) || [],
  };

  const databaseReport = {
    at: new Date().toISOString(),
    migrationsAvailable: migrationsList.present?.length ?? 0,
    migrationsMissing: migrationsList.missing ?? [],
    gkeTables: { expected: GKE_TABLES.length, present: GKE_TABLES.filter((t) => tableProbe[t]).length, missing: GKE_TABLES.filter((t) => !tableProbe[t]) },
    smartCmsTables: { expected: SMART_CMS_TABLES.length, present: SMART_CMS_TABLES.filter((t) => tableProbe[t]).length, missing: SMART_CMS_TABLES.filter((t) => !tableProbe[t]) },
    automationTables: { expected: AUTOMATION_RECOVERY_TABLES.length, present: AUTOMATION_RECOVERY_TABLES.filter((t) => tableProbe[t]).length },
    migrationState: migrations,
    startupValidation: startup,
    tablesPresent,
    tablesTotal: allTables.length,
    tablesPct: Math.round((tablesPresent / Math.max(1, allTables.length)) * 100),
  };

  const securityReport = {
    at: new Date().toISOString(),
    secrets,
    criticalMissing: secrets.filter((s) => ["DATABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET"].includes(s.key) && !s.present),
    cronAuthConfigured: unified.akp.security?.cronAuthConfigured,
    serviceRoleConfigured: unified.akp.security?.serviceRoleConfigured,
    aiMode: unified.akp.security?.aiMode,
  };

  const performanceReport = {
    at: new Date().toISOString(),
    routeProbes: (lockdown.routes || []).slice(0, 15).map((r) => ({ path: r.path, ms: r.ms, ok: r.ok })),
    avgRouteMs: Math.round(
      ((lockdown.routes || []).filter((r) => r.ok).reduce((s, r) => s + (r.ms || 0), 0)) /
        Math.max(1, (lockdown.routes || []).filter((r) => r.ok).length),
    ),
    note: "Full Lighthouse audit requires separate run: pnpm run lighthouse:reading-ux",
  };

  const aiReport = {
    at: new Date().toISOString(),
    openai: env.OPENAI_API_KEY,
    anthropic: env.ANTHROPIC_API_KEY,
    mode: unified.akp.security?.aiMode,
    gkePipelineOk: unified.gke.pipeline_ok,
    shadowMode: unified.shadow_mode,
  };

  const dataAcquisitionReport = {
    at: new Date().toISOString(),
    trustedSources: unified.import_jobs.gke_trusted_sources,
    importedToday: unified.import_jobs.imported_today,
    reviewQueue: unified.import_jobs.review_queue,
    duplicateRate: unified.import_jobs.duplicate_rate,
    qualityAverage: unified.import_jobs.quality_average,
    gke: unified.gke,
    productionReady: unified.gke.production_ready,
  };

  const cmsReport = {
    at: new Date().toISOString(),
    tables: databaseReport.smartCmsTables,
    importJobs: unified.import_jobs,
  };

  const closureCriteria = {
    healthScoreGte95: unified.healthScore >= 95,
    readiness100: lockdown.readinessPct >= 100,
    allTablesPresent: databaseReport.gkeTables.missing.length === 0 && databaseReport.smartCmsTables.missing.length === 0,
    allMigrationsApplied: (migrations.pending?.count ?? migrations.pending?.length ?? 999) === 0,
    cronsWorking: cronReport.working >= vercelCrons.length * 0.8,
    workersOperational: unified.queue.status !== "degraded",
    pipelinesActive: (unified.akp.database?.pipelineRuns?.length ?? 0) > 0,
    noCriticalSecretsMissing: unified.criticalSecretsMissing.length === 0,
    noShadowModeForFullAutonomy: !unified.shadow_mode,
  };

  const passedCriteria = Object.values(closureCriteria).filter(Boolean).length;
  const totalCriteria = Object.keys(closureCriteria).length;
  const autonomyPct = Math.round((passedCriteria / totalCriteria) * 100);

  const master = {
    at: new Date().toISOString(),
    base,
    durationMs: Date.now() - started,
    healthScore: unified.healthScore,
    readinessPct: lockdown.readinessPct,
    autonomyPct,
    fullyAutonomous: passedCriteria === totalCriteria,
    closureCriteria,
    passedCriteria,
    totalCriteria,
    missingSecrets: unified.missingSecrets,
    criticalBlockers: [
      ...unified.criticalSecretsMissing.map((s) => ({ type: "secret", name: s })),
      ...databaseReport.gkeTables.missing.map((t) => ({ type: "table", name: t, scope: "gke" })),
      ...databaseReport.smartCmsTables.missing.map((t) => ({ type: "table", name: t, scope: "smart-cms" })),
    ],
    note: passedCriteria === totalCriteria
      ? "Platform is fully autonomous"
      : `NOT 100% — ${totalCriteria - passedCriteria} closure criteria unmet. Owner must configure secrets and apply migrations on Production.`,
  };

  return {
    master,
    reports: {
      health: healthReport,
      production: productionReport,
      automation: automationReport,
      cron: cronReport,
      queue: queueReport,
      worker: workerReport,
      database: databaseReport,
      security: securityReport,
      performance: performanceReport,
      ai: aiReport,
      dataAcquisition: dataAcquisitionReport,
      cms: cmsReport,
    },
  };
}

export async function writeProductionFullAuditReports(options = {}) {
  const outDir = options.outDir || join(ROOT, "reports", "production");
  mkdirSync(outDir, { recursive: true });

  const audit = await runProductionFullAudit(options);

  writeFileSync(join(outDir, "master-summary.json"), JSON.stringify(audit.master, null, 2));
  for (const [name, report] of Object.entries(audit.reports)) {
    writeFileSync(join(outDir, `${name}-report.json`), JSON.stringify(report, null, 2));
  }

  const md = buildMarkdownSummary(audit);
  writeFileSync(join(outDir, "PRODUCTION-AUDIT-SUMMARY.md"), md);

  return { ...audit, outDir };
}

function buildMarkdownSummary(audit) {
  const m = audit.master;
  const lines = [
    "# Production Full Audit Summary",
    "",
    `**Date:** ${m.at}`,
    `**Base:** ${m.base}`,
    `**Health Score:** ${m.healthScore}/100 (target ≥95)`,
    `**Readiness:** ${m.readinessPct}%`,
    `**Autonomy:** ${m.autonomyPct}% (${m.passedCriteria}/${m.totalCriteria} criteria)`,
    `**Fully Autonomous:** ${m.fullyAutonomous ? "YES" : "NO"}`,
    "",
    "## Closure Criteria",
    "",
  ];
  for (const [k, v] of Object.entries(m.closureCriteria)) {
    lines.push(`- ${v ? "✅" : "❌"} ${k}`);
  }
  if (m.missingSecrets.length) {
    lines.push("", "## Missing Secrets", "");
    for (const s of m.missingSecrets) lines.push(`- ${s}`);
  }
  if (m.criticalBlockers.length) {
    lines.push("", "## Critical Blockers", "");
    for (const b of m.criticalBlockers.slice(0, 20)) lines.push(`- [${b.type}] ${b.name}`);
  }
  lines.push("", "## Reports Generated", "");
  for (const name of Object.keys(audit.reports)) {
    lines.push(`- \`${name}-report.json\``);
  }
  lines.push("", m.note);
  return lines.join("\n");
}

export default runProductionFullAudit;
