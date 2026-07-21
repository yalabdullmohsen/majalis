/**
 * قائمة مالكي المنصة (bootstrap) — **خادم فقط**.
 *
 * أمن: كان البريد الشخصي مكتوبًا هنا وفي نظيره في العميل (src/lib/owner-config.ts)
 * فيُشحن إلى المتصفح ضمن حزمة JS. الآن يُقرأ من متغير البيئة OWNER_EMAILS
 * (قائمة مفصولة بفواصل)، والقيمة الافتراضية فارغة — بلا أي بريد في الكود.
 * إن لم يُضبط المتغير فلا مالك bootstrap، ويبقى فحص الملكية عبر قاعدة البيانات
 * (عمود is_owner) وحده.
 *
 * مثال: OWNER_EMAILS="owner@example.com,second@example.com"
 */

function readOwnerEmailsFromEnv() {
  const raw = String(process.env.OWNER_EMAILS || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const BOOTSTRAP_OWNER_EMAILS = Object.freeze(readOwnerEmailsFromEnv());

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
