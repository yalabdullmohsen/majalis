/**
 * DELETE / POST /api/account/delete
 *
 * يحذف حساب المستخدم المسجَّل نهائياً:
 * 1) مسح صفوف البيانات المرتبطة صراحةً (أفضل جهد)
 * 2) حذف auth.users عبر Supabase Admin API
 *    → يُكمّل ON DELETE CASCADE على الجداول المرتبطة بـ user_id
 *
 * متوافق مع Apple Guideline 5.1.1(v): حذف الحساب وبياناته من داخل التطبيق.
 */

import { sendJson } from "../../api/_http.mjs";
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { requireUser } from "../../user-auth.mjs";

/** جداول بيانات المستخدم الشخصي — تُمسح قبل حذف Auth (أفضل جهد إن وُجدت). */
const USER_OWNED_TABLES = [
  { table: "favorites", col: "user_id" },
  { table: "flashcard_reviews", col: "user_id" },
  { table: "bookmarks", col: "user_id" },
  { table: "reading_progress", col: "user_id" },
  { table: "user_citations", col: "user_id" },
  { table: "user_achievements", col: "user_id" },
  { table: "scholar_follows", col: "user_id" },
  { table: "lesson_progress", col: "user_id" },
  { table: "user_notes", col: "user_id" },
  { table: "push_subscriptions", col: "user_id" },
  { table: "device_tokens", col: "user_id" },
  { table: "profiles", col: "id" },
];

async function wipeOwnedUserData(admin, userId) {
  const wiped = [];
  const skipped = [];
  for (const { table, col } of USER_OWNED_TABLES) {
    try {
      const { error } = await admin.from(table).delete().eq(col, userId);
      if (error) {
        skipped.push({ table, reason: error.message });
      } else {
        wiped.push(table);
      }
    } catch (e) {
      skipped.push({
        table,
        reason: e instanceof Error ? e.message : "unavailable",
      });
    }
  }
  return { wiped, skipped };
}

export default async function deleteAccountHandler(req, res) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return sendJson(res, 405, { ok: false, error: "الطريقة غير مدعومة" });
  }

  const auth = await requireUser(req, res, sendJson);
  if (!auth) return;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return sendJson(res, 503, {
      ok: false,
      error: "الخدمة غير متاحة حالياً، حاول لاحقاً",
    });
  }

  const userId = auth.user.id;
  const wipe = await wipeOwnedUserData(admin, userId);

  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) {
    console.error("account/delete failed", userId, delErr);
    return sendJson(res, 500, {
      ok: false,
      error:
        "تعذّر حذف الحساب بالكامل من داخل التطبيق. أعد المحاولة لاحقاً، أو تواصل معنا عبر /contact للمساعدة دون أن يكون التواصل هو المسار الوحيد.",
      wipe,
    });
  }

  return sendJson(res, 200, {
    ok: true,
    wiped: wipe.wiped,
    // skipped = جداول غير موجودة أو بلا صلاحية — CASCADE يكمل الباقي بعد deleteUser
    skipped: wipe.skipped,
  });
}
