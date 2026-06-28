/**
 * Continuous 15-minute AKE cycle — recovery, due connectors, queue drain, metrics, alerts.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { runAutoKnowledgeEngine, runConnectorHealthChecks } from "./orchestrator.mjs";
import { filterDueConnectors, shouldAutoDisable, isPermanentFetchError } from "./connector-scheduler.mjs";
import { recoverInterruptedWork } from "./recovery.mjs";
import { drainAkeQueue, getQueueSize } from "./queue-processor.mjs";
import { evaluateAkeAlerts, getOpenAlerts } from "./alerts.mjs";
import { recordSourceHealthEvent } from "./monitoring/source-health-events.mjs";
import { cacheClear } from "./cache.mjs";
import { akeLog } from "./monitoring.mjs";

const CYCLE_BUDGET_MS = 55_000;
const CONNECTOR_TIME_BUDGET_MS = 35_000;

export async function runContinuousAkeCycle(options = {}) {
  const started = Date.now();
  const admin = getSupabaseAdmin();
  const budgetMs = options.budgetMs || CYCLE_BUDGET_MS;

  if (!admin) {
    return { ok: false, error: "Supabase not configured" };
  }

  let runId = null;
  try {
    const { data: runRow } = await admin.from("ake_engine_runs").insert({
      trigger_type: options.triggerType || "cron",
      status: "running",
      cycle_type: "continuous",
      import_mode: "incremental",
    }).select("id").single();
    runId = runRow?.id;
  } catch {
    /* optional */
  }

  const recovery = await recoverInterruptedWork(admin, runId, { recoveryLimit: options.recoveryLimit || 6 });

  const { data: connectorRows } = await admin.from("ake_connectors").select("*");
  const health = await runConnectorHealthChecks();
  for (const h of health.results || []) {
    if (!h.healthy && h.error && isPermanentFetchError(h.error)) {
      try {
        const connector = (connectorRows || []).find((c) => c.slug === h.slug) || { slug: h.slug };
        await admin.from("ake_connectors").update({
          auto_disabled_at: new Date().toISOString(),
          is_active: false,
          last_error: h.error,
        }).eq("slug", h.slug);
        await recordSourceHealthEvent({
          sourceId: connector.id,
          connectorSlug: h.slug,
          connectorType: connector.connector_type,
          eventType: "auto_disabled",
          failureReason: h.error,
          errorMessage: h.error,
          metadata: { sourceUrl: connector.base_url || connector.url, lastSuccessfulSync: connector.last_success_at },
        });
      } catch {
        /* ignore */
      }
    }
  }

  cacheClear("ake:");
  const allConnectors = (connectorRows || []).filter((c) => c.is_active);
  const dueSlugs = filterDueConnectors(allConnectors || []).map((c) => c.slug);

  akeLog("continuous", { action: "due_connectors", count: dueSlugs.length, slugs: dueSlugs });

  let engine = { fetched: 0, parsed: 0, published: 0, enriched: 0, duplicate: 0, rejected: 0, processed: 0, indexed: 0 };
  if (dueSlugs.length > 0 && Date.now() - started < CONNECTOR_TIME_BUDGET_MS) {
    engine = await runAutoKnowledgeEngine({
      triggerType: options.triggerType || "cron",
      importMode: "incremental",
      maxItemsPerConnector: options.maxItemsPerConnector || 8,
      maxConnectors: dueSlugs.length,
      dueConnectorSlugs: dueSlugs,
      checkLinks: false,
    });
  }

  const remaining = budgetMs - (Date.now() - started);
  const queue = remaining > 5_000
    ? await drainAkeQueue({ budgetMs: Math.min(remaining - 2_000, 40_000), batchSize: 5 })
    : { processed: 0, published: 0, queueSize: await getQueueSize(admin) };

  const durationMs = Date.now() - started;
  const queueSize = queue.queueSize ?? await getQueueSize(admin);

  const metrics = {
    run_id: runId,
    cycle_type: "continuous",
    discovered: engine.rawFetched || engine.fetched || 0,
    fetched: engine.fetched || 0,
    parsed: engine.parsed || 0,
    published: (engine.published || 0) + (queue.published || 0),
    rejected: engine.rejected || 0,
    recovered: recovery.recovered || 0,
    retried: (recovery.retried || 0) + (queue.processed || 0),
    duplicates: engine.duplicate || 0,
    queue_size: queueSize,
    avg_latency_ms: durationMs,
    connectors_checked: health.checked || 0,
    connectors_due: dueSlugs.length,
    success_rate: engine.published > 0 ? 100 : (engine.processed > 0 ? 50 : 0),
    duration_ms: durationMs,
    metadata: { dueSlugs, recovery, queue },
  };

  try {
    await admin.from("ake_cycle_metrics").insert(metrics);
    await admin.from("ake_scheduler_state").upsert({
      id: "global",
      last_cycle_at: new Date().toISOString(),
      last_cycle_duration_ms: durationMs,
      last_published_at: metrics.published > 0 ? new Date().toISOString() : undefined,
      last_queue_drain_at: queue.processed > 0 ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

    for (const c of allConnectors || []) {
      if (shouldAutoDisable(c) && !c.auto_disabled_at) {
        await admin.from("ake_connectors").update({
          auto_disabled_at: new Date().toISOString(),
          is_active: false,
        }).eq("id", c.id);
      }
      await admin.from("ake_connectors").update({
        last_checked_at: new Date().toISOString(),
      }).eq("id", c.id);
    }

    if (runId) {
      await admin.from("ake_engine_runs").update({
        status: "completed",
        cycle_type: "continuous",
        fetched_count: metrics.fetched,
        processed_count: engine.processed || 0,
        published_count: metrics.published,
        rejected_count: metrics.rejected,
        duplicate_count: metrics.duplicates,
        enriched_count: engine.enriched || 0,
        indexed_count: engine.indexed || 0,
        duration_ms: durationMs,
        finished_at: new Date().toISOString(),
        summary: metrics,
      }).eq("id", runId);
    }
  } catch {
    /* tables may not exist yet */
  }

  const downConnectors = (health.results || []).filter((r) => !r.healthy);

  let schedulerLastPublished = null;
  try {
    const { data: sched } = await admin.from("ake_scheduler_state").select("last_published_at").eq("id", "global").maybeSingle();
    schedulerLastPublished = sched?.last_published_at;
  } catch {
    /* optional */
  }

  await evaluateAkeAlerts({
    lastPublishedAt: metrics.published > 0 ? new Date().toISOString() : schedulerLastPublished,
    queueSize,
    downConnectors,
    publishFailures: engine.rejected || 0,
    databaseDown: false,
    aiDown: false,
  });

  const openAlerts = await getOpenAlerts(5);

  return {
    ok: true,
    runId,
    continuous: true,
    ...metrics,
    recovery,
    queue,
    health: { checked: health.checked, down: downConnectors.length },
    alerts: openAlerts,
    durationMs,
  };
}
