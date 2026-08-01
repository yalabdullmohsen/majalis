/**
 * هيكل تحضيري لـ Remote Push (APNs) — معطّل عمداً.
 *
 * الاستراتيجية الحالية: Local Notifications عبر @capacitor/local-notifications
 * (صلاة + ورد قرآن). لا يوجد `aps-environment` في App.entitlements ولا
 * `@capacitor/push-notifications` — لا تُفعَّل APNs من هنا دون قرار منتج صريح
 * وتغيير توقيع/Capabilities.
 */
import { isNative } from "@/lib/capacitor-utils";

/** اقلب إلى true فقط بعد إضافة Push capability + plugin + خادم APNs. */
export const REMOTE_PUSH_ENABLED = false;

export type ApnsRegistrationResult =
  | { status: "disabled" }
  | { status: "unsupported" }
  | { status: "ready_for_plugin"; note: string };

/**
 * نقطة تسجيل مستقبلية — اليوم تسجّل حالة التشخيص فقط ولا تطلب توكن APNs.
 */
export async function maybeRegisterRemotePush(): Promise<ApnsRegistrationResult> {
  if (!REMOTE_PUSH_ENABLED) {
    if (isNative) {
      console.info(
        "[notifications/apns] Remote Push disabled — Local Notifications are primary. " +
          "Set REMOTE_PUSH_ENABLED + aps-environment + @capacitor/push-notifications to activate.",
      );
    }
    return { status: "disabled" };
  }
  if (!isNative) return { status: "unsupported" };
  return {
    status: "ready_for_plugin",
    note: "Wire @capacitor/push-notifications register() here and forward token to backend.",
  };
}

/** معرّف ثابت لتخزين توكن APNs مستقبلاً (لا يُكتب اليوم). */
export const APNS_TOKEN_STORAGE_KEY = "majalis_apns_device_token_v1";
