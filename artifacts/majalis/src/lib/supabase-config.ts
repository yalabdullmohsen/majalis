import type { PostgrestError } from "@supabase/supabase-js";

export function isSupabaseConfigured(): boolean {
  const url = (import.meta.env.VITE_SUPABASE_URL as string || "").trim();
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || "").trim();
  return url.startsWith("http") && key.length > 20;
}

export function formatSupabaseError(error: unknown): string {
  if (!error) return "حدث خطأ غير معروف.";

  if (typeof error === "string") return error;

  const pg = error as PostgrestError;
  if (pg.message) {
    if (pg.code === "PGRST301" || pg.message.includes("JWT")) {
      return "خطأ في مفتاح Supabase. تحقق من VITE_SUPABASE_ANON_KEY.";
    }
    if (pg.code === "PGRST205" || pg.message.includes("Could not find")) {
      return `الجدول أو الدالة غير موجودة في Supabase: ${pg.message}`;
    }
    if (pg.message.includes("Failed to fetch") || pg.message.includes("NetworkError")) {
      return "تعذر الاتصال بـ Supabase. تحقق من الشبكة وعنوان VITE_SUPABASE_URL.";
    }
    return pg.message;
  }

  if (error instanceof Error) return error.message;
  return "حدث خطأ غير متوقع أثناء الاتصال بقاعدة البيانات.";
}

export function logSupabaseError(scope: string, error: unknown, extra?: Record<string, unknown>) {
  console.error(`[majalis:${scope}]`, error, extra ?? "");
}
