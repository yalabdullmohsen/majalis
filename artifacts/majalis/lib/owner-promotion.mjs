/**
 * Promote a Supabase Auth user to permanent platform owner.
 */

import { BOOTSTRAP_OWNER_EMAILS, isBootstrapOwnerEmail, normalizeOwnerEmail } from "./owner-config.mjs";
import { assignRole } from "./governance/rbac.mjs";

const OWNER_PROFILE = Object.freeze({
  role: "super_admin",
  is_admin: true,
  is_super_admin: true,
  is_owner: true,
  status: "active",
});

async function findAuthUserByEmail(admin, email) {
  const normalized = normalizeOwnerEmail(email);
  if (!normalized) return { ok: false, error: "invalid_email" };

  let page = 1;
  const perPage = 200;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return { ok: false, error: error.message };

    const users = data?.users || [];
    const match = users.find((u) => normalizeOwnerEmail(u.email) === normalized);
    if (match) return { ok: true, user: match };

    if (users.length < perPage) break;
    page += 1;
  }

  return { ok: false, error: "user_not_found", email: normalized };
}

async function upsertOwnerProfile(admin, user) {
  const base = {
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Platform Owner",
    ...OWNER_PROFILE,
  };

  const { data: existing, error: readErr } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (readErr && !String(readErr.message || "").includes("does not exist")) {
    return { ok: false, error: readErr.message, step: "read_profile" };
  }

  if (existing?.id) {
    const { data, error } = await admin.from("profiles").update(OWNER_PROFILE).eq("id", user.id).select("*").single();
    if (error) return { ok: false, error: error.message, step: "update_profile" };
    return { ok: true, profile: data, created: false };
  }

  const { data, error } = await admin.from("profiles").insert(base).select("*").single();
  if (error) {
    const { data: upserted, error: upsertErr } = await admin
      .from("profiles")
      .upsert(base, { onConflict: "id" })
      .select("*")
      .single();
    if (upsertErr) return { ok: false, error: upsertErr.message, step: "upsert_profile" };
    return { ok: true, profile: upserted, created: true };
  }

  return { ok: true, profile: data, created: true };
}

async function upsertGovernanceRole(admin, userId, assignedBy = "bootstrap") {
  return assignRole(admin, {
    userId,
    roleId: "super_admin",
    assignedBy,
  });
}

export async function promoteOwnerByEmail(admin, email, opts = {}) {
  if (!admin) return { ok: false, error: "no_admin_client" };

  const normalized = normalizeOwnerEmail(email);
  if (!isBootstrapOwnerEmail(normalized) && !opts.allowAnyEmail) {
    return { ok: false, error: "email_not_in_bootstrap_list", email: normalized };
  }

  const found = await findAuthUserByEmail(admin, normalized);
  if (!found.ok) return found;

  const profileResult = await upsertOwnerProfile(admin, found.user);
  if (!profileResult.ok) return profileResult;

  const govResult = await upsertGovernanceRole(admin, found.user.id, opts.assignedBy || "owner-bootstrap");
  if (!govResult.ok) {
    return { ok: false, error: govResult.error, step: "governance_role", profile: profileResult.profile };
  }

  return {
    ok: true,
    email: normalized,
    userId: found.user.id,
    profile: profileResult.profile,
    governance: govResult.assignment,
    createdProfile: profileResult.created,
  };
}

export async function promoteAllBootstrapOwners(admin, opts = {}) {
  const results = [];
  for (const email of BOOTSTRAP_OWNER_EMAILS) {
    results.push({ email, ...(await promoteOwnerByEmail(admin, email, opts)) });
  }
  const ok = results.every((r) => r.ok);
  return { ok, results };
}
