/**
 * Content engine work queue — resume cursors, drain loop, stale-run recovery.
 * State stored in content_engine_config.config (no restart-from-zero).
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { CRON_ORDER } from "./orchestrator.mjs";
import { runContentEngine } from "./orchestrator.mjs";
import { DRAIN_BUDGET_MS, STALE_RUN_MS } from "./budget.mjs";

export async function getEngineConfig(admin, engineId) {
  if (!admin) return {};
  const { data } = await admin.from("content_engine_config").select("config").eq("id", engineId).maybeSingle();
  return data?.config && typeof data.config === "object" ? data.config : {};
}

export async function patchEngineConfig(admin, engineId, patch) {
  if (!admin) return;
  const current = await getEngineConfig(admin, engineId);
  await admin
    .from("content_engine_config")
    .update({
      config: { ...current, ...patch, updated_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    .eq("id", engineId);
}

export async function getEngineCursor(admin, engineId, key = "cursor") {
  const config = await getEngineConfig(admin, engineId);
  return config[key] || 0;
}

export async function saveEngineCursor(admin, engineId, cursor, key = "cursor") {
  await patchEngineConfig(admin, engineId, { [key]: cursor });
}

/** Mark runs stuck in `running` as partial so dashboards stay accurate. */
export async function recoverStaleEngineRuns(admin, maxAgeMs = STALE_RUN_MS) {
  if (!admin) return { recovered: 0 };
  const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
  const { data } = await admin
    .from("content_engine_runs")
    .update({
      status: "partial",
      error_message: "stale_run_recovered",
      finished_at: new Date().toISOString(),
    })
    .eq("status", "running")
    .lt("started_at", cutoff)
    .select("id");
  return { recovered: data?.length || 0 };
}

/** Engines with pending backfill or non-zero cursor work. */
export async function listEnginesWithPendingWork(admin) {
  if (!admin) return [];
  const pending = [];

  const { data: backfills } = await admin
    .from("content_engine_backfill_status")
    .select("engine_id, month_key, status, report")
    .eq("status", "running");
  for (const row of backfills || []) {
    pending.push({ engineId: "backfill", reason: "backfill_running", monthKey: row.month_key });
  }

  const { data: configs } = await admin.from("content_engine_config").select("id, config").eq("enabled", true);
  for (const row of configs || []) {
    const cfg = row.config || {};
    if (Array.isArray(cfg.queue) && cfg.queue.length > 0) {
      pending.push({ engineId: row.id, reason: "queue", size: cfg.queue.length });
    }
  }
  return pending;
}

export async function enqueueEngineWork(admin, engineId, jobs) {
  if (!admin || !jobs?.length) return 0;
  const config = await getEngineConfig(admin, engineId);
  const queue = Array.isArray(config.queue) ? config.queue : [];
  const merged = [...queue, ...jobs.map((j) => ({ ...j, enqueued_at: new Date().toISOString() }))];
  await patchEngineConfig(admin, engineId, { queue: merged });
  return merged.length;
}

export async function dequeueEngineWork(admin, engineId, limit = 3) {
  const config = await getEngineConfig(admin, engineId);
  const queue = Array.isArray(config.queue) ? config.queue : [];
  const batch = queue.slice(0, limit);
  const rest = queue.slice(limit);
  await patchEngineConfig(admin, engineId, { queue: rest });
  return { batch, remaining: rest.length };
}

/**
 * Drain content-engine work until budget exhausted.
 * Priority: explicit engine query → backfill resume → queued jobs → rotate CRON_ORDER.
 */
export async function drainContentEngineQueue(options = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const budgetMs = options.budgetMs || DRAIN_BUDGET_MS;
  const started = Date.now();
  const results = [];

  await recoverStaleEngineRuns(admin);

  const targetEngine = options.engineId || null;
  const engineIds = targetEngine ? [targetEngine] : pickDrainEngineOrder(options.slot);

  for (const engineId of engineIds) {
    if (Date.now() - started >= budgetMs - 2_000) break;

    const remaining = budgetMs - (Date.now() - started);
    const result = await runContentEngine(engineId, {
      runType: "cron",
      budgetMs: remaining,
      drain: true,
      force: options.force,
    });
    results.push({ engineId, ...result });

    if (result.ok && (result.stats?.items_published > 0 || result.resumed)) {
      break;
    }
  }

  return {
    ok: true,
    processed: results.length,
    results,
    durationMs: Date.now() - started,
    pending: await listEnginesWithPendingWork(admin),
  };
}

function pickDrainEngineOrder(slot) {
  const idx = Number.isFinite(slot) ? slot % CRON_ORDER.length : Math.floor(Date.now() / 60_000) % CRON_ORDER.length;
  return [...CRON_ORDER.slice(idx), ...CRON_ORDER.slice(0, idx)];
}
