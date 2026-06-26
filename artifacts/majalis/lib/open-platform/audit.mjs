/**
 * Open Platform — audit logging for API requests.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function logApiRequest(admin, entry) {
  const row = {
    api_key_id: entry.key_id || null,
    method: entry.method || "GET",
    path: entry.path,
    version: entry.version || "v1",
    resource: entry.resource,
    status_code: entry.status_code || 200,
    response_ms: entry.response_ms,
    ip_address: entry.ip,
    user_agent: entry.user_agent?.slice(0, 200),
    error: entry.error,
    metadata: entry.metadata || {},
  };

  if (admin) {
    try {
      await admin.from("open_api_audit_logs").insert(row);
    } catch {
      /* table may not exist */
    }
  }

  return { ok: true };
}

export async function getAuditLogs(admin, { keyId, limit = 50 } = {}) {
  if (!admin) return [];

  try {
    let q = admin.from("open_api_audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);
    if (keyId) q = q.eq("api_key_id", keyId);
    const { data } = await q;
    return data || [];
  } catch {
    return [];
  }
}

export async function getUsageStats(admin, keyId, days = 30) {
  if (!admin) return { total: 0, by_day: [], by_resource: {} };

  try {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    let q = admin.from("open_api_audit_logs").select("*").gte("created_at", since);
    if (keyId) q = q.eq("api_key_id", keyId);
    const { data } = await q;

    const byResource = {};
    for (const row of data || []) {
      byResource[row.resource || "unknown"] = (byResource[row.resource || "unknown"] || 0) + 1;
    }

    return {
      total: data?.length || 0,
      by_resource: byResource,
      avg_response_ms: data?.length ? Math.round(data.reduce((s, r) => s + (r.response_ms || 0), 0) / data.length) : 0,
      errors: data?.filter((r) => r.status_code >= 400).length || 0,
    };
  } catch {
    return { total: 0, by_resource: {}, avg_response_ms: 0, errors: 0 };
  }
}
