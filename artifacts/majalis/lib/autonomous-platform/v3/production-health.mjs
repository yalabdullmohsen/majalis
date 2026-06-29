/**
 * AKP v3 — Production Health, Checklist, Readiness Score, Categorized Logs.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getEnvStatus } from "../../env-config.mjs";
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { probeTables, countTableRows } from "../../table-probe.mjs";
import { getPlatformBootstrapStatus } from "../../platform-bootstrap.mjs";
import { loadSourcesFromJson } from "../sources.mjs";
import { PLATFORM_V3_VERSION } from "./orchestrator.mjs";
import { getSchedulerState } from "./smart-scheduler.mjs";
import { listManagedSources } from "./source-manager.mjs";
import { listAuditLog } from "./security.mjs";
import { listBackupSnapshots } from "./backup-recovery.mjs";
import { enrichInfrastructureItem, SECRET_GUIDES } from "./infra-guides.mjs";
import { auditV3Migration } from "./migration-audit.mjs";
import { maybeRunAutoActivation } from "./auto-activation.mjs";

export const AKP_V3_TABLES = [
  "akp_content_sources",
  "akp_pipeline_runs",
  "akp_source_health_snapshots",
  "akp_source_discoveries",
  "akp_platform_analytics_daily",
  "akp_daily_goal_progress",
  "akp_self_healing_events",
  "akp_audit_log",
  "akp_backup_snapshots",
  "akp_semantic_index",
  "akp_scheduler_state",
];

export const AKP_V3_CRONS = [
  { path: "/api/cron/autonomous-platform-v3", schedule: "*/30 * * * *", label: "دورة v3 كاملة", mode: "full" },
  { path: "/api/cron/autonomous-platform-v3-health", schedule: "0 * * * *", label: "مراقبة صحة المصادر", mode: "health" },
  { path: "/api/cron/autonomous-platform-v3-goals", schedule: "0 */4 * * *", label: "أهداف المحتوى اليومية", mode: "goals" },
  { path: "/api/cron/autonomous-platform-v3-analytics", schedule: "15 0 * * *", label: "تحليلات يومية", mode: "analytics" },
  { path: "/api/cron/autonomous-platform-v3-backup", schedule: "0 4 * * *", label: "نسخ احتياطي", mode: "backup" },
  { path: "/api/cron/autonomous-platform-v3-heal", schedule: "manual", label: "إصلاح ذاتي", mode: "heal" },
  { path: "/api/cron/autonomous-platform-bootstrap", schedule: "30 5 * * *", label: "Bootstrap المصادر", mode: "bootstrap" },
  { path: "/api/cron/apply-migrations", schedule: "0 4 * * 0", label: "تطبيق Migrations", mode: "migrations" },
];

export const INFRASTRUCTURE_REQUIREMENTS = [
  { key: "DATABASE_URL", priority: "critical", impact: "تطبيق autonomous_platform_v3.sql", locations: ["Vercel Production", "GitHub Actions Secrets"] },
  { key: "SUPABASE_SERVICE_ROLE_KEY", priority: "critical", impact: "Bootstrap، Seed، Cron server-side", locations: ["Vercel Production", "GitHub Actions Secrets"] },
  { key: "CRON_SECRET", priority: "critical", impact: "مصادقة Cron Jobs", locations: ["Vercel Production", "GitHub Actions Secrets"] },
  { key: "VITE_SUPABASE_URL", priority: "critical", impact: "اتصال العميل و REST probes", locations: ["Vercel Production"] },
  { key: "VITE_SUPABASE_ANON_KEY", priority: "critical", impact: "Auth وقراءة عامة", locations: ["Vercel Production"] },
  { key: "OPENAI_API_KEY", priority: "optional", impact: "Semantic Embeddings + AI Classification", locations: ["Vercel Production"] },
  { key: "ANTHROPIC_API_KEY", priority: "optional", impact: "استخراج البيانات والتصنيف الشرعي", locations: ["Vercel Production"] },
  { key: "UPSTASH_REDIS_REST_URL", priority: "optional", impact: "Rate limiting + Queue coordination", locations: ["Vercel Production"] },
  { key: "UPSTASH_REDIS_REST_TOKEN", priority: "optional", impact: "Rate limiting + Queue coordination", locations: ["Vercel Production"] },
];

