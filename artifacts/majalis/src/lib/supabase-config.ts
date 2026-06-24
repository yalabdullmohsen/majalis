export function formatSupabaseError(error: unknown): string {
  if (!error) return "حدث خطأ غير معروف.";

  if (typeof error === "string") {
    return sanitizeClientMessage(error);
  }

  const pg = error as { message?: string; code?: string };
  if (pg.message) {
    if (pg.code === "PGRST301" || pg.message.includes("JWT")) {
      return "تعذر التحقق من الجلسة. سجّل الدخول مجددًا.";
    }
    if (pg.code === "PGRST205" || pg.message.includes("Could not find")) {
      return "تعذر الوصول إلى البيانات المطلوبة.";
    }
    if (pg.message.includes("Failed to fetch") || pg.message.includes("NetworkError")) {
      return "تعذر الاتصال بالخادم. تحقق من الشبكة وحاول مجددًا.";
    }
    return sanitizeClientMessage(pg.message);
  }

  if (error instanceof Error) return sanitizeClientMessage(error.message);
  return "حدث خطأ غير متوقع أثناء الاتصال بقاعدة البيانات.";
}

function sanitizeClientMessage(message: string): string {
  const msg = message.trim();
  if (!msg) return "حدث خطأ غير متوقع.";
  if (
    /VITE_|NEXT_PUBLIC|ANTHROPIC|SERVICE_ROLE|API_KEY|stack|\/assets\//i.test(msg)
  ) {
    return "حدث خطأ. حاول مجددًا.";
  }
  if (msg.length > 160) return "حدث خطأ. حاول مجددًا.";
  return msg;
}

export function isSupabaseConfigured(): boolean {
  const url = (import.meta.env.VITE_SUPABASE_URL as string || "").trim();
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || "").trim();
  return url.startsWith("http") && key.length > 20;
}

export function logSupabaseError(scope: string, error: unknown, extra?: Record<string, unknown>) {
  console.error(`[majalis:${scope}]`, error, extra ?? "");
}
