/** Client-side mirror of lib/owner-config.mjs — keep emails in sync. */

export const BOOTSTRAP_OWNER_EMAILS = [
  "yalabdullmohsen1@gmail.com",
] as const;

export function normalizeOwnerEmail(email: string | null | undefined): string {
  return String(email || "").trim().toLowerCase();
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
