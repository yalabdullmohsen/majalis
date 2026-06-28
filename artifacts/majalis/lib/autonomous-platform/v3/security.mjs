/**
 * AKP v3 — Security (audit logs, access helpers).
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";

export async function logAuditEvent({ actor, action, resourceType, resourceId, ipAddress, userAgent, metadata = {} }) {
  const admin = getSupabaseAdmin();
  const row = {
    actor_id: actor?.userId || actor?.id || null,
    actor_label: actor?.label || actor?.email || actor?.userId || "system",
    action,
    resource_type: resourceType || null,
    resource_id: resourceId ? String(resourceId) : null,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    metadata,
  };

  if (!admin) {
    console.log(JSON.stringify({ tag: "akp:audit", ...row }));
    return { ok: true, local: true };
  }

  try {
    await admin.from("akp_audit_log").insert(row);
    return { ok: true };
  } catch {
    console.log(JSON.stringify({ tag: "akp:audit", ...row }));
    return { ok: true, local: true };
  }
}

export async function listAuditLog({ limit = 50, action = null } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, entries: [] };

  let q = admin.from("akp_audit_log").select("*").order("created_at", { ascending: false }).limit(limit);
  if (action) q = q.eq("action", action);
  const { data } = await q;
  return { ok: true, entries: data || [] };
}

export function sanitizeAdminPayload(body) {
  if (!body || typeof body !== "object") return {};
  const forbidden = ["service_role", "password", "secret", "token"];
  const out = { ...body };
  for (const key of Object.keys(out)) {
    if (forbidden.some((f) => key.toLowerCase().includes(f))) delete out[key];
  }
  return out;
}

export async function verifyAdminOperation(auth, requiredPermission = "content.edit") {
  if (!auth?.userId) return { ok: false, error: "unauthorized" };
  if (auth.role === "owner") return { ok: true };
  const perms = auth.permissions || [];
  if (perms.includes(requiredPermission) || perms.includes("admin")) return { ok: true };
  return { ok: false, error: "forbidden", required: requiredPermission };
}
