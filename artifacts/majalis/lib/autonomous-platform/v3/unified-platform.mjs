/**
 * Unified Autonomous Production Platform — aggregates AKP v3 + GKE + Zero-Touch.
 * Single dashboard payload for /admin/autonomous-platform.
 */
import { getEnvStatus } from "../../env-config.mjs";
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { probeTables } from "../../table-probe.mjs";
import { buildAkpProductionHealth, AKP_V3_CRONS } from "./production-health.mjs";
import { PLATFORM_V3_VERSION } from "./orchestrator.mjs";
import { maybeRunAutoActivation } from "./auto-activation.mjs";
import { createAlert } from "../monitoring.mjs";

const GKE_TABLES = [
  "gke_pipeline_runs",
  "gke_events",
  "gke_trusted_sources",
  "gke_source_reputation_log",
  "gke_shadow_items",
  "gke_acquisition_metrics",
  "gke_integration_phases",
];

const REQUIRED_SECRETS = [
  { key: "DATABASE_URL", critical: true },
  { key: "SUPABASE_SERVICE_ROLE_KEY", critical: true },
  { key: "CRON_SECRET", critical: true },
  { key: "OPENAI_API_KEY", critical: false },
  { key: "ANTHROPIC_API_KEY", critical: false },
  { key: "UPSTASH_REDIS_REST_URL", critical: false },
  { key: "UPSTASH_REDIS_REST_TOKEN", critical: false },
];

function auditSecrets() {
  const env = getEnvStatus();
  return REQUIRED_SECRETS.map(({ key, critical }) => {
    let present = false;
    if (key === "UPSTASH_REDIS_REST_URL") present = Boolean(env.UPSTASH_REDIS_REST_URL);
    else if (key === "UPSTASH_REDIS_REST_TOKEN") present = Boolean(env.UPSTASH_REDIS_REST_TOKEN);
    else present = Boolean(env[key]);
    return { key, critical, present, status: present ? "configured" : "missing" };
  });
}

