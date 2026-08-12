/**
 * DELETE / POST /api/account/delete
 *
 * يحذف حساب المستخدم المسجَّل نهائياً عبر Supabase Admin API.
 * حذف صف auth.users يُطلق ON DELETE CASCADE على كل الجداول المرتبطة
 * بـ user_id.
 */

import { sendJson } from "../../api/_http.mjs";
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { requireUser } from "../../user-auth.mjs";

export default async function deleteAccountHandler(req, res) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return sendJson(res, 405, { ok: false, error: "الطريقة غير مدعومة" });
  }

  const auth = await requireUser(req, res, sendJson);
  if (!auth) return;

  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة حالياً، حاول لاحقاً" });

  const { error: delErr } = await admin.auth.admin.deleteUser(auth.user.id);
  if (delErr) {
    console.error("account/delete failed", auth.user.id, delErr);
    return sendJson(res, 500, {
      ok: false,
      error: "تعذّر حذف الحساب بالكامل. تواصل معنا عبر /contact وسنحذف بياناتك يدوياً.",
    });
  }

  return sendJson(res, 200, { ok: true });
}
