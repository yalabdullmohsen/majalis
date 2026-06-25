import { sendJson } from "../_http.js";
import { runFiqhLinkCheck } from "../../lib/fiqh-link-checker.mjs";
import { createClient } from "@supabase/supabase-js";

function getAdminFromRequest(req) {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  const auth = String(req.headers.authorization || "");
  if (!url || !anon || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  return createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  const client = getAdminFromRequest(req);
  if (!client) {
    sendJson(res, 401, { ok: false, message: "يجب تسجيل الدخول." });
    return;
  }

  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    sendJson(res, 401, { ok: false, message: "جلسة غير صالحة." });
    return;
  }

  const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    sendJson(res, 403, { ok: false, message: "صلاحيات غير كافية." });
    return;
  }

  try {
    const result = await runFiqhLinkCheck();
    sendJson(res, 200, result);
  } catch (error) {
    console.error("[admin/check-fiqh-links] failed", error);
    sendJson(res, 500, { ok: false, message: "فشل فحص الروابط." });
  }
}