async function getGkeHealth() {
  try {
    const { getAcquisitionDashboard } = await import("../../global-knowledge-engine/acquisition-orchestrator.mjs");
    const { validateArchitecture } = await import("../../global-knowledge-engine/orchestrator.mjs");
    const { GKE_VERSION, GKE_PHASE, GKE_SHADOW_MODE } = await import("../../global-knowledge-engine/config.mjs");
    const { getTrustedSourcesSeed } = await import("../../global-knowledge-engine/trusted-sources/registry.mjs");

    const [dashboard, validation, tableProbe] = await Promise.all([
      getAcquisitionDashboard().catch(() => null),
      validateArchitecture().catch(() => null),
      probeTables(GKE_TABLES),
    ]);

    const gkeTablesPresent = GKE_TABLES.filter((t) => tableProbe[t] === true).length;
    const trustedSources = getTrustedSourcesSeed();

    return {
      ok: validation?.ok !== false,
      version: GKE_VERSION,
      phase: GKE_PHASE,
      shadow_mode: GKE_SHADOW_MODE,
      pipeline_layers: validation?.layers || [],
      pipeline_ok: validation?.ok ?? false,
      tables: { expected: GKE_TABLES.length, present: gkeTablesPresent, missing: GKE_TABLES.filter((t) => !tableProbe[t]) },
      trusted_sources_count: trustedSources.length,
      acquisition: dashboard,
      metrics: dashboard?.metrics || null,
      production_ready: dashboard?.production_ready || { ready: false },
    };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

async function getQueueHealth() {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, status: "unknown", reason: "no_admin" };

  const queues = {};
  for (const table of ["ake_job_queue", "akp_dead_letter_jobs", "content_import_jobs"]) {
    try {
      const { count } = await admin.from(table).select("id", { count: "exact", head: true });
      queues[table] = { total: count ?? null };
    } catch {
      queues[table] = { total: null, error: "table_unavailable" };
    }
  }

  const dlqCount = queues.akp_dead_letter_jobs?.total ?? 0;
  return {
    ok: true,
    status: dlqCount > 50 ? "degraded" : dlqCount > 0 ? "partial" : "operational",
    queues,
    dlq_count: dlqCount,
  };
}

async function getTodayStats() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { published_today: 0, failed_today: 0, imported_today: 0, review_queue: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const since = today.toISOString();

  const stats = { published_today: 0, failed_today: 0, imported_today: 0, review_queue: 0, duplicate_rate: 0, quality_average: 0 };

  try {
    const { count: published } = await admin
      .from("akp_pipeline_runs")
      .select("id", { count: "exact", head: true })
      .gte("started_at", since)
      .eq("status", "completed");
    stats.published_today = published || 0;
  } catch { /* optional */ }

  try {
    const { count: failed } = await admin
      .from("akp_pipeline_runs")
      .select("id", { count: "exact", head: true })
      .gte("started_at", since)
      .eq("status", "failed");
    stats.failed_today = failed || 0;
  } catch { /* optional */ }

  try {
    const { count: shadow } = await admin
      .from("gke_shadow_items")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    stats.imported_today = shadow || 0;
  } catch { /* optional */ }

  try {
    const { count: review } = await admin
      .from("gke_shadow_items")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending_review", "review"]);
    stats.review_queue = review || 0;
  } catch { /* optional */ }

  try {
    const { data: metrics } = await admin
      .from("gke_acquisition_metrics")
      .select("duplicate_rate, avg_quality_score")
      .order("metric_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (metrics) {
      stats.duplicate_rate = metrics.duplicate_rate ?? 0;
      stats.quality_average = metrics.avg_quality_score ?? 0;
    }
  } catch { /* optional */ }

  return stats;
}

function computeUnifiedHealthScore({ akp, gke, secrets, queue, today }) {
  const weights = {
    secrets: 20,
    akp: 25,
    gke: 20,
    crons: 15,
    queue: 10,
    pipeline: 10,
  };

  const criticalMissing = secrets.filter((s) => s.critical && !s.present).length;
  const secretsScore = Math.max(0, 100 - criticalMissing * 25);

  const akpScore = akp?.readinessPct ?? 0;

  const gkeTablesPct = gke?.tables
    ? Math.round((gke.tables.present / Math.max(1, gke.tables.expected)) * 100)
    : 0;
  const gkePipelineScore = gke?.pipeline_ok ? 100 : 50;
  const gkeScore = Math.round((gkeTablesPct + gkePipelineScore) / 2);

  const cronRuns = akp?.crons?.crons?.filter((c) => c.lastRun).length ?? 0;
  const cronTotal = akp?.crons?.crons?.length ?? AKP_V3_CRONS.length;
  const cronScore = cronTotal > 0 ? Math.round((cronRuns / cronTotal) * 100) : 30;

  const queueScore = queue?.status === "operational" ? 100 : queue?.status === "partial" ? 60 : 30;

  const pipelineRuns = akp?.database?.pipelineRuns?.length ?? 0;
  const pipelineScore = pipelineRuns > 0 ? 100 : (akp?.database?.sources?.db ?? 0) > 0 ? 40 : 0;

  const total =
    (secretsScore / 100) * weights.secrets +
    (akpScore / 100) * weights.akp +
    (gkeScore / 100) * weights.gke +
    (cronScore / 100) * weights.crons +
    (queueScore / 100) * weights.queue +
    (pipelineScore / 100) * weights.pipeline;

  return {
    healthScore: Math.min(100, Math.round(total)),
    breakdown: {
      secrets: { score: secretsScore, weight: weights.secrets },
      akp: { score: akpScore, weight: weights.akp },
      gke: { score: gkeScore, weight: weights.gke },
      crons: { score: cronScore, weight: weights.crons },
      queue: { score: queueScore, weight: weights.queue },
      pipeline: { score: pipelineScore, weight: weights.pipeline },
    },
    operational: total >= 90 && criticalMissing === 0,
  };
}

function collectAlerts({ akp, gke, secrets, queue, today }) {
  const alerts = [];

  for (const s of secrets.filter((x) => x.critical && !x.present)) {
    alerts.push({ severity: "error", code: "missing_secret", message: `Secret مفقود: ${s.key}`, component: "infrastructure" });
  }
  for (const s of secrets.filter((x) => !x.critical && !x.present)) {
    alerts.push({ severity: "warning", code: "optional_secret", message: `Secret اختياري مفقود: ${s.key}`, component: "infrastructure" });
  }

  for (const b of akp?.blockers || []) {
    if (b.severity !== "warning") {
      alerts.push({ severity: "error", code: b.type, message: b.impact, component: "akp" });
    }
  }

  if (gke?.tables?.missing?.length) {
    alerts.push({
      severity: "warning",
      code: "gke_tables_missing",
      message: `جداول GKE ناقصة: ${gke.tables.missing.join(", ")}`,
      component: "gke",
    });
  }

  if (gke?.shadow_mode) {
    alerts.push({
      severity: "info",
      code: "shadow_mode",
      message: "Shadow Mode مفعّل — لا نشر تلقائي حتى اكتمال الاختبار",
      component: "gke",
    });
  }

  if ((queue?.dlq_count ?? 0) > 0) {
    alerts.push({
      severity: queue.dlq_count > 10 ? "error" : "warning",
      code: "dlq_pending",
      message: `${queue.dlq_count} مهمة في Dead Letter Queue`,
      component: "queue",
    });
  }

  if ((today?.duplicate_rate ?? 0) > 15) {
    alerts.push({
      severity: "warning",
      code: "high_duplicate_rate",
      message: `معدل التكرار مرتفع: ${today.duplicate_rate}%`,
      component: "quality",
    });
  }

  if ((today?.quality_average ?? 0) > 0 && today.quality_average < 70) {
    alerts.push({
      severity: "warning",
      code: "low_quality",
      message: `متوسط الجودة منخفض: ${today.quality_average}`,
      component: "quality",
    });
  }

  const staleCrons = (akp?.crons?.crons || []).filter((c) => c.enabled !== false && !c.lastRun);
  if (staleCrons.length > 3) {
    alerts.push({
      severity: "warning",
      code: "cron_stale",
      message: `${staleCrons.length} cron jobs لم تُشغَّل بعد`,
      component: "cron",
    });
  }

  return alerts;
}

/**
 * Build unified autonomous platform dashboard payload.
 */
export async function buildUnifiedAutonomousPlatform(options = {}) {
  const started = Date.now();

  const [akp, gke, queue, today] = await Promise.all([
    buildAkpProductionHealth({ runAutoActivation: options.runAutoActivation }),
    getGkeHealth(),
    getQueueHealth(),
    getTodayStats(),
  ]);

  const secrets = auditSecrets();
  const { healthScore, breakdown, operational } = computeUnifiedHealthScore({ akp, gke, secrets, queue, today });
  const alerts = collectAlerts({ akp, gke, secrets, queue, today });

  const lastError =
    akp.database?.selfHealing?.find((e) => !e.success)?.action_taken ||
    gke.acquisition?.recent_errors?.[0]?.error ||
    null;

  const lastSuccessfulRun =
    akp.database?.pipelineRuns?.[0]?.started_at ||
    akp.crons?.crons?.find((c) => c.lastSuccess)?.lastSuccess ||
    null;

  return {
    ok: operational,
    healthScore,
    healthScoreTarget: 90,
    operational,
    platformVersion: PLATFORM_V3_VERSION,
    gkeVersion: gke.version,
    at: new Date().toISOString(),
    durationMs: Date.now() - started,
    breakdown,
    secrets,
    missingSecrets: secrets.filter((s) => !s.present).map((s) => s.key),
    criticalSecretsMissing: secrets.filter((s) => s.critical && !s.present).map((s) => s.key),
    akp,
    gke,
    queue,
    today,
    alerts,
    crons: akp.crons,
    workers: {
      akp_v3: { status: akp.database?.pipelineStatus?.state || "unknown", label: akp.database?.pipelineStatus?.label },
      gke_acquisition: { status: gke.shadow_mode ? "shadow" : "active", label: gke.shadow_mode ? "Shadow Mode" : "Active" },
      queue: { status: queue.status, dlq: queue.dlq_count },
    },
    import_jobs: {
      akp_sources: akp.database?.sources?.db ?? 0,
      gke_trusted_sources: gke.trusted_sources_count ?? 0,
      imported_today: today.imported_today,
      review_queue: today.review_queue,
      auto_published_today: today.published_today,
      failed_today: today.failed_today,
      duplicate_rate: today.duplicate_rate,
      quality_average: today.quality_average,
    },
    lastSuccessfulRun,
    lastError,
    shadow_mode: gke.shadow_mode ?? true,
    auto_publish_enabled: false,
    note: operational
      ? "المنصة تعمل ضمن المعايير المستهدفة"
      : "المنصة غير جاهزة 100% — راجع العوائق والأسرار الناقصة",
  };
}

/** Run unified platform cycle: AKP full + GKE shadow acquisition */
export async function runUnifiedPlatformCycle(opts = {}) {
  const { runAutonomousPlatformV3 } = await import("./orchestrator.mjs");
  const { initializeAcquisition, runShadowAcquisitionForSource } = await import(
    "../../global-knowledge-engine/acquisition-orchestrator.mjs"
  );
  const { listSources } = await import("../../global-knowledge-engine/layers/source-registry.mjs");

  const results = { akp: null, gke: { init: null, sources: [] } };

  results.akp = await runAutonomousPlatformV3({ mode: opts.mode || "full", triggerType: opts.triggerType || "unified" });

  results.gke.init = await initializeAcquisition();
  const { data: sources } = await listSources({ activeOnly: true });
  const limit = opts.sourceLimit ?? 3;
  for (const source of (sources || []).slice(0, limit)) {
    const r = await runShadowAcquisitionForSource(source.slug);
    results.gke.sources.push({ slug: source.slug, ...r });
  }

  await createAlert({
    severity: "info",
    component: "unified-platform",
    title: "دورة المنصة الموحدة",
    message: `AKP + GKE shadow — ${results.gke.sources.length} مصادر`,
    metadata: { mode: opts.mode || "full" },
  });

  return { ok: true, results };
}

/** Retry failed DLQ + re-run health */
export async function retryUnifiedFailures() {
  const { healDeadLetterJobs } = await import("./self-healing.mjs");
  const { runHealthMonitoringCycle } = await import("./health-monitor.mjs");
  const dlq = await healDeadLetterJobs({ limit: 20, requeue: true });
  const health = await runHealthMonitoringCycle({ limit: 10 });
  return { ok: true, dlq, health };
}

/** Pause/resume GKE trusted source */
export async function pauseGkeSource(slug, paused = true) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };
  const { error } = await admin
    .from("gke_trusted_sources")
    .update({ is_active: !paused, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (error) return { ok: false, error: error.message };
  return { ok: true, slug, paused };
}

/** Zero-touch post-deploy activation with GKE checks */
export async function runUnifiedZeroTouchActivation(options = {}) {
  const phases = {};
  phases.autoActivation = await maybeRunAutoActivation({ force: options.force });

  try {
    const { initializeAcquisition } = await import("../../global-knowledge-engine/acquisition-orchestrator.mjs");
    const { validateArchitecture } = await import("../../global-knowledge-engine/orchestrator.mjs");
    phases.gkeInit = await initializeAcquisition();
    phases.gkeValidation = await validateArchitecture();
  } catch (err) {
    phases.gkeInit = { ok: false, error: String(err.message || err) };
  }

  phases.dashboard = await buildUnifiedAutonomousPlatform({ runAutoActivation: false });

  return {
    ok: phases.dashboard.healthScore >= (options.minHealthScore || 60),
    phases,
    healthScore: phases.dashboard.healthScore,
    missingSecrets: phases.dashboard.missingSecrets,
  };
}

export default buildUnifiedAutonomousPlatform;
