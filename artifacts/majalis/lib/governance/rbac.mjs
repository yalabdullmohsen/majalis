/**
 * Enterprise Governance — RBAC permission checking.
 */

import { ROLES, LEGACY_ROLE_MAP, ROLE_IDS } from "./config.mjs";

function matchPermission(granted, required) {
  if (granted.includes("*")) return true;
  if (granted.includes(required)) return true;
  const [ns] = required.split(".");
  return granted.includes(`${ns}.*`);
}

export function resolveRole(userOrRole) {
  if (!userOrRole) return "read_only";
  if (typeof userOrRole === "string") {
    return ROLES[userOrRole] ? userOrRole : LEGACY_ROLE_MAP[userOrRole] || "read_only";
  }
  const role = userOrRole.governance_role || userOrRole.role || userOrRole.profile?.role;
  return ROLES[role] ? role : LEGACY_ROLE_MAP[role] || "read_only";
}

export function getRolePermissions(roleId) {
  const role = ROLES[resolveRole(roleId)];
  return role?.permissions || ROLES.read_only.permissions;
}

export function hasPermission(userOrRole, permission) {
  const perms = getRolePermissions(resolveRole(userOrRole));
  return matchPermission(perms, permission);
}

export function canPerformAction(userOrRole, action, resource = "content") {
  const permissionMap = {
    create: "content.create",
    edit: "content.edit",
    edit_own: "content.edit_own",
    delete: "content.delete",
    publish: "publish",
    unpublish: "content.unpublish",
    archive: "archive",
    review_scientific: "review.scientific",
    review_editorial: "review.editorial",
    approve: "review.approve",
    reject: "review.reject",
    manage_users: "users.manage",
    run_cron: "cron.run",
    read_audit: "audit.read",
    backup: "backup.create",
    restore: "backup.restore",
    security_audit: "security.audit",
    import: "import",
    translate: "content.translate",
    moderate: "content.moderate",
  };

  const perm = permissionMap[action] || `${resource}.${action}`;
  return hasPermission(userOrRole, perm);
}

export function requirePermission(userOrRole, permission) {
  if (!hasPermission(userOrRole, permission)) {
    const err = new Error(`Permission denied: ${permission}`);
    err.code = "FORBIDDEN";
    err.status = 403;
    throw err;
  }
}

export function getRolesForUser(admin, userId) {
  if (!admin || !userId) return { role: "read_only", permissions: getRolePermissions("read_only") };

  return admin
    .from("governance_user_roles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()
    .then(({ data }) => {
      const roleId = data?.role_id || "read_only";
      return {
        role: roleId,
        permissions: getRolePermissions(roleId),
        assigned_at: data?.assigned_at,
        assigned_by: data?.assigned_by,
      };
    })
    .catch(() => ({ role: "read_only", permissions: getRolePermissions("read_only") }));
}

export async function assignRole(admin, { userId, roleId, assignedBy }) {
  if (!admin) return { ok: false, error: "no_admin" };
  if (!ROLES[roleId]) return { ok: false, error: "invalid_role" };

  const { data, error } = await admin
    .from("governance_user_roles")
    .upsert(
      { user_id: userId, role_id: roleId, assigned_by: assignedBy, assigned_at: new Date().toISOString() },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, assignment: data };
}

export { ROLES, ROLE_IDS };
