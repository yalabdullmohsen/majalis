import { createClient } from "@supabase/supabase-js";
import { getEnvConfig } from "./env-config.mjs";

function normalizeSupabaseUrl(raw) {
  const v = String(raw || "").trim();
  try {
    return new URL(v).origin;
  } catch {
    return v.replace(/\/+$/, "");
  }
}

export function getSupabaseAdmin() {
  const { supabaseUrl, serviceRoleKey } = getEnvConfig();
  const url = normalizeSupabaseUrl(supabaseUrl);
  const key = String(serviceRoleKey || "").trim();
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
