/**
 * DELETE / POST /api/account/delete
 *
 * يحذف حساب المستخدم المسجَّل نهائياً عبر Supabase Admin API.
 * حذف صف auth.users يُطلق ON DELETE CASCADE على كل الجداول المرتبطة
 * بـ user_id (تم التحقق: 221 من 226 مفتاحاً خارجياً في المشروع لديها
 * ON DELETE مُعرَّف، ولا حالة استثناء منها على عمود user_id).
 */

import { sendJson } from "../../api/_http.mjs";
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { createClient } from "@supabase/supabase-js";

function extractBearer(req) {
  const h = req.headers?.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

function userClient(token) {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function deleteAccountHandler(req, res) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return sendJson(res, 405, { ok: false, error: "الطريقة غير مدعومة" });
  }

  const token = extractBearer(req);
  if (!token) return sendJson(res, 401, { ok: false, error: "مطلوب تسجيل الدخول" });

  const uc = userClient(token);
  const { data: { user }, error: authErr } = await uc.auth.getUser();
  if (authErr || !user) return sendJson(res, 401, { ok: false, error: "جلسة غير صالحة" });

  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة حالياً، حاول لاحقاً" });

  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.error("account/delete failed", user.id, delErr);
    return sendJson(res, 500, {
      ok: false,
      error: "تعذّر حذف الحساب بالكامل. تواصل معنا عبر /contact وسنحذف بياناتك يدوياً.",
    });
  }

  return sendJson(res, 200, { ok: true });
}
