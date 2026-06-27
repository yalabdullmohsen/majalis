/** Client-side mirror of lib/owner-config.mjs — keep emails in sync. */

export const BOOTSTRAP_OWNER_EMAILS = [
  "yalabdullmohsen1@gmail.com",
] as const;

export function normalizeOwnerEmail(email: string | null | undefined): string {
  return String(email || "").trim().toLowerCase();
}

/** Resolve email from Supabase Auth user (JWT may omit top-level email). */
export function resolveUserEmail(user: { email?: string | null; user_metadata?: { email?: string } | null; identities?: Array<{ identity_data?: { email?: string }; email?: string }> } | null | undefined): string {
  if (!user) return "";
  const candidates = [
    user.email,
    user.user_metadata?.email,
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

export function isBootstrapOwnerEmail(email: string | null | undefined): boolean {
  const normalized = normalizeOwnerEmail(email);
  if (!normalized) return false;
  return BOOTSTRAP_OWNER_EMAILS.some((e) => normalizeOwnerEmail(e) === normalized);
}

export type OwnerProfileLike = {
  is_owner?: boolean | null;
  is_super_admin?: boolean | null;
  is_admin?: boolean | null;
  role?: string | null;
  status?: string | null;
};

export function isOwnerProfile(profile: OwnerProfileLike | null | undefined): boolean {
  if (!profile) return false;
  if (profile.is_owner === true) return true;
  if (profile.role === "super_admin" && profile.is_super_admin === true) return true;
  return false;
}

export function isOwnerUser(
  email: string | null | undefined,
  profile: OwnerProfileLike | null | undefined,
): boolean {
  if (isBootstrapOwnerEmail(email)) return true;
  return isOwnerProfile(profile);
}

export function isOwnerAuthUser(
  user: { email?: string | null; user_metadata?: { email?: string } | null } | null | undefined,
  profile: OwnerProfileLike | null | undefined,
): boolean {
  if (isBootstrapOwnerEmail(resolveUserEmail(user))) return true;
  return isOwnerProfile(profile);
}

export function hasUnrestrictedAdminAccess(opts: {
  email?: string | null;
  profile?: OwnerProfileLike | null;
  governanceRole?: string | null;
}): boolean {
  if (isBootstrapOwnerEmail(opts.email)) return true;
  if (isOwnerProfile(opts.profile)) return true;
  if (opts.profile?.is_super_admin === true) return true;
  if (opts.governanceRole === "super_admin") return true;
  return false;
}
