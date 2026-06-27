import { sendJson } from "../api/_http.mjs";

function pick(...keys) {
  for (const key of keys) {
    const value = String(process.env[key] || "").trim();
    if (value) return value;
  }
  return "";
}

function normalizeSupabaseUrl(raw) {
  const v = String(raw || "").trim();
  try {
    return new URL(v).origin;
  } catch {
    return v.replace(/\/+$/, "");
  }
}

export default async function handler(req, res) {
  if (req.method && req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const supabaseUrl = normalizeSupabaseUrl(
    pick("VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"),
  );
  const supabaseAnonKey = pick(
    "VITE_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_ANON_KEY",
  );

  const configured =
    supabaseUrl.startsWith("http") &&
    supabaseAnonKey.length > 20 &&
    !/placeholder/i.test(supabaseUrl) &&
    !/placeholder/i.test(supabaseAnonKey);

  sendJson(res, 200, {
    ok: true,
    auth: configured,
    supabaseUrl: configured ? supabaseUrl : "",
    supabaseAnonKey: configured ? supabaseAnonKey : "",
  });
}
