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
  "content_import_jobs",
  "content_import_staging",
  "verified_adhkar_items",
  "akp_content_sources",
  "akp_pipeline_runs",
  "akp_content_fingerprints",
  "akp_review_queue",
  "akp_dead_letter_jobs",
  "akp_source_health_snapshots",
  "akp_platform_analytics_daily",
  "akp_daily_goal_progress",
  "akp_semantic_index",
  "content_scheduler_jobs",
  "content_scheduler_runs",
  "content_pipeline_sources",
  "content_production_staging",
  "content_production_review_queue",
  "content_production_retry_queue",
  "content_production_dead_letter",
  "content_production_logs",
  "content_production_health",
  "content_production_alerts",
  "content_dedup_registry",
  "content_production_published",
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
    const body = await res.text();
    if (body.includes("Could not find") || body.includes("PGRST205") || res.status === 404) {
      return { ok: false, missing: true, status: res.status };
    }
    // RLS / policy restriction — table exists but anon cannot read rows
    if ([400, 401, 403, 406].includes(res.status)) {
      return { ok: true, restricted: true, status: res.status };
    }
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
  if (admin) {
    const { count, error } = await admin.from(table).select("id", { count: "exact", head: true });
    if (error) return null;
    return count ?? 0;
  }

  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=id`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "count=exact",
      },
    });
    if (res.status === 404) return null;
    const range = res.headers.get("content-range");
    if (range) {
      const total = range.split("/")[1];
      if (total && total !== "*") return Number(total);
    }
    return res.ok ? 0 : null;
  } catch {
    return null;
  }
}
