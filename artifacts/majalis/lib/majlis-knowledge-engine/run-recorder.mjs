/**
 * MKE run recording — schema ensure + resilient insert (no silent failures).
 */
import { isMissingTableError } from "../supabase-admin.mjs";

const SCHEMA_FILES = ["majlis_knowledge_engine_v1.sql", "majlis_knowledge_engine_v2.sql"];

export async function ensureMkeRunsSchema(admin) {
  if (!admin) return { ok: false, error: "no_admin" };

  const { error } = await admin.from("mke_runs").select("id", { head: true, count: "exact" });
  if (!error) return { ok: true, skipped: true };
  if (!isMissingTableError(error)) return { ok: false, error: error.message };

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
 * @returns {Promise<{ runId: string|null, startedAt: number, error?: string, schema?: object }>}
 */
export async function startMkeRun(admin, triggerType = "cron", mode = "full") {
  const startedAt = Date.now();
  if (!admin) return { runId: null, startedAt, error: "no_admin" };

  const schema = await ensureMkeRunsSchema(admin);
  const { data, error } = await admin
    .from("mke_runs")
    .insert({ trigger_type: triggerType, mode, status: "running" })
    .select("id")
    .single();

  if (error) {
    console.error("[mke:run-recorder] insert_failed", error.message);
    return { runId: null, startedAt, error: error.message, schema };
  }

  return { runId: data?.id || null, startedAt, schema };
}
