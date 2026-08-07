/**
 * Authenticated end-user guard — JWT Bearer only (no admin role required).
 * Prefer this over inlining extractBearer + getUser in every handler.
 */

import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
}

function getAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
}

export function extractBearer(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || "";
  return typeof h === "string" && h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

export function userClientFromToken(token) {
  const url = getSupabaseUrl();
  const anon = getAnonKey();
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * @returns {{ ok: true, user: object, token: string, client: object } | { ok: false, status: number, error: string }}
 */
export async function validateUserSession(req) {
  const token = extractBearer(req);
  if (!token) return { ok: false, status: 401, error: "مطلوب تسجيل الدخول" };

  const url = getSupabaseUrl();
  const anon = getAnonKey();
  if (!url || !anon) return { ok: false, status: 503, error: "الخدمة غير متاحة حالياً" };

  const client = userClientFromToken(token);
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return { ok: false, status: 401, error: "جلسة غير صالحة" };

  return { ok: true, user, token, client };
}

/**
 * Express/Vercel-style guard. Sends JSON on failure and returns null.
 */
export async function requireUser(req, res, sendJson) {
  const auth = await validateUserSession(req);
  if (!auth.ok) {
    sendJson(res, auth.status || 401, { ok: false, error: auth.error || "unauthorized" });
    return null;
  }
  return auth;
}
