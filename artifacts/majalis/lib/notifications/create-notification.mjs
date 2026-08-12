/**
 * نقطة الإنشاء الموحّدة (طرف الخادم) لصفوف جدول Supabase `notifications`.
 * يطابق src/lib/notification-service.ts على طرف العميل — نفس الشكل بالضبط
 * (id, user_id, title, body, type, is_read, action_url, created_at).
 * استُخدم هذا الملف لتوحيد أكثر من نقطة إدراج كانت تكتب حقل "link" غير
 * الموجود في الجدول (يُفشل الإدراج بصمت) بدل "action_url" الصحيح.
 */

export async function createNotification(admin, { userId, title, body, type = "info", actionUrl = null }) {
  if (!admin || !userId || !title) return { ok: false, error: "missing_required_fields" };
  const { error } = await admin.from("notifications").insert({
    user_id: userId,
    title,
    body: body ?? null,
    type,
    action_url: actionUrl,
    is_read: false,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
