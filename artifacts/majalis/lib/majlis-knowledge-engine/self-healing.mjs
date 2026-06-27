/**
 * Self Healing — recover cron, queue, connectors, AI providers.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getQueueStats, processQueue } from "./queue.mjs";
import { getVisionStatus } from "./vision-intelligence.mjs";
import { discoverFromSource } from "./source-registry.mjs";
import { isVisionEnabled } from "../cms/lesson-extractor.mjs";

const AI_PROVIDERS = [
  { id: "anthropic", env: "ANTHROPIC_API_KEY", primary: true },
  { id: "openai", env: "OPENAI_API_KEY", primary: false },
  { id: "google_vision", env: "GOOGLE_VISION_API_KEY", primary: false },
];

export async function runSelfHealing({ runId } = {}) {
  const actions = [];

  actions.push(await healQueue(runId));
  actions.push(await healAiProviders());
  actions.push(await healVisionPipeline());
  actions.push(await healFailedConnectors());

  const ok = actions.filter((a) => a.status === "ok").length;
  const failed = actions.filter((a) => a.status === "failed").length;

  return {
    ok: failed === 0,
    healed: ok,
    failed,
    actions,
  };
}

async function healQueue(runId) {
  try {
    const stats = await getQueueStats();
    if (stats.failed > 5) {
      const admin = getSupabaseAdmin();
      if (admin) {
        await admin
          .from("mke_queue_jobs")
          .update({ status: "retry", next_run_at: new Date().toISOString(), retry_count: 0 })
          .eq("status", "failed")
          .limit(20);
      }
    }
    const processed = await processQueue({ batchSize: 5, runId });
    return logHeal("queue", "retry_failed_jobs", "ok", { stats, processed });
  } catch (err) {
    return logHeal("queue", "retry_failed_jobs", "failed", { error: err.message });
  }
}

async function healAiProviders() {
  const available = AI_PROVIDERS.filter((p) => process.env[p.env]);
  if (available.length === 0) {
    return logHeal("ai_provider", "failover", "failed", { error: "no_ai_keys" });
  }
  const primary = available.find((p) => p.primary) || available[0];
  return logHeal("ai_provider", "select_active", "ok", {
    active: primary.id,
    fallbacks: available.filter((p) => p.id !== primary.id).map((p) => p.id),
  });
}

async function healVisionPipeline() {
  if (isVisionEnabled()) {
    return logHeal("vision", "primary_ok", "ok", getVisionStatus());
  }
  if (process.env.GOOGLE_VISION_API_KEY) {
    return logHeal("vision", "fallback_ocr", "ok", { provider: "google_vision" });
  }
  return logHeal("vision", "caption_only", "skipped", { reason: "no_vision_keys" });
}

async function healFailedConnectors() {
  const admin = getSupabaseAdmin();
  if (!admin) return logHeal("connector", "health_check", "skipped", { reason: "no_admin" });

  try {
    const { data } = await admin
      .from("mke_source_scores")
      .select("source_id, source_url, health_score, last_error")
      .lt("health_score", 30)
      .limit(5);

    const healed = [];
    for (const row of data || []) {
      const source = { id: row.source_id, source_url: row.source_url, source_name: row.source_url };
      const probe = await discoverFromSource(source);
      if (probe.ok) {
        await admin.from("mke_source_scores").update({
          health_score: 80,
          last_error: null,
          last_success_at: new Date().toISOString(),
        }).eq("source_id", row.source_id);
        healed.push(row.source_id);
      }
    }
    return logHeal("connector", "probe_unhealthy", healed.length ? "ok" : "skipped", { healed });
  } catch (err) {
    return logHeal("connector", "probe_unhealthy", "failed", { error: err.message });
  }
}

async function logHeal(component, action, status, details) {
  const entry = { component, action, status, details, at: new Date().toISOString() };
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("mke_self_heal_log").insert({
        component,
        action,
        status,
        details: details || {},
      });
    } catch {
      /* optional table */
    }
  }
  return entry;
}

export function resolveActiveAiProvider() {
  for (const p of AI_PROVIDERS) {
    if (process.env[p.env]) return p.id;
  }
  return "none";
}

export function resolveVisionFallback() {
  if (isVisionEnabled()) return "anthropic_vision";
  if (process.env.GOOGLE_VISION_API_KEY) return "google_vision";
  if (process.env.OPENAI_API_KEY) return "openai_vision";
  return "caption_heuristics";
}
