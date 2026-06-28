/**
 * Cron run tracking — records every monitored cron invocation.
 */

import { getSupabaseAdmin, isMissingTableError } from "../../supabase-admin.mjs";
import { getCronDefinition } from "./cron-registry.mjs";
import { akeLog } from "../monitoring.mjs";

export async function beginCronRun(cronName, { schedule, metadata } = {}) {
  const admin = getSupabaseAdmin();
  const def = getCronDefinition(cronName);
  const row = {
    cron_name: cronName,
    schedule: schedule || def?.schedule || null,
    status: "running",
    metadata: metadata || {},
  };

  if (!admin) {
    akeLog("cron-track", { event: "begin", cronName, ...row });
    return { id: null, startedAt: Date.now() };
  }

  try {
    const { data, error } = await admin.from("ake_cron_runs").insert(row).select("id").single();
    if (error) throw error;
    return { id: data?.id, startedAt: Date.now() };
  } catch (err) {
    if (!isMissingTableError(err)) akeLog("cron-track", { error: err.message }, "error");
    return { id: null, startedAt: Date.now() };
  }
}

export async function finishCronRun(runRef, { ok = true, error, result, metadata } = {}) {
  const admin = getSupabaseAdmin();
  const durationMs = Date.now() - (runRef?.startedAt || Date.now());
  const status = ok ? "success" : "failed";
  const patch = {
    status,
    finished_at: new Date().toISOString(),
    duration_ms: durationMs,
    error_message: error?.message || (typeof error === "string" ? error : null),
    error_stack: error?.stack || null,
    metadata: { ...(metadata || {}), resultSummary: summarizeResult(result) },
  };
  if (ok) patch.last_success_at = new Date().toISOString();

  if (!admin || !runRef?.id) {
    akeLog("cron-track", { event: "finish", status, durationMs, error: patch.error_message });
    return patch;
  }

  try {
    await admin.from("ake_cron_runs").update(patch).eq("id", runRef.id);
  } catch (err) {
    if (!isMissingTableError(err)) akeLog("cron-track", { error: err.message }, "error");
  }
  return patch;
}

function summarizeResult(result) {
  if (!result || typeof result !== "object") return null;
  return {
    ok: result.ok,
    published: result.published ?? result.published_count,
    fetched: result.fetched ?? result.fetched_count,
    error: result.error,
  };
}

export async function withCronTracking(cronName, fn, options = {}) {
  const runRef = await beginCronRun(cronName, options);
  try {
    const result = await fn();
    const ok = result?.ok !== false;
    await finishCronRun(runRef, { ok, result, metadata: options.metadata });
    return result;
  } catch (err) {
    await finishCronRun(runRef, { ok: false, error: err, metadata: options.metadata });
    throw err;
  }
}

export async function getCronHealth(limit = 30) {
  const admin = getSupabaseAdmin();
  if (!admin) return { crons: [], recent: [] };

  try {
    const { data: recent } = await admin
      .from("ake_cron_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);

    const byName = {};
    for (const row of recent || []) {
      if (!byName[row.cron_name]) byName[row.cron_name] = row;
    }

    return { crons: Object.values(byName), recent: recent || [] };
  } catch {
    return { crons: [], recent: [] };
  }
}

export async function getLastCronRun(cronName) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  try {
    const { data } = await admin
      .from("ake_cron_runs")
      .select("*")
      .eq("cron_name", cronName)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}
