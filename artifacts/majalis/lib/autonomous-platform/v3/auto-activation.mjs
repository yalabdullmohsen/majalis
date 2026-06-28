/**
 * Auto-activation when secrets become available — zero manual steps after deploy.
 * Runs: Migration → Seed → First Pipeline → Analytics Snapshot
 */
import { getEnvStatus } from "../../env-config.mjs";
import { runActivationTableMigrations } from "../../migration-runner.mjs";
import { probeTables } from "../../table-probe.mjs";
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { seedContentSourcesFromJson } from "../sources.mjs";
import { runAutonomousPlatformV3 } from "./orchestrator.mjs";
import { buildProductionAnalytics } from "./analytics.mjs";
import { AKP_V3_TABLES } from "./production-health.mjs";
import { logStructured } from "../monitoring.mjs";

const ACTIVATION_META_KEY = "auto_activation_v3";

async function getActivationState() {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  try {
    const { data } = await admin.from("akp_scheduler_state").select("metadata").eq("id", "default").maybeSingle();
    return data?.metadata?.[ACTIVATION_META_KEY] || null;
  } catch {
    return null;
  }
}

async function saveActivationState(state) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    const { data: existing } = await admin.from("akp_scheduler_state").select("metadata").eq("id", "default").maybeSingle();
    const metadata = { ...(existing?.metadata || {}), [ACTIVATION_META_KEY]: state };
    await admin.from("akp_scheduler_state").upsert({ id: "default", metadata, updated_at: new Date().toISOString() });
  } catch {
    /* scheduler table may not exist yet */
  }
}

function secretsReady() {
  const env = getEnvStatus();
  return Boolean(
    env.DATABASE_URL &&
      env.SUPABASE_SERVICE_ROLE_KEY &&
      env.SUPABASE_URL &&
      env.SUPABASE_ANON_KEY,
  );
}

export async function maybeRunAutoActivation(options = {}) {
  const started = Date.now();
  const phases = {};
  const blockers = [];

  if (!secretsReady()) {
    const env = getEnvStatus();
    const missing = [];
    if (!env.DATABASE_URL) missing.push("DATABASE_URL");
    if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!env.SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
    return {
      ok: false,
      skipped: true,
      reason: "secrets_incomplete",
      missing,
      message: `Auto-activation waiting for: ${missing.join(", ")}`,
      phases,
    };
  }

  const prior = await getActivationState();
  if (prior?.completedAt && !options.force) {
    return { ok: true, skipped: true, reason: "already_completed", prior, phases };
  }

  await logStructured({
    level: "info",
    component: "akp-v3",
    event: "auto_activation_start",
    metadata: { force: Boolean(options.force) },
  });

  // 1. Migration
  const probedBefore = await probeTables(AKP_V3_TABLES);
  const missingBefore = AKP_V3_TABLES.filter((t) => probedBefore[t] !== true);
  if (missingBefore.length > 0) {
    const migration = await runActivationTableMigrations({ seedRulings: false });
    phases.migration = migration;
    if (!migration.ok) {
      blockers.push({ phase: "migration", error: migration.migration?.error || migration.missing?.join(", ") });
      await saveActivationState({ lastAttempt: new Date().toISOString(), phases, blockers, completedAt: null });
      return { ok: false, phases, blockers, durationMs: Date.now() - started };
    }
  } else {
    phases.migration = { ok: true, skipped: true, reason: "tables_present" };
  }

  // 2. Seed sources
  const admin = getSupabaseAdmin();
  let sourceCount = 0;
  if (admin) {
    const { count } = await admin.from("akp_content_sources").select("id", { count: "exact", head: true });
    sourceCount = count || 0;
  }
  if (sourceCount === 0) {
    const seeded = await seedContentSourcesFromJson();
    phases.seed = seeded;
    if (!seeded.ok) {
      blockers.push({ phase: "seed", error: seeded.error || "seed_failed" });
    }
  } else {
    phases.seed = { ok: true, skipped: true, count: sourceCount };
  }

  // 3. First pipeline
  const pipeline = await runAutonomousPlatformV3({ mode: "full", triggerType: "auto_activation" });
  phases.pipeline = { ok: pipeline.ok !== false, mode: "full", summary: pipeline.summary || pipeline };

  // 4. Analytics snapshot
  const analytics = await buildProductionAnalytics();
  phases.analytics = { ok: true, generatedAt: analytics.generatedAt || new Date().toISOString() };

  const completedAt = new Date().toISOString();
  const state = { completedAt, phases, blockers, lastAttempt: completedAt };
  await saveActivationState(state);

  await logStructured({
    level: "info",
    component: "akp-v3",
    event: "auto_activation_complete",
    metadata: { blockers: blockers.length, durationMs: Date.now() - started },
  });

  return {
    ok: blockers.length === 0,
    phases,
    blockers,
    completedAt,
    durationMs: Date.now() - started,
    message: blockers.length === 0 ? "Auto-activation completed" : "Auto-activation partial — see blockers",
  };
}
