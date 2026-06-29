/**
 * AKE engine run recording — schema ensure + resilient insert (no silent failures).
 */
import { isMissingTableError } from "../supabase-admin.mjs";
import { akeLog } from "./monitoring.mjs";

const SCHEMA_FILES = [
  "auto_knowledge_engine_v13.sql",
  "auto_knowledge_engine_v14_sync.sql",
  "auto_knowledge_engine_v15_realtime.sql",
];

export async function ensureAkeEngineRunsSchema(admin) {
  if (!admin) return { ok: false, error: "no_admin" };

  const { error } = await admin.from("ake_engine_runs").select("id", { head: true, count: "exact" });
  if (!error) {
    const { error: colErr } = await admin.from("ake_engine_runs").select("import_mode").limit(0);
    if (!colErr) return { ok: true, skipped: true };
  } else if (!isMissingTableError(error)) {
    return { ok: false, error: error.message };
  }

  try {
    const { applyMigrations } = await import("../db-migrate.mjs");
    return await applyMigrations({
      files: SCHEMA_FILES,
      continueOnError: false,
      trackApplied: true,
    });
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

/**
 * @returns {Promise<{ runId: string|null, error?: string, schema?: object }>}
 */
export async function createAkeEngineRun(admin, payload = {}) {
  const schema = await ensureAkeEngineRunsSchema(admin);

  const full = {
    trigger_type: payload.trigger_type || "cron",
    status: payload.status || "running",
    import_mode: payload.import_mode,
    sync_window_from: payload.sync_window_from ?? null,
    sync_window_to: payload.sync_window_to ?? new Date().toISOString(),
    cycle_type: payload.cycle_type,
  };

  let { data, error } = await admin
    .from("ake_engine_runs")
    .insert(full)
    .select("id")
    .single();

  if (error) {
    const minimal = { trigger_type: full.trigger_type, status: full.status };
    if (full.cycle_type) minimal.cycle_type = full.cycle_type;
    ({ data, error } = await admin.from("ake_engine_runs").insert(minimal).select("id").single());
  }

  if (error) {
    akeLog("engine-run", { event: "insert_failed", error: error.message, schemaOk: schema.ok });
    return { runId: null, error: error.message, schema };
  }

  return { runId: data?.id || null, schema };
}