const LOG_CATEGORIES = {
  infrastructure: ["bootstrap", "migration", "env", "platform-bootstrap"],
  database: ["db", "migration", "seed", "schema"],
  cron: ["cron", "akp-v3", "scheduler"],
  pipelines: ["orchestrator", "pipeline", "fetch", "publish", "validate", "quality"],
  security: ["audit", "auth", "security"],
  ai: ["semantic", "embedding", "openai", "keyword"],
  import: ["import", "content-import"],
  sources: ["source", "health-monitor", "discovery"],
};

function auditInfrastructure() {
  const env = getEnvStatus();
  const presentFor = (key) => {
    if (key === "VITE_SUPABASE_URL") return Boolean(env.SUPABASE_URL);
    if (key === "VITE_SUPABASE_ANON_KEY") return Boolean(env.SUPABASE_ANON_KEY);
    if (key === "UPSTASH_REDIS_REST_URL") return Boolean(env.UPSTASH_REDIS_REST_URL);
    if (key === "UPSTASH_REDIS_REST_TOKEN") return Boolean(env.UPSTASH_REDIS_REST_TOKEN);
    return Boolean(env[key]);
  };
  return INFRASTRUCTURE_REQUIREMENTS.map((req) =>
    enrichInfrastructureItem({
      ...req,
      present: presentFor(req.key),
      status: presentFor(req.key) ? "configured" : "missing",
    }),
  );
}

function getRegisteredCrons() {
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
    const parsed = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
    return (parsed.crons || []).map((c) => c.path);
  } catch {
    return AKP_V3_CRONS.map((c) => c.path);
  }
}

async function getCronHealthDetailed(env) {
  const admin = getSupabaseAdmin();
  const registered = getRegisteredCrons();
  const scheduler = await getSchedulerState().catch(() => null);

  let logs = [];
  if (admin) {
    try {
      const { data } = await admin
        .from("akp_structured_logs")
        .select("component,event,level,message,duration_ms,created_at,metadata")
        .order("created_at", { ascending: false })
        .limit(200);
      logs = data || [];
    } catch {
      /* v1 table may exist */
    }
  }

  const cronLogs = logs.filter((l) =>
    ["akp-v3", "orchestrator", "akp-v3-health", "cron"].includes(l.component) ||
    String(l.event || "").includes("cron") ||
    String(l.event || "").includes("cycle"),
  );

  const blockReason = !env.SUPABASE_SERVICE_ROLE_KEY
    ? "Missing SUPABASE_SERVICE_ROLE_KEY — cron cannot write pipeline results"
    : !env.CRON_SECRET && process.env.NODE_ENV === "production"
      ? "Missing CRON_SECRET — manual cron triggers return 401 (Vercel x-vercel-cron still works)"
      : null;

  const crons = AKP_V3_CRONS.map((c) => {
    const related = cronLogs.filter(
      (l) =>
        l.metadata?.mode === c.mode ||
        l.metadata?.path === c.path ||
        (c.mode && String(l.event || "").includes(c.mode)) ||
        l.component === "akp-v3",
    );
    const successes = related.filter((l) => l.level !== "error" && !String(l.event).includes("fail"));
    const failures = related.filter((l) => l.level === "error" || String(l.event).includes("fail"));
    const lastRun = related[0]?.created_at || null;
    const lastSuccess = successes[0]?.created_at || null;
    const lastFailure = failures[0]?.created_at || null;
    const durations = related.filter((l) => l.duration_ms).map((l) => l.duration_ms);
    const avgRuntime = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;
    const itemsProcessed = related.reduce((sum, l) => sum + (Number(l.metadata?.produced) || Number(l.metadata?.items) || 0), 0);

    const nextRun = scheduler?.next_runs?.[c.mode] || scheduler?.next_runs?.[c.path] || null;

    let neverRunReason = null;
    if (!lastRun) {
      if (blockReason) neverRunReason = blockReason;
      else if (!registered.includes(c.path)) neverRunReason = "Not registered in vercel.json";
      else if (c.schedule === "manual") neverRunReason = "Manual-only endpoint";
      else neverRunReason = "Awaiting first Vercel Cron invocation or missing v3 tables/sources";
    }

    return {
      ...c,
      enabled: c.schedule !== "manual",
      registered: registered.includes(c.path),
      lastRun,
      lastSuccess,
      lastFailure,
      nextRun,
      averageRuntimeMs: avgRuntime,
      itemsProcessed,
      neverRunReason,
      lastRetry: failures[0]?.created_at || null,
    };
  });

  return { crons, scheduler, blockReason, recentCronLogs: cronLogs.slice(0, 20) };
}

