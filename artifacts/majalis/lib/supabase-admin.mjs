import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(raw) {
  const v = String(raw || "").trim();
  try {
    return new URL(v).origin;
  } catch {
    return v.replace(/\/+$/, "");
  }
}

export function getSupabaseAdmin() {
  const url = normalizeSupabaseUrl(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  );
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function isMissingTableError(error) {
  if (!error || typeof error !== "object") return false;
  const e = error;
  const code = e.code || "";
  const msg = String(e.message || "").toLowerCase();
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    code === "42703" ||
    msg.includes("could not find") ||
    msg.includes("does not exist") ||
    msg.includes("relation")
  );
}
