/**
 * GKE Monitoring — aggregates health from layers and existing subsystems.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { GKE_VERSION, GKE_PHASE } from "./config.mjs";
import { LAYER_MODULES } from "./layers/index.mjs";
import { validatePipelineWiring } from "./pipeline.mjs";

export async function getLayerHealth() {
  const layers = Object.values(LAYER_MODULES).map((mod) => mod.getStatus());
  const wiring = await validatePipelineWiring();
  const activeCount = layers.filter((l) => l.status === "active").length;
  const pendingCount = layers.filter((l) => l.status === "pending").length;
  return { layers, wiring, activeCount, pendingCount, total: layers.length };
}

export async function getSubsystemSnapshot() {
  const admin = getSupabaseAdmin();
  const subsystems = {
    supabase: { status: admin ? "connected" : "offline" },
    ake: { status: "delegated", path: "auto-knowledge-engine" },
    mke: { status: "delegated", path: "majlis-knowledge-engine" },
    cms: { status: "delegated", path: "cms/content-registry" },
    search: { status: "delegated", path: "scholarly-intelligence/unified-search" },
  };

  if (admin) {
    for (const [key, table] of [
      ["knowledgeItems", "knowledge_items"],
      ["akeConnectors", "ake_connectors"],
      ["akeJobQueue", "ake_job_queue"],
    ]) {
      try {
        const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
        subsystems[key] = { status: error ? "error" : "ok", count: count ?? 0, table, error: error?.message };
      } catch (err) {
        subsystems[key] = { status: "error", count: null, table, error: String(err?.message || err) };
      }
    }
  }

  return subsystems;
}

/** @returns {Promise<import('./types.mjs').GkeHealthReport>} */
export async function getHealthDashboard() {
  const { layers, wiring, activeCount, total } = await getLayerHealth();
  const subsystems = await getSubsystemSnapshot();
  const score = wiring.ok ? Math.round((activeCount / total) * 40 + 60) : 40;

  return {
    version: GKE_VERSION,
    phase: GKE_PHASE,
    status: wiring.ok ? "architecture_ready" : "degraded",
    score,
    layers,
    subsystems,
    wiring,
    principles: [
      "Architecture First",
      "Single Source of Truth",
      "Zero Duplication",
      "Event Driven",
      "AI Assisted (no fabrication)",
    ],
  };
}
