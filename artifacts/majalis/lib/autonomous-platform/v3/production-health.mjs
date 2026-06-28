/**
 * AKP v3 — Production Health aggregation for admin dashboard.
 */
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
  { path: "/api/cron/autonomous-platform-v3", schedule: "*/30 * * * *", label: "دورة v3 كاملة" },
  { path: "/api/cron/autonomous-platform-v3-health", schedule: "0 * * * *", label: "مراقبة صحة المصادر" },
  { path: "/api/cron/autonomous-platform-v3-goals", schedule: "0 */4 * * *", label: "أهداف المحتوى اليومية" },
  { path: "/api/cron/autonomous-platform-v3-analytics", schedule: "15 0 * * *", label: "تحليلات يومية" },
  { path: "/api/cron/autonomous-platform-v3-backup", schedule: "0 4 * * *", label: "نسخ احتياطي" },
  { path: "/api/cron/autonomous-platform-v3-heal", schedule: "manual", label: "إصلاح ذاتي" },
  { path: "/api/cron/autonomous-platform-bootstrap", schedule: "30 5 * * *", label: "Bootstrap المصادر" },
  { path: "/api/cron/apply-migrations", schedule: "0 4 * * 0", label: "تطبيق Migrations" },
];

export const INFRASTRUCTURE_REQUIREMENTS = [
  {
    key: "DATABASE_URL",
    priority: "critical",
    impact: "تطبيق autonomous_platform_v3.sql وجميع migrations",
    locations: ["Vercel Production", "GitHub Actions Secrets"],
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    priority: "critical",
    impact: "Bootstrap، Seed، Cron server-side، Admin APIs",
    locations: ["Vercel Production", "GitHub Actions Secrets"],
  },
  {
    key: "CRON_SECRET",
    priority: "critical",
    impact: "مصادقة Cron Jobs على الإنتاج",
    locations: ["Vercel Production", "GitHub Actions Secrets"],
  },
  {
    key: "VITE_SUPABASE_URL",
    priority: "critical",
    impact: "اتصال العميل و REST probes",
    locations: ["Vercel Production"],
  },
  {
    key: "VITE_SUPABASE_ANON_KEY",
    priority: "critical",
    impact: "Auth وقراءة عامة",
    locations: ["Vercel Production"],
  },
  {
    key: "OPENAI_API_KEY",
    priority: "optional",
    impact: "Semantic Embeddings — بدونه Keyword Fallback",
    locations: ["Vercel Production"],
  },
];

function auditInfrastructure() {
  const env = getEnvStatus();
  return INFRASTRUCTURE_REQUIREMENTS.map((req) => ({
    ...req,
    present: Boolean(env[req.key]),
    status: env[req.key] ? "configured" : "missing",
  }));
}

async function probeV3Migration() {
  const probed = await probeTables(AKP_V3_TABLES);
  const present = AKP_V3_TABLES.filter((t) => probed[t] === true);
  const missing = AKP_V3_TABLES.filter((t) => probed[t] !== true);
  return {
    ok: missing.length === 0,
    migrationFile: "autonomous_platform_v3.sql",
    present,
    missing,
    appliedPct: Math.round((present.length / AKP_V3_TABLES.length) * 100),
  };
}

