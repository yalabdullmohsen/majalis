/**
 * Notification trigger helpers for mobile admin approval actions.
 *
 * Calls POST /api/notifications/trigger authenticated with the current admin's
 * Supabase JWT — no shared secret is stored client-side.
 * Fire-and-forget: never throws or blocks the UI.
 */

import { supabase } from "./supabase";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

async function triggerNotification(payload: {
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  if (!API_BASE) return;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return;

    await fetch(`${API_BASE}/api/notifications/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Best-effort — never crash or block admin actions
  }
}

export async function notifyFawaidApproved(): Promise<void> {
  await triggerNotification({
    title: "فائدة جديدة",
    body: "تمت إضافة فائدة علمية جديدة — تفضّل بالاطلاع عليها",
    data: { screen: "fawaid" },
  });
}

export async function notifyLessonApproved(lessonTitle: string): Promise<void> {
  await triggerNotification({
    title: "درس جديد",
    body: `تمت إضافة درس جديد: ${lessonTitle}`,
    data: { screen: "lessons" },
  });
}
