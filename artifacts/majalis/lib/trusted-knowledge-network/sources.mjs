/**
 * TKN source management — wraps AKP sources with Phase 5 metrics.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import {
  listContentSources,
  upsertContentSource,
  normalizeSource,
} from "../autonomous-platform/sources.mjs";
import { SUPPORTED_SOURCE_TYPES, SOURCE_TYPE_LABELS } from "./config.mjs";
import { listConnectors } from "./connectors/index.mjs";

export { listContentSources, upsertContentSource, normalizeSource, SUPPORTED_SOURCE_TYPES, SOURCE_TYPE_LABELS, listConnectors };

export async function listSourcesWithStats({ activeOnly = false } = {}) {
  const sources = await listContentSources({ activeOnly: !activeOnly ? false : true });
  const admin = getSupabaseAdmin();

  if (admin) {
    try {
      let q = admin.from("akp_content_sources").select("*").order("priority", { ascending: false });
      if (activeOnly) q = q.eq("active", true);
      const { data } = await q;
      if (data?.length) {
        return data.map((row) => enrichSource(row));
      }
    } catch {
      /* fallback */
    }
  }

  return sources.map((s) => enrichSource(s));
}

function enrichSource(row) {
  const s = normalizeSource(row);
  return {
    ...s,
    success_rate: Number(row.success_rate ?? 0),
    items_imported: Number(row.items_imported ?? 0),
    items_published: Number(row.items_published ?? 0),
    items_rejected: Number(row.items_rejected ?? 0),
    fetch_count: Number(row.fetch_count ?? 0),
    success_count: Number(row.success_count ?? 0),
    last_sync_at: row.last_sync_at || row.last_fetch_at,
    connector_config: row.connector_config || row.metadata?.connector_config || {},
    type_label: SOURCE_TYPE_LABELS[s.source_type] || s.source_type,
  };
}

export async function toggleSource(sourceId, active) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };
  const { error } = await admin.from("akp_content_sources").update({ active, updated_at: new Date().toISOString() }).eq("id", sourceId);
  return error ? { ok: false, error: error.message } : { ok: true, active };
}

export async function listSourceOperations(sourceId, limit = 50) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  try {
    let q = admin.from("tkn_source_operations_log").select("*").order("created_at", { ascending: false }).limit(limit);
    if (sourceId) q = q.eq("source_id", sourceId);
    const { data } = await q;
    return data || [];
  } catch {
    return [];
  }
}

export async function getSourceById(sourceId) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin.from("akp_content_sources").select("*").eq("id", sourceId).maybeSingle();
  return data ? enrichSource(data) : null;
}
