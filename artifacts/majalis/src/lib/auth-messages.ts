import { formatSupabaseError, isSupabaseConfigured, logSupabaseConfigStatus } from "./supabase-config";

export function mapAuthError(error: unknown): string {
  if (!error) {
    if (!isSupabaseConfigured()) {
      logSupabaseConfigStatus();
      return "تعذّر الاتصال بخادم المصادقة. تحقق من إعدادات Supabase على الخادم.";
    }
    return "تعذّر تسجيل الدخول. تحقق من البيانات وحاول مجدداً.";
  }

  const msg = String((error as { message?: string }).message || "").toLowerCase();

  if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }
  if (msg.includes("email not confirmed")) {
    return "يرجى تأكيد بريدك الإلكتروني أولاً من الرابط المرسل إليك.";
  }
  if (msg.includes("too many requests") || msg.includes("rate limit")) {
    return "محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.";
  }
  if (msg.includes("user already registered")) {
    return "هذا البريد مسجّل مسبقاً.";
  }
  if (msg.includes("password") && msg.includes("short")) {
    return "كلمة المرور قصيرة جداً.";
  }

  return formatSupabaseError(error);
}

export const ADMIN_ACCESS_DENIED_MESSAGE = "ليس لديك صلاحية دخول لوحة التحكم";
