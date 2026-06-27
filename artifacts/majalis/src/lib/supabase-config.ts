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
  return "تعذّر إتمام العملية. حاول مجددًا.";
}

function sanitizeClientMessage(message: string): string {
  const msg = message.trim();
  if (!msg) return "تعذّر إتمام العملية. حاول مجددًا.";
  if (
    /VITE_|NEXT_PUBLIC|ANTHROPIC|SERVICE_ROLE|API_KEY|stack|\/assets\//i.test(msg)
  ) {
    return "حدث خطأ. حاول مجددًا.";
  }
  if (msg.length > 160) return "حدث خطأ. حاول مجددًا.";
  return msg;
}

import { getSupabaseAnonKeyEnv, getSupabaseUrlEnv } from "./supabase-env";

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrlEnv();
  const key = getSupabaseAnonKeyEnv();
  if (!url.startsWith("http") || key.length <= 20) return false;
  if (/placeholder|not-configured/i.test(url) || /placeholder|not-configured/i.test(key)) return false;
  try {
    const host = new URL(url).host;
    const ref = host.split(".")[0] || "";
    return host.endsWith(".supabase.co") && /^[a-z0-9-]+$/i.test(ref) && ref.length >= 8;
  } catch {
    return false;
  }
}

let configStatusLogged = false;

/** Log once when Supabase env vars are missing or invalid (console only — not shown to users). */
export function logSupabaseConfigStatus(): void {
  if (configStatusLogged) return;
  configStatusLogged = true;

  const url = getSupabaseUrlEnv();
  const key = getSupabaseAnonKeyEnv();

  if (isSupabaseConfigured()) {
    if (import.meta.env.DEV) {
      console.info("[majalis:supabase] Auth configured:", new URL(url).host);
    }
    return;
  }

  console.error(
    "[majalis:supabase] Supabase auth is NOT configured. " +
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel (Production, Preview, Development). " +
      "On Vercel you may also set SUPABASE_URL / SUPABASE_ANON_KEY — they are mapped at build time. " +
      `Diagnostics: url=${url ? "present" : "MISSING"}, anonKey=${key ? "present" : "MISSING"}`,
  );
}

export function logSupabaseError(scope: string, error: unknown, extra?: Record<string, unknown>) {
  console.error(`[majalis:${scope}]`, error, extra ?? "");
}
