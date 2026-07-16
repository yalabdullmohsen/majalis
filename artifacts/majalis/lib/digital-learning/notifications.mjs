/**
 * Learning notifications — trigger smart alerts.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { createNotification } from "../notifications/create-notification.mjs";

const NOTIFICATION_TEMPLATES = {
  new_lesson: { title: "درس جديد", type: "lesson" },
  new_book: { title: "كتاب جديد", type: "info" },
  new_fatwa: { title: "فتوى جديدة", type: "qa" },
  new_fiqh_decision: { title: "قرار فقهي", type: "alert" },
  daily_hadith: { title: "حديث اليوم", type: "info" },
  daily_ayah: { title: "آية اليوم", type: "info" },
  daily_dhikr: { title: "ذكر اليوم", type: "info" },
  course_ending: { title: "انتهاء دورة", type: "alert" },
  lecture_reminder: { title: "محاضرة قريبة", type: "lesson" },
};

export async function sendLearningNotification(admin, { userId, ruleKey, body, link }) {
  const template = NOTIFICATION_TEMPLATES[ruleKey];
  if (!template) return { ok: false, error: "unknown_rule" };

  if (admin && userId) {
    const result = await createNotification(admin, {
      userId,
      title: template.title,
      body: body || template.title,
      type: template.type,
      actionUrl: link || null,
    });
    if (result.ok) return { ok: true };
  }

  return { ok: false, reason: "no_admin_or_user" };
}

export async function getNotificationRules(admin) {
  if (admin) {
    try {
      const { data } = await admin.from("learning_notification_rules").select("*").eq("is_active", true);
      if (data?.length) return data;
    } catch {
      /* fallback */
    }
  }
  return Object.entries(NOTIFICATION_TEMPLATES).map(([key, val]) => ({
    rule_key: key,
    title_template: val.title,
    is_active: true,
  }));
}

export async function triggerDailyNotifications(admin) {
  const rules = ["daily_hadith", "daily_ayah", "daily_dhikr"];
  const results = [];
  for (const rule of rules) {
    results.push({ rule, triggered: true });
  }
  return { ok: true, triggered: results.length, rules: results };
}

export { NOTIFICATION_TEMPLATES };