async function getDatabaseHealth(env) {
  const admin = getSupabaseAdmin();
  const countEntries = await Promise.all(
    AKP_V3_TABLES.map(async (table) => [table, await countTableRows(table)]),
  );
  const counts = Object.fromEntries(countEntries);

  const sources = admin ? await listManagedSources() : { ok: false, sources: [], error: "missing_secret", missing: ["SUPABASE_SERVICE_ROLE_KEY"] };
  const jsonSeed = loadSourcesFromJson();

  let pipelineRuns = [];
  let selfHealing = [];
  if (admin) {
    try {
      const { data: runs } = await admin
        .from("akp_pipeline_runs")
        .select("id,pipeline,status,produced,published,rejected,duplicates,duration_ms,started_at,finished_at")
        .order("started_at", { ascending: false })
        .limit(10);
      pipelineRuns = runs || [];
    } catch {
      /* */
    }
    try {
      const { data: heal } = await admin
        .from("akp_self_healing_events")
        .select("event_type,component,action_taken,success,attempt,error,created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      selfHealing = heal || [];
    } catch {
      /* */
    }
  }

  const emptyReason = (table) => {
    if (!admin) return { code: "missing_secret", message: "Missing SUPABASE_SERVICE_ROLE_KEY — cannot read DB", fix: SECRET_GUIDES.SUPABASE_SERVICE_ROLE_KEY?.howToFix?.[0] };
    if (counts[table] === null) return { code: "migration", message: `Table ${table} missing — apply autonomous_platform_v3.sql`, fix: "Run apply-migrations cron" };
    if (counts[table] === 0) {
      if (table === "akp_content_sources") return { code: "bootstrap", message: "Waiting for Bootstrap/Seed — no sources in DB", fix: "Auto-activation runs seed when SERVICE_ROLE_KEY is set" };
      if (table === "akp_pipeline_runs") return { code: "pipeline", message: sources.sources?.length ? "Waiting for first Cron cycle" : "Waiting for Bootstrap — no sources to fetch", fix: "Add secrets → auto-activation runs first pipeline" };
      return { code: "cron", message: "Awaiting first v3 cycle after migration", fix: "Wait for cron or trigger autonomous-platform-v3?mode=full" };
    }
    return null;
  };

  const pipelineStatus =
    (sources.sources?.length || 0) === 0
      ? { state: "waiting_for_bootstrap", label: "Waiting for Bootstrap", detail: "No akp_content_sources rows — seed blocked until SUPABASE_SERVICE_ROLE_KEY" }
      : pipelineRuns.length === 0
        ? { state: "waiting_for_first_run", label: "Waiting for first Pipeline run", detail: "Sources exist but no akp_pipeline_runs yet" }
        : { state: "active", label: "Active", detail: `${pipelineRuns.length} recent runs` };

  return {
    counts,
    emptyReasons: Object.fromEntries(AKP_V3_TABLES.map((t) => [t, emptyReason(t)])),
    sources: { db: sources.sources?.length || 0, jsonSeed: jsonSeed.length, active: sources.sources?.filter((s) => s.active)?.length || 0 },
    pipelineRuns,
    pipelineStatus,
    selfHealing,
  };
}

async function getCategorizedLogs() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return Object.fromEntries(Object.keys(LOG_CATEGORIES).map((k) => [k, { ok: false, reason: "Missing SUPABASE_SERVICE_ROLE_KEY", entries: [] }]));
  }

  let all = [];
  try {
    const { data } = await admin.from("akp_structured_logs").select("*").order("created_at", { ascending: false }).limit(300);
    all = data || [];
  } catch {
    return Object.fromEntries(Object.keys(LOG_CATEGORIES).map((k) => [k, { ok: false, reason: "akp_structured_logs unavailable", entries: [] }]));
  }

  const result = {};
  for (const [category, keywords] of Object.entries(LOG_CATEGORIES)) {
    const entries = all.filter((l) => {
      const hay = `${l.component} ${l.event} ${l.message}`.toLowerCase();
      return keywords.some((k) => hay.includes(k));
    }).slice(0, 25);
    result[category] = { ok: true, count: entries.length, entries };
  }
  return result;
}

