import { formatSupabaseError, isSupabaseConfigured } from "./supabase-config";

export function mapAuthError(error: unknown): string {
  if (!isSupabaseConfigured()) {
    return "تسجيل الدخول غير متاح حالياً. يرجى التواصل مع إدارة الموقع.";
  }

  if (!error) return "تعذّر تسجيل الدخول. تحقق من البيانات وحاول مجدداً.";

  const msg = String((error as { message?: string }).message || "").toLowerCase();

  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid_credentials") ||
    msg.includes("user not found") ||
    msg.includes("no user found")
  ) {
    return "الحساب غير موجود أو البيانات غير صحيحة";
  }
  if (msg.includes("email not confirmed")) {
    return "يرجى تأكيد بريدك الإلكتروني أولاً من الرابط المرسل إليك.";
  }
  if (msg.includes("too many requests") || msg.includes("rate limit")) {
    return "محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.";
  }
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return "هذا البريد مسجّل مسبقاً.";
  }
  if (
    (msg.includes("password") && (msg.includes("short") || msg.includes("least") || msg.includes("weak"))) ||
    msg.includes("password should be")
  ) {
    return "كلمة المرور قصيرة";
  }
  if (msg.includes("valid email") || msg.includes("invalid email") || msg.includes("email address")) {
    return "البريد غير صحيح";
  }
  if (msg.includes("passwords do not match") || msg.includes("password mismatch")) {
    return "كلمة المرور غير متطابقة";
  }

  const friendly = formatSupabaseError(error);
  if (/supabase|postgres|jwt|fetch|networkerror|failed to fetch/i.test(friendly)) {
    return "تعذّر إتمام العملية. تحقق من الاتصال وحاول مجدداً.";
  }
  return friendly;
}

export const ADMIN_ACCESS_DENIED_MESSAGE = "ليس لديك صلاحية دخول لوحة التحكم";
