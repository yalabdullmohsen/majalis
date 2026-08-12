/**
 * حرّاس الملكية في العميل.
 *
 * أمن: كان هذا الملف يحمل بريد المالك الشخصي حرفيًا، فيُشحن ضمن حزمة JS إلى
 * كل زائر (كشف بيانات شخصية + خارطة طريق لمهاجم يعرف من يستهدف).
 * حُذف البريد نهائيًا ولا يجوز إعادته.
 *
 * الفحص المعتمد للملكية في العميل هو عمود `is_owner` (ومعه role/is_super_admin)
 * القادم من الملف الشخصي في قاعدة البيانات — لا مقارنة بريد. أي فحص بريد في
 * العميل بلا معنى أمني أصلًا لأنه قابل للتزوير محليًا؛ القرار الفعلي عند الخادم
 * وسياسات RLS.
 */

/** أبقيت التسمية لتوافق المستوردين — وهي فارغة أبدًا في العميل. */
export const BOOTSTRAP_OWNER_EMAILS = [] as const;

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

/**
 * تُرجع false دائمًا في العميل — بلا أي قائمة بريد.
 * الملكية تُقرَّر من `is_owner` في الملف الشخصي (قاعدة البيانات) لا من البريد.
 * أُبقيت الدالة بتوقيعها كي لا ينكسر المستوردون (supabase.ts، AuthProvider، LoginPage)،
 * وكلهم يسقطون تلقائيًا إلى فحص الملف الشخصي.
 */
export function isBootstrapOwnerEmail(_email?: string | null): boolean {
  return false;
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

/** الملكية من قاعدة البيانات فقط — المعامل `_email` مُهمل ومحفوظ للتوافق. */
export function isOwnerUser(
  _email: string | null | undefined,
  profile: OwnerProfileLike | null | undefined,
): boolean {
  return isOwnerProfile(profile);
}

/** الملكية من قاعدة البيانات فقط — المعامل `_user` مُهمل ومحفوظ للتوافق. */
export function isOwnerAuthUser(
  _user: { email?: string | null; user_metadata?: { email?: string } | null } | null | undefined,
  profile: OwnerProfileLike | null | undefined,
): boolean {
  return isOwnerProfile(profile);
}

/** لا مقارنة بريد — القرار من الملف الشخصي (is_owner/is_super_admin) أو دور الحوكمة. */
export function hasUnrestrictedAdminAccess(opts: {
  email?: string | null;
  profile?: OwnerProfileLike | null;
  governanceRole?: string | null;
}): boolean {
  if (isOwnerProfile(opts.profile)) return true;
  if (opts.profile?.is_super_admin === true) return true;
  if (opts.governanceRole === "super_admin") return true;
  return false;
}
