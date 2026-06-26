/**
 * Admin API authentication — server-only secrets + Supabase JWT sessions.
 * No VITE_* secrets should reach the client.
 */

import { createClient } from "@supabase/supabase-js";
import { validateAdminAuth, extractCronSecretFromRequest, getEnvConfig } from "./env-config.mjs";
import { getSupabaseAdmin } from "./supabase-admin.mjs";
import { resolveRole, hasPermission, getRolesForUser } from "./governance/rbac.mjs";
import { LEGACY_ROLE_MAP } from "./governance/config.mjs";

const ADMIN_PERMISSIONS = [
  "content.edit",
  "users.manage",
  "audit.read",
  "cron.run",
  "security.audit",
  "backup.create",
  "publish",
  "review.scientific",
  "analytics.read",
];

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
}

function getAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
}

function isAdminRole(roleId) {
  const adminRoles = [
    "super_admin",
    "system_admin",
    "content_manager",
    "scientific_reviewer",
    "editor",
    "moderator",
  ];
  return adminRoles.includes(roleId);
}

function canAccessAdmin(roleId) {
  if (isAdminRole(roleId)) return true;
  return ADMIN_PERMISSIONS.some((p) => hasPermission(roleId, p));
}

async function validateJwtSession(req) {
  const authHeader = String(req.headers?.authorization || req.headers?.Authorization || "").trim();
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token || token.length < 20) return null;

  const url = getSupabaseUrl();
  const anon = getAnonKey();
  if (!url || !anon) return null;

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  let governanceRole = "read_only";

  if (admin) {
    const roles = await getRolesForUser(admin, user.id);
    governanceRole = roles.role || "read_only";
  } else {
    const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
    governanceRole = resolveRole(profile?.role || "read_only");
  }

  if (!canAccessAdmin(governanceRole)) {
    return { ok: false, status: 403, error: "forbidden", user, role: governanceRole };
  }

  return {
    ok: true,
    method: "session",
    user,
    userId: user.id,
    role: governanceRole,
    permissions: hasPermission,
  };
}

/**
 * Validate admin access: Vercel cron, service secret, or Supabase JWT session.
 */
export async function validateAdminAccess(req, opts = {}) {
  if (validateAdminAuth(req)) {
    return { ok: true, method: "service", role: "super_admin", userId: "service" };
  }

  const session = await validateJwtSession(req);
  if (!session) {
    return { ok: false, status: 401, error: "unauthorized" };
  }
  if (!session.ok) return session;

  if (opts.permission && !hasPermission(session.role, opts.permission)) {
    return { ok: false, status: 403, error: "permission_denied", permission: opts.permission };
  }

  return session;
}

export async function requireAdminAccess(req, res, sendJson, opts = {}) {
  const auth = await validateAdminAccess(req, opts);
  if (!auth.ok) {
    sendJson(res, auth.status || 401, { ok: false, error: auth.error || "unauthorized" });
    return null;
  }
  return auth;
}

export { LEGACY_ROLE_MAP, isAdminRole, canAccessAdmin };