function buildChecklist(parts) {
  const { env, migration, database, crons, bootstrap, security } = parts;

  const status = (pass, warn = false) => (pass ? "PASS" : warn ? "WARNING" : "FAIL");

  const items = [
    {
      id: "database",
      label: "Database",
      status: status(migration.ok, migration.appliedPct >= 50),
      reason: migration.ok ? "All v3 tables present" : `Missing tables: ${migration.actual?.tables?.missing?.join(", ") || migration.missing?.join(", ")}`,
    },
    {
      id: "secrets",
      label: "Secrets",
      status: status(
        env.DATABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.CRON_SECRET,
      ),
      reason: [
        !env.DATABASE_URL && "Missing DATABASE_URL",
        !env.SUPABASE_SERVICE_ROLE_KEY && "Missing SUPABASE_SERVICE_ROLE_KEY",
        !env.CRON_SECRET && "Missing CRON_SECRET",
      ].filter(Boolean).join("; ") || "All critical secrets configured",
    },
    {
      id: "cron",
      label: "Cron",
      status: status(crons.crons.some((c) => c.lastRun), !env.CRON_SECRET),
      reason: crons.blockReason || (crons.crons.some((c) => c.lastRun) ? "At least one cron has run" : "No cron runs logged yet"),
    },
    {
      id: "bootstrap",
      label: "Bootstrap",
      status: status(database.sources?.db > 0, database.sources?.jsonSeed > 0),
      reason: bootstrap.blockedReason || (database.sources?.db > 0 ? `${database.sources.db} sources in DB` : "Waiting for Bootstrap/Seed"),
    },
    {
      id: "sources",
      label: "Sources",
      status: status((database.sources?.active || 0) > 0),
      reason: (database.sources?.active || 0) > 0 ? `${database.sources.active} active sources` : "No active sources",
    },
    {
      id: "pipelines",
      label: "Pipelines",
      status: status(database.pipelineRuns?.length > 0, database.pipelineStatus?.state === "waiting_for_bootstrap"),
      reason: database.pipelineStatus?.label || "Unknown",
    },
    {
      id: "analytics",
      label: "Analytics",
      status: status((database.counts?.akp_platform_analytics_daily || 0) > 0, migration.appliedPct >= 80),
      reason: (database.counts?.akp_platform_analytics_daily || 0) > 0 ? "Daily snapshots exist" : "Waiting for analytics cron after migration",
    },
    {
      id: "search",
      label: "Search",
      status: status((database.counts?.akp_semantic_index || 0) > 0, !env.OPENAI_API_KEY),
      reason: env.OPENAI_API_KEY ? "Semantic mode (needs indexed content)" : "Keyword fallback — OPENAI_API_KEY optional",
    },
    {
      id: "knowledge_graph",
      label: "Knowledge Graph",
      status: status(database.pipelineRuns?.some((r) => r.pipeline === "knowledge_graph"), false),
      reason: database.pipelineRuns?.some((r) => r.pipeline === "knowledge_graph") ? "Graph linking active" : "Awaiting first full pipeline cycle",
    },
    {
      id: "ai",
      label: "AI",
      status: status(Boolean(env.OPENAI_API_KEY), true),
      reason: env.OPENAI_API_KEY ? "OPENAI_API_KEY configured" : "Missing OPENAI_API_KEY — keyword fallback only (WARNING)",
    },
    {
      id: "backup",
      label: "Backup",
      status: status((database.counts?.akp_backup_snapshots || 0) > 0, migration.appliedPct >= 80),
      reason: (database.counts?.akp_backup_snapshots || 0) > 0 ? "Backup snapshots exist" : "Waiting for backup cron",
    },
    {
      id: "security",
      label: "Security",
      status: status(security.cronAuthConfigured && security.serviceRoleConfigured),
      reason: !security.cronAuthConfigured ? "Missing CRON_SECRET" : "Cron auth + service role OK",
    },
  ];

  return items;
}

