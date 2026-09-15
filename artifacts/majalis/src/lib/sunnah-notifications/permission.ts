/**
 * إذن النظام — لا يُطلب عند أول تشغيل؛ فقط بعد فعل صريح من المستخدم.
 */

import { Capacitor } from "@capacitor/core";
import { trackNotificationTelemetry } from "./telemetry";

export type SystemPermissionState = "granted" | "denied" | "prompt" | "unsupported";

export async function getSystemNotificationPermission(): Promise<SystemPermissionState> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const cur = await LocalNotifications.checkPermissions();
      const d = String(cur.display || "");
      if (d === "granted") return "granted";
      if (d === "denied") return "denied";
      return "prompt";
    } catch {
      return "unsupported";
    }
  }
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return "prompt";
}

/**
 * طلب الإذن بعد اختيار المستخدم التفعيل فقط.
 */
export async function requestSystemNotificationPermissionFromUserGesture(): Promise<SystemPermissionState> {
  trackNotificationTelemetry("permission_prompted", {
    platform: Capacitor.getPlatform(),
  });

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const res = await LocalNotifications.requestPermissions();
      const d = String(res.display || "");
      const state: SystemPermissionState =
        d === "granted" ? "granted" : d === "denied" ? "denied" : "prompt";
      trackNotificationTelemetry(
        state === "granted" ? "permission_granted" : "permission_denied",
        { platform: Capacitor.getPlatform() },
      );
      return state;
    } catch {
      return "unsupported";
    }
  }

  if (typeof Notification === "undefined") return "unsupported";
  try {
    const res = await Notification.requestPermission();
    const state: SystemPermissionState =
      res === "granted" ? "granted" : res === "denied" ? "denied" : "prompt";
    trackNotificationTelemetry(
      state === "granted" ? "permission_granted" : "permission_denied",
      { platform: "web" },
    );
    return state;
  } catch {
    return "denied";
  }
}

/** فتح إعدادات النظام عند الرفض النهائي (Native) أو لا شيء على الويب. */
export async function openSystemNotificationSettings(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    // جسر اختياري يوفّره التطبيق الأصلي إن وُجد — دون اعتماد حزمة إضافية.
    const opener = (globalThis as unknown as {
      SunnahOpenNativeNotificationSettings?: () => Promise<boolean>;
    }).SunnahOpenNativeNotificationSettings;
    if (typeof opener === "function") {
      return await opener();
    }
  } catch {
    /* ignore */
  }
  // لا يوجد مسار Capacitor موحّد موثوق لكل المنصات هنا؛ نُبقي الزر إرشاديًا.
  return false;
}
