/**
 * Governance role sync — migrate legacy profiles.role to governance_user_roles.
 */

import { LEGACY_ROLE_MAP } from "./config.mjs";
import { assignRole } from "./rbac.mjs";
import { logGovernanceEvent } from "./audit.mjs";

export async function syncLegacyRolesToGovernance(admin, opts = {}) {
  const result = { synced: 0, skipped: 0, errors: [], mappings: [] };

  if (!admin) {
    result.errors.push("no_admin");
    return result;
  }

  const { data: profiles, error } = await admin.from("profiles").select("id, role, full_name");
  if (error) {
    result.errors.push(error.message);
    return result;
  }

  for (const profile of profiles || []) {
    const legacyRole = profile.role || "user";
    const governanceRole = LEGACY_ROLE_MAP[legacyRole] || "read_only";

    if (opts.dryRun) {
      result.mappings.push({ user_id: profile.id, legacy: legacyRole, governance: governanceRole });
      result.synced += 1;
      continue;
    }

    const { data: existing } = await admin
      .from("governance_user_roles")
      .select("role_id")
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existing?.role_id && !opts.overwrite) {
      result.skipped += 1;
      continue;
    }

    const assigned = await assignRole(admin, {
      userId: profile.id,
      roleId: governanceRole,
      assignedBy: opts.assignedBy || null,
    });

    if (assigned.ok) {
      result.synced += 1;
      result.mappings.push({ user_id: profile.id, legacy: legacyRole, governance: governanceRole });
    } else {
      result.errors.push(`${profile.id}: ${assigned.error}`);
    }
  }

  await logGovernanceEvent(admin, {
    action: "role_sync",
    actor_id: opts.assignedBy || "system",
    outcome: result.errors.length ? "partial" : "success",
    metadata: { synced: result.synced, skipped: result.skipped },
  });

  return result;
}

export async function getUserGovernanceRole(admin, userId) {
  if (!admin || !userId) return { role: "read_only", source: "default" };

  const { data: govRole } = await admin
    .from("governance_user_roles")
    .select("role_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (govRole?.role_id) {
    return { role: govRole.role_id, source: "governance_user_roles" };
  }

  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  const mapped = LEGACY_ROLE_MAP[profile?.role || "user"] || "read_only";
  return { role: mapped, source: "legacy_profile" };
}