function computeReadinessScore(parts) {
  const categories = {
    infrastructure: { weight: 15, score: 0 },
    database: { weight: 15, score: 0 },
    cron: { weight: 10, score: 0 },
    sources: { weight: 10, score: 0 },
    pipelines: { weight: 10, score: 0 },
    analytics: { weight: 10, score: 0 },
    search: { weight: 5, score: 0 },
    knowledgeGraph: { weight: 5, score: 0 },
    security: { weight: 10, score: 0 },
    backups: { weight: 10, score: 0 },
  };

  const env = parts.env;
  const criticalSecrets = ["DATABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET"];
  const clientSecrets = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
  const secretsOk =
    criticalSecrets.every((k) => env[k]) && clientSecrets.every((k) => env[k]);
  categories.infrastructure.score = secretsOk ? 100 : Math.max(0, 100 - [...criticalSecrets, ...clientSecrets].filter((k) => !env[k]).length * 15);

  categories.database.score = parts.migration.appliedPct;

  const cronRuns = parts.crons.crons.filter((c) => c.lastRun).length;
  categories.cron.score = cronRuns > 0 ? 100 : env.CRON_SECRET ? 30 : 10;

  const src = parts.database.sources?.db || 0;
  categories.sources.score = src > 0 ? 100 : parts.database.sources?.jsonSeed > 0 ? 25 : 0;

  categories.pipelines.score = parts.database.pipelineRuns?.length > 0 ? 100 : src > 0 ? 40 : 0;

  categories.analytics.score = (parts.database.counts?.akp_platform_analytics_daily || 0) > 0 ? 100 : parts.migration.appliedPct;

  categories.search.score = (parts.database.counts?.akp_semantic_index || 0) > 0 ? 100 : env.OPENAI_API_KEY ? 40 : 70;

  categories.knowledgeGraph.score = parts.database.pipelineRuns?.some((r) => r.status === "completed") ? 80 : 0;

  categories.security.score = env.CRON_SECRET && env.SUPABASE_SERVICE_ROLE_KEY ? 100 : 40;

  categories.backups.score = (parts.database.counts?.akp_backup_snapshots || 0) > 0 ? 100 : parts.migration.appliedPct >= 100 ? 50 : 0;

  let total = 0;
  for (const cat of Object.values(categories)) {
    total += (cat.score / 100) * cat.weight;
  }

  return {
    readinessPct: Math.min(100, Math.round(total)),
    breakdown: categories,
  };
}

