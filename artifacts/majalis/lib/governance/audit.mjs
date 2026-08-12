/**
 * Enterprise Governance — unified audit trail.
 */

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { AUDIT_ACTIONS } from "./config.mjs";

export async function logGovernanceEvent(admin, event) {
  admin = admin || getSupabaseAdmin();

  const row = {
    id: crypto.randomUUID(),
    action: event.action,
    actor_id: event.actor_id || event.user_id || "system",
    actor_role: event.actor_role || null,
    resource_type: event.resource_type || event.content_kind || null,
    resource_id: event.resource_id || event.record_id || null,
    ref_id: event.ref_id || null,
    ip_address: event.ip_address || event.ip || null,
    user_agent: event.user_agent?.slice(0, 200) || null,
    reason: event.reason || null,
    outcome: event.outcome || (event.success === false ? "failed" : "success"),
    metadata: event.metadata || {},
    source: event.source || "governance",
    created_at: new Date().toISOString(),
  };

  if (admin) {
    try {
      await admin.from("governance_audit_log").insert(row);
    } catch {
      /* table may not exist */
    }

    try {
      await admin.from("admin_audit_logs").insert({
        user_id: event.actor_id || null,
        action: event.action,
        table_name: event.resource_type || event.table_name || "governance",
        record_id: event.resource_id || null,
        content_kind: event.content_kind || null,
        metadata: { ...event.metadata, source: "governance", outcome: row.outcome },
      });
    } catch {
      /* legacy table optional */
    }
  }

  return row;
}

export async function getAuditTrail(admin, opts = {}) {
  if (!admin) return [];

  const limit = opts.limit || 50;

  try {
    let q = admin.from("governance_audit_log").select("*").order("created_at", { ascending: false }).limit(limit);
    if (opts.action) q = q.eq("action", opts.action);
    if (opts.actor_id) q = q.eq("actor_id", opts.actor_id);
    if (opts.resource_id) q = q.eq("resource_id", opts.resource_id);
    if (opts.since) q = q.gte("created_at", opts.since);
    const { data } = await q;
    return data || [];
  } catch {
    return [];
  }
}

export async function getAuditStats(admin, days = 30) {
  if (!admin) return { total: 0, by_action: {}, by_outcome: {} };

  try {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data } = await admin.from("governance_audit_log").select("action, outcome").gte("created_at", since);

    const byAction = {};
    const byOutcome = {};
    for (const row of data || []) {
      byAction[row.action] = (byAction[row.action] || 0) + 1;
      byOutcome[row.outcome] = (byOutcome[row.outcome] || 0) + 1;
    }

    return { total: data?.length || 0, by_action: byAction, by_outcome: byOutcome };
  } catch {
    return { total: 0, by_action: {}, by_outcome: {} };
  }
}

export { AUDIT_ACTIONS };
