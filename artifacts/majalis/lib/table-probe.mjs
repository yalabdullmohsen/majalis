/**
 * Probe Supabase tables — service role when available, else anon REST.
 */

import { getSupabaseAdmin, isMissingTableError } from "./supabase-admin.mjs";

export const ACTIVATION_TABLES = [
  "qa_categories",
  "qa_questions",
  "sharia_rulings",
  "sharia_ruling_categories",
  "mke_runs",
  "mke_queue_jobs",
  "mke_decisions",
  "mke_quality_reports",
  "mke_source_plugins",
];

export async function probeTableAdmin(table) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin_client" };
  const { error } = await admin.from(table).select("id").limit(1);
  if (error) {
    if (isMissingTableError(error)) return { ok: false, missing: true, error: error.message };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function probeTableAnon(table) {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) return { ok: false, error: "no_anon_config" };
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (res.status === 404 || res.status === 406) return { ok: false, missing: true, status: res.status };
    return { ok: res.status === 200, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function probeTables(tables = ACTIVATION_TABLES) {
  const admin = getSupabaseAdmin();
  const out = {};
  for (const table of tables) {
    const r = admin ? await probeTableAdmin(table) : await probeTableAnon(table);
    out[table] = r.ok === true;
    out[`${table}__detail`] = r;
  }
  return out;
}

export async function countTableRows(table) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { count, error } = await admin.from(table).select("id", { count: "exact", head: true });
  if (error) return null;
  return count ?? 0;
}