function collectBlockers(parts) {
  const blockers = [];
  for (const item of parts.infrastructure) {
    if (item.priority === "critical" && !item.present) {
      blockers.push({
        type: "secret",
        key: item.key,
        impact: item.impact,
        whyRequired: item.whyRequired,
        stoppedFunctions: item.stoppedFunctions,
        howToFix: item.howToFix,
        howToVerify: item.howToVerify,
        programmaticFix: false,
      });
    }
  }
  if (!parts.migration.ok) {
    blockers.push({
      type: "migration",
      missing: parts.migration.actual?.tables?.missing || parts.migration.missing,
      impact: "autonomous_platform_v3.sql not fully applied",
      howToFix: ["Set DATABASE_URL", "Trigger apply-migrations cron", "Or wait for auto-activation"],
      programmaticFix: false,
    });
  }
  if ((parts.database.sources?.db || 0) === 0) {
    blockers.push({
      type: "bootstrap",
      impact: "No sources in DB",
      howToFix: ["Set SUPABASE_SERVICE_ROLE_KEY", "Auto-activation seeds on next health/cron check"],
      programmaticFix: Boolean(parts.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  }
  if (!parts.env.OPENAI_API_KEY) {
    blockers.push({
      type: "ai",
      severity: "warning",
      impact: "Semantic embeddings disabled",
      programmaticFix: false,
    });
  }
  return blockers;
}

export async function buildAkpProductionHealth(options = {}) {
  const started = Date.now();
  const env = getEnvStatus();
  const infrastructure = auditInfrastructure();

  const [migrationAudit, bootstrapRaw, database, crons, logs, audit, backups] = await Promise.all([
    auditV3Migration(),
    getPlatformBootstrapStatus(),
    getDatabaseHealth(env),
    getCronHealthDetailed(env),
    getCategorizedLogs(),
    listAuditLog({ limit: 10 }).catch(() => ({ entries: [] })),
    listBackupSnapshots(5).catch(() => ({ snapshots: [] })),
  ]);

  const migration = {
    ok: migrationAudit.ok,
    migrationFile: migrationAudit.migrationFile,
    present: migrationAudit.actual.tables.present,
    missing: migrationAudit.actual.tables.missing,
    appliedPct: migrationAudit.appliedPct,
    expectedVsActual: migrationAudit,
  };
  const bootstrap = {
    ...bootstrapRaw,
    blockedReason: bootstrapRaw.precheck?.ok === false
      ? `Phase: precheck_secrets — Missing: ${(bootstrapRaw.precheck?.missing || []).join(", ")} — Fix: add secrets in Vercel Production`
      : bootstrapRaw.probe?.ok === false
        ? `Phase: probe_tables — Missing tables: ${(bootstrapRaw.probe?.missing || []).slice(0, 5).join(", ")}`
        : bootstrapRaw.bootstrap?.lastError
          ? `Phase: ${bootstrapRaw.bootstrap?.lastStatus || "unknown"} — ${bootstrapRaw.bootstrap.lastError}`
          : null,
    failureDetail: bootstrapRaw.latestRun?.steps?.find((s) => !s.ok) || null,
  };

  const security = {
    cronAuthConfigured: Boolean(env.CRON_SECRET),
    serviceRoleConfigured: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    aiMode: env.OPENAI_API_KEY ? "semantic_embeddings" : "keyword_fallback",
  };

  const scoreParts = { env, infrastructure, migration, database, crons, bootstrap, security };
  const { readinessPct, breakdown } = computeReadinessScore(scoreParts);
  const checklist = buildChecklist(scoreParts);
  const blockers = collectBlockers(scoreParts);

  let autoActivation = null;
  if (options.runAutoActivation) {
    autoActivation = await maybeRunAutoActivation();
  }

  return {
    ok: blockers.filter((b) => b.severity !== "warning").length === 0 && readinessPct >= 100,
    platformVersion: PLATFORM_V3_VERSION,
    readinessPct,
    readinessBreakdown: breakdown,
    checklist,
    at: new Date().toISOString(),
    durationMs: Date.now() - started,
    infrastructure,
    migration,
    bootstrap,
    database,
    crons,
    logs,
    security,
    audit: audit.entries || audit,
    backups: backups.snapshots || backups,
    blockers,
    blockersCount: blockers.filter((b) => b.severity !== "warning").length,
    autoActivation,
    ownerActions: infrastructure
      .filter((i) => !i.present && i.priority === "critical")
      .map((i) => ({
        secret: i.key,
        addTo: i.locations.join(" + "),
        impact: i.impact,
        howToFix: i.howToFix,
        howToVerify: i.howToVerify,
      })),
    autoActivationNote:
      "When DATABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, the next cron/health check triggers auto-activation: Migration → Seed → Pipeline → Analytics — no manual steps.",
  };
}

export default buildAkpProductionHealth;
