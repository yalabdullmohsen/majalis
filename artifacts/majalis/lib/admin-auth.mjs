/**
 * Admin API authentication — server-only secrets + Supabase JWT sessions.
 * No VITE_* secrets should reach the client.
 */

import { createClient } from "@supabase/supabase-js";
import { validateAdminAuth } from "./env-config.mjs";
import { getSupabaseAdmin } from "./supabase-admin.mjs";
import { resolveRole, hasPermission as roleHasPermission, getRolesForUser } from "./governance/rbac.mjs";
import { LEGACY_ROLE_MAP } from "./governance/config.mjs";
import {
  isBootstrapOwnerEmail,
  isOwnerProfile,
  isOwnerUser,
  hasUnrestrictedAdminAccess,
} from "./owner-config.mjs";

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
  "import",
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

function buildAuthContext({ user, profile, governanceRole }) {
  const isOwner = isOwnerUser(user, profile);
  const unrestricted = hasUnrestrictedAdminAccess({
    email: user?.email,
    profile,
    role: governanceRole,
  });

  return {
    user,
    profile,
    governanceRole,
    isOwner,
    unrestricted,
    effectiveRole: unrestricted ? "super_admin" : governanceRole,
  };
}

function canAccessAdmin(ctx) {
  if (ctx.unrestricted || ctx.isOwner) return true;
  if (isAdminRole(ctx.governanceRole)) return true;
  return ADMIN_PERMISSIONS.some((p) => roleHasPermission(ctx.governanceRole, p));
}

export function hasPermission(ctx, permission) {
  if (typeof ctx === "string") {
    return roleHasPermission(ctx, permission);
  }
  if (ctx?.unrestricted || ctx?.isOwner) return true;
  if (hasUnrestrictedAdminAccess(ctx)) return true;
  const role = ctx?.effectiveRole || ctx?.governanceRole || ctx?.role || resolveRole(ctx);
  return roleHasPermission(role, permission);
}

export function canImportContent(ctx) {
  if (typeof ctx === "object" && (ctx?.unrestricted || ctx?.isOwner || hasUnrestrictedAdminAccess(ctx))) {
    return true;
  }
  const role = typeof ctx === "string" ? ctx : ctx?.effectiveRole || ctx?.governanceRole || ctx?.role;
  return (
    roleHasPermission(role, "import") ||
    roleHasPermission(role, "content.edit") ||
    roleHasPermission(role, "content.create") ||
    roleHasPermission(role, "content.*")
  );
}

async function loadProfile(admin, client, userId) {
  const fullCols = "id, role, is_admin, is_super_admin, is_owner, status, full_name";
  const basicCols = "id, role, full_name";

  async function read(source, cols) {
    const { data, error } = await source.from("profiles").select(cols).eq("id", userId).maybeSingle();
    if (error && (error.code === "42703" || String(error.message || "").includes("does not exist"))) {
      return null;
    }
    return data || null;
  }

  if (admin) {
    const full = await read(admin, fullCols);
    if (full) return full;
    const basic = await read(admin, basicCols);
    if (basic) return basic;
  }

  const fullClient = await read(client, fullCols);
  if (fullClient) return fullClient;
  return read(client, basicCols);
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
  let profile = null;

  profile = await loadProfile(admin, client, user.id);

  if (isBootstrapOwnerEmail(user.email) || isOwnerProfile(profile)) {
    governanceRole = "super_admin";
  } else if (admin) {
    const roles = await getRolesForUser(admin, user.id);
    governanceRole = roles.role || resolveRole(profile?.role || "read_only");
  } else {
    governanceRole = resolveRole(profile?.role || "read_only");
  }

  const ctx = buildAuthContext({ user, profile, governanceRole });

  if (!canAccessAdmin(ctx)) {
    return { ok: false, status: 403, error: "forbidden", user, role: governanceRole, ...ctx };
  }

  return {
    ok: true,
    method: "session",
    user,
    userId: user.id,
    role: ctx.effectiveRole,
    governanceRole,
    profile,
    isOwner: ctx.isOwner,
    unrestricted: ctx.unrestricted,
    permissions: (perm) => hasPermission(ctx, perm),
  };
}

/**
 * Validate admin access: Vercel cron, service secret, or Supabase JWT session.
 */
export async function validateAdminAccess(req, opts = {}) {
  if (validateAdminAuth(req)) {
    return { ok: true, method: "service", role: "super_admin", userId: "service", unrestricted: true };
  }

  const session = await validateJwtSession(req);
  if (!session) {
    return { ok: false, status: 401, error: "unauthorized" };
  }
  if (!session.ok) return session;

  const ctx = session;

  if (opts.permission && !hasPermission(ctx, opts.permission)) {
    return {
      ok: false,
      status: 403,
      error: "permission_denied",
      permission: opts.permission,
      userMessage: "Missing database permission.",
      userMessageAr: "ليس لديك صلاحية تنفيذ هذا الإجراء.",
    };
  }

  if (opts.requireImport && !canImportContent(ctx)) {
    return {
      ok: false,
      status: 403,
      error: "permission_denied",
      permission: "import",
      userMessage: "Missing database permission.",
      userMessageAr: "ليس لديك صلاحية استيراد المحتوى.",
    };
  }

  return session;
}

export async function requireAdminAccess(req, res, sendJson, opts = {}) {
  const auth = await validateAdminAccess(req, opts);
  if (!auth.ok) {
    sendJson(res, auth.status || 401, {
      ok: false,
      error: auth.error || "unauthorized",
      userMessage:
        auth.userMessage ||
        (auth.error === "unauthorized" ? "Session expired or not signed in." : "Missing database permission."),
      userMessageAr: auth.userMessageAr || "تعذّر التحقق من الصلاحيات.",
      reason: auth.error,
    });
    return null;
  }
  return auth;
}

export { LEGACY_ROLE_MAP, isAdminRole, canAccessAdmin as canAccessAdminRole };