async function getDatabaseHealth() {
  const admin = getSupabaseAdmin();
  const counts = {};
  for (const table of AKP_V3_TABLES) {
    counts[table] = await countTableRows(table);
  }

  const sources = admin ? await listManagedSources() : { ok: false, sources: [] };
  const jsonSeed = loadSourcesFromJson();

  let pipelineRuns = [];
  let lastError = null;
  let selfHealing = [];
  if (admin) {
    try {
      const { data: runs } = await admin
        .from("akp_pipeline_runs")
        .select("id,pipeline,status,produced,published,rejected,duplicates,duration_ms,started_at,finished_at")
        .order("started_at", { ascending: false })
        .limit(10);
      pipelineRuns = runs || [];
    } catch (err) {
      lastError = err.message;
    }
    try {
      const { data: heal } = await admin
        .from("akp_self_healing_events")
        .select("event_type,component,action_taken,success,attempt,error,created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      selfHealing = heal || [];
    } catch {
      /* table may not exist */
    }
  }

  const emptyReason = (table) => {
    if (!admin) return "missing_service_role";
    if (counts[table] === null) return "table_missing_or_inaccessible";
    if (counts[table] === 0) {
      if (table === "akp_content_sources") return "bootstrap_not_run";
      if (table === "akp_pipeline_runs") return "cron_not_run_or_no_sources";
      if (["akp_source_health_snapshots", "akp_platform_analytics_daily"].includes(table)) {
        return "v3_migration_or_cron_pending";
      }
      return "awaiting_first_cycle";
    }
    return null;
  };

  return {
    counts,
    emptyReasons: Object.fromEntries(AKP_V3_TABLES.map((t) => [t, emptyReason(t)])),
    sources: {
      db: sources.sources?.length || 0,
      jsonSeed: jsonSeed.length,
      active: sources.sources?.filter((s) => s.active)?.length || 0,
    },
    pipelineRuns,
    selfHealing,
    lastError,
  };
}

async function getCronHealth() {
  const admin = getSupabaseAdmin();
  const scheduler = await getSchedulerState().catch(() => null);
  const crons = AKP_V3_CRONS.map((c) => ({
    ...c,
    authRequired: true,
    note: "يتطلب CRON_SECRET أو x-vercel-cron على Vercel",
  }));

  let recentLogs = [];
  if (admin) {
    try {
      const { data } = await admin
        .from("akp_structured_logs")
        .select("component,event,level,message,duration_ms,created_at")
        .in("component", ["akp-v3", "orchestrator", "akp-v3-health"])
        .order("created_at", { ascending: false })
        .limit(15);
      recentLogs = data || [];
    } catch {
      /* optional */
    }
  }

  return { crons, scheduler, recentLogs };
}

function computeReadiness(parts) {
  const weights = {
    infrastructure: 25,
    migration: 25,
    bootstrap: 20,
    sources: 15,
    pipelines: 10,
    crons: 5,
  };
  let score = 0;

  const infraOk = parts.infrastructure.every((i) => i.present || i.priority === "optional");
  if (infraOk) score += weights.infrastructure;
  else {
    const critical = parts.infrastructure.filter((i) => i.priority === "critical" && !i.present);
    score += Math.max(0, weights.infrastructure - critical.length * 8);
  }

  if (parts.migration.ok) score += weights.migration;
  else score += (parts.migration.appliedPct / 100) * weights.migration;

  const sourceCount = parts.database.sources?.db || 0;
  if (sourceCount > 0) score += weights.bootstrap + weights.sources;
  else if (parts.database.sources?.jsonSeed > 0) score += weights.bootstrap * 0.3;

  const runs = parts.database.pipelineRuns?.length || 0;
  if (runs > 0) score += weights.pipelines;

  if (parts.infrastructure.find((i) => i.key === "CRON_SECRET")?.present) score += weights.crons;
  else score += weights.crons * 0.2;

  return Math.min(100, Math.round(score));
}

export async function buildAkpProductionHealth() {
  const started = Date.now();
  const env = getEnvStatus();
  const infrastructure = auditInfrastructure();
  const migration = await probeV3Migration();
  const bootstrap = await getPlatformBootstrapStatus();
  const database = await getDatabaseHealth();
  const crons = await getCronHealth();
  const audit = await listAuditLog({ limit: 10 }).catch(() => ({ entries: [] }));
  const backups = await listBackupSnapshots(5).catch(() => ({ snapshots: [] }));

  const blockers = [];
  for (const item of infrastructure) {
    if (item.priority === "critical" && !item.present) {
      blockers.push({ type: "secret", key: item.key, impact: item.impact });
    }
  }
  if (!migration.ok) {
    blockers.push({
      type: "migration",
      missing: migration.missing,
      impact: "جداول v3 غير موجودة — نفّذ apply-migrations",
    });
  }
  if ((database.sources?.db || 0) === 0) {
    blockers.push({
      type: "bootstrap",
      impact: "لا مصادر في DB — شغّل autonomous-platform-v3?mode=seed",
    });
  }
  if (!env.OPENAI_API_KEY) {
    blockers.push({
      type: "ai",
      impact: "OPENAI_API_KEY غير مُعد — Semantic Embeddings معطّلة (Keyword Fallback)",
      severity: "warning",
    });
  }

  const readinessPct = computeReadiness({ infrastructure, migration, database });

  return {
    ok: blockers.filter((b) => b.severity !== "warning").length === 0 && readinessPct >= 100,
    platformVersion: PLATFORM_V3_VERSION,
    readinessPct,
    at: new Date().toISOString(),
    durationMs: Date.now() - started,
    infrastructure,
    migration,
    bootstrap: {
      ...bootstrap,
      blockedReason: bootstrap.precheck?.ok === false
        ? `أسرار ناقصة: ${(bootstrap.precheck?.missing || []).join(", ")}`
        : bootstrap.probe?.ok === false
          ? `جداول ناقصة: ${(bootstrap.probe?.missing || []).slice(0, 5).join(", ")}`
          : null,
    },
    database,
    crons,
    security: {
      cronAuthConfigured: Boolean(env.CRON_SECRET),
      serviceRoleConfigured: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
      aiMode: env.OPENAI_API_KEY ? "semantic_embeddings" : "keyword_fallback",
    },
    audit: audit.entries || audit,
    backups: backups.snapshots || backups,
    blockers,
    ownerActions: infrastructure
      .filter((i) => !i.present && i.priority === "critical")
      .map((i) => ({
        secret: i.key,
        addTo: i.locations.join(" + "),
        impact: i.impact,
      })),
  };
}

export default buildAkpProductionHealth;
