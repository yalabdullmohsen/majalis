/**
 * Permanent platform owners — bootstrap allowlist retained even if DB roles are reset.
 * Server-only. Emails are provided via the MAJALIS_OWNER_EMAILS environment variable
 * (comma-separated) so no personal address is committed to the codebase. When unset,
 * owner detection falls back to the database role (is_owner / super_admin), which is
 * the real source of truth.
 */

function readOwnerEmailsFromEnv() {
  const raw = process.env.MAJALIS_OWNER_EMAILS || process.env.BOOTSTRAP_OWNER_EMAILS || "";
  return Object.freeze(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const BOOTSTRAP_OWNER_EMAILS = readOwnerEmailsFromEnv();

export function normalizeOwnerEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/** Resolve email from Supabase Auth user (JWT may omit top-level email). */
export function resolveUserEmail(user) {
  if (!user) return "";
  const candidates = [
    user.email,
    user.user_metadata?.email,
    user.raw_user_meta_data?.email,
    ...(Array.isArray(user.identities)
      ? user.identities.map((i) => i?.identity_data?.email || i?.email)
      : []),
  ];
  for (const c of candidates) {
    const normalized = normalizeOwnerEmail(c);
    if (normalized) return normalized;
  }
  return "";
}

export function isBootstrapOwnerEmail(email) {
  const normalized = normalizeOwnerEmail(email);
  if (!normalized) return false;
  return BOOTSTRAP_OWNER_EMAILS.some((e) => normalizeOwnerEmail(e) === normalized);
}

export function isOwnerProfile(profile) {
  if (!profile) return false;
  if (profile.is_owner === true) return true;
  if (profile.role === "super_admin" && profile.is_super_admin === true) return true;
  return false;
}

export function isOwnerUser(user, profile) {
  if (isBootstrapOwnerEmail(resolveUserEmail(user))) return true;
  return isOwnerProfile(profile);
}

export function isSuperAdminAccess({ role, profile, email } = {}) {
  if (isBootstrapOwnerEmail(email)) return true;
  if (isOwnerProfile(profile)) return true;
  if (profile?.is_super_admin === true) return true;
  if (profile?.is_admin === true && profile?.role === "super_admin") return true;
  return role === "super_admin";
}

export function hasUnrestrictedAdminAccess(ctx = {}) {
  return isSuperAdminAccess(ctx);
}
