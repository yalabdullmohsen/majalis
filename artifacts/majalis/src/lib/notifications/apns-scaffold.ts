/**
 * Remote Push (APNs / FCM) via `@capacitor/push-notifications`.
 *
 * Local Notifications تبقى الأساس للصلاة وورد القرآن.
 * Web Push (`push-notifications.ts`) يبقى لمسار PWA فقط ولا يُستدعى على Native.
 */
import { isNative } from "@/lib/capacitor-utils";

/** مفعّل افتراضياً بعد تركيب الإضافة. عطّل بـ VITE_REMOTE_PUSH_ENABLED=false */
export const REMOTE_PUSH_ENABLED = (() => {
  try {
    const viteEnv = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env;
    const fromVite = viteEnv?.VITE_REMOTE_PUSH_ENABLED;
    if (typeof fromVite === "string" && fromVite.length > 0) {
      return fromVite.toLowerCase() !== "false";
    }
  } catch {
    /* Node unit tests / non-Vite loaders */
  }
  try {
    const fromProcess = typeof process !== "undefined" ? process.env?.VITE_REMOTE_PUSH_ENABLED : undefined;
    if (typeof fromProcess === "string" && fromProcess.length > 0) {
      return fromProcess.toLowerCase() !== "false";
    }
  } catch {
    /* ignore */
  }
  return true;
})();

export type ApnsRegistrationResult =
  | { status: "disabled" }
  | { status: "unsupported" }
  | { status: "denied" }
  | { status: "registered"; token?: string; platform?: string }
  | { status: "error"; message: string };

/** معرّف ثابت لتخزين توكن الجهاز (APNs على iOS / FCM على Android). */
export { APNS_TOKEN_STORAGE_KEY } from "@/lib/pushNotifications";

/**
 * تسجيل Remote Push داخل الغلاف الأصلي فقط.
 * لا يتعارض مع Web Push ولا مع مستمعي Local Notifications.
 */
export async function maybeRegisterRemotePush(options?: {
  requestPermission?: boolean;
}): Promise<ApnsRegistrationResult> {
  if (!REMOTE_PUSH_ENABLED) {
    if (isNative && import.meta.env.DEV) {
      console.info(
        "[notifications/apns] Remote Push disabled via VITE_REMOTE_PUSH_ENABLED=false",
      );
    }
    return { status: "disabled" };
  }
  if (!isNative) return { status: "unsupported" };

  const { registerNativePushNotifications } = await import("@/lib/pushNotifications");
  // الإقلاع: تسجيل صامت إن كان الإذن ممنوحًا مسبقًا فقط — بلا حوار.
  const result = await registerNativePushNotifications({
    requestPermission: options?.requestPermission === true,
  });

  if (result.status === "registered" && import.meta.env.DEV) {
    console.info(
      "[notifications/apns] native push registered",
      result.platform,
      result.token ? `${result.token.slice(0, 12)}…` : "(awaiting token event)",
    );
  }

  return result;
}
