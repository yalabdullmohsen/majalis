/**
 * نقطة الإنشاء الموحّدة الوحيدة لصفوف جدول Supabase `notifications` (مركز
 * الإشعارات داخل التطبيق — الجرس في NavBar). أي ميزة تريد إشعار المستخدم
 * يجب أن تستخدم createNotification() بدل إدراج صف يدويًا، لتفادي انحراف
 * الشكل عن مخطط الجدول الفعلي (id, user_id, title, body, type, is_read,
 * action_url, created_at) — وهو ما وقع فعلاً في أكثر من موضع من قبل
 * (حقل "link" غير موجود في الجدول، فكانت الإدراجات تفشل بصمت).
 */
import { supabase } from "@/lib/supabase";

export type NotificationType = "info" | "system" | "lesson" | "qa" | "alert";

export type CreateNotificationInput = {
  userId: string;
  title: string;
  body?: string;
  type?: NotificationType;
  actionUrl?: string | null;
};

export async function createNotification(input: CreateNotificationInput): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    title: input.title,
    body: input.body ?? null,
    type: input.type ?? "info",
    action_url: input.actionUrl ?? null,
    is_read: false,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
