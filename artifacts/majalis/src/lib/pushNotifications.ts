/**
 * Capacitor native remote push (APNs / FCM).
 *
 * Separated from `push-notifications.ts` (Web Push / VAPID / Service Worker)
 * so native and PWA paths never double-register or fight over permissions.
 */
import { Capacitor } from "@capacitor/core";
import { isNative } from "@/lib/capacitor-utils";

/** Shared with apns-scaffold — device token storage key. */
export const APNS_TOKEN_STORAGE_KEY = "majalis_apns_device_token_v1";

export type NativePushRegistrationResult =
  | { status: "unsupported" }
  | { status: "denied" }
  | { status: "registered"; token: string; platform: string }
  | { status: "error"; message: string };

let listenersAttached = false;
let registrationInFlight: Promise<NativePushRegistrationResult> | null = null;

function navigateFromPushData(data: unknown): void {
  try {
    if (!data || typeof data !== "object") return;
    const record = data as Record<string, unknown>;
    const url =
      (typeof record.url === "string" && record.url) ||
      (typeof record.path === "string" && record.path) ||
      (typeof record.link === "string" && record.link) ||
      null;
    if (!url || !url.startsWith("/") || url.startsWith("//")) return;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (current === url) return;
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
    if (import.meta.env.DEV) console.info("[pushNotifications] deep-link →", url);
  } catch (error) {
    console.warn("[pushNotifications] deep-link failed", error);
  }
}

function persistDeviceToken(token: string): void {
  try {
    localStorage.setItem(APNS_TOKEN_STORAGE_KEY, token);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getSavedNativePushToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(APNS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function forwardTokenToServer(token: string, platform: string): Promise<void> {
  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ platform, token }),
    });
  } catch {
    /* best-effort — token remains available locally */
  }
}

/** Attach received / clicked listeners once (idempotent). */
export async function attachPushNotificationListeners(): Promise<void> {
  if (!isNative || listenersAttached) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");

  await PushNotifications.addListener("registration", (token) => {
    const value = String(token?.value || "").trim();
    if (!value) return;
    persistDeviceToken(value);
    const platform = Capacitor.getPlatform();
    if (import.meta.env.DEV) {
      console.info("[pushNotifications] registration token", platform, value.slice(0, 12) + "…");
    }
    void forwardTokenToServer(value, platform);
  });

  await PushNotifications.addListener("registrationError", (error) => {
    console.warn("[pushNotifications] registrationError", error?.error || error);
  });

  await PushNotifications.addListener("pushNotificationReceived", (notification) => {
    if (import.meta.env.DEV) {
      console.info(
        "[pushNotifications] received",
        notification?.id,
        notification?.title,
        notification?.data,
      );
    }
  });

  await PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
    if (import.meta.env.DEV) {
      console.info(
        "[pushNotifications] actionPerformed",
        event?.actionId,
        event?.notification?.id,
      );
    }
    navigateFromPushData(event?.notification?.data);
  });

  listenersAttached = true;
  if (import.meta.env.DEV) console.info("[pushNotifications] listeners attached");
}

/**
 * تسجيل Remote Push للأصل.
 * افتراضيًا لا يطلب إذنًا (آمن عند الإقلاع) — مرّر requestPermission من إعدادات المستخدم فقط.
 */
export async function registerNativePushNotifications(options?: {
  requestPermission?: boolean;
}): Promise<NativePushRegistrationResult> {
  if (!isNative) return { status: "unsupported" };
  if (registrationInFlight) return registrationInFlight;

  registrationInFlight = (async () => {
    try {
      await attachPushNotificationListeners();

      const { PushNotifications } = await import("@capacitor/push-notifications");
      let perm = await PushNotifications.checkPermissions();
      // لا نطلب إذنًا عند الإقلاع — فقط إن مُرِّر requestPermission (إعدادات المستخدم).
      if (perm.receive !== "granted") {
        if (
          options?.requestPermission &&
          (perm.receive === "prompt" || perm.receive === "prompt-with-rationale")
        ) {
          perm = await PushNotifications.requestPermissions();
        }
      }
      if (perm.receive !== "granted") {
        return { status: "denied" as const };
      }

      await PushNotifications.register();

      // Token arrives asynchronously via `registration` listener.
      const existing = getSavedNativePushToken();
      const platform = Capacitor.getPlatform();
      if (existing) {
        return { status: "registered" as const, token: existing, platform };
      }
      return {
        status: "registered" as const,
        token: "",
        platform,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("[pushNotifications] register failed", message);
      return { status: "error" as const, message };
    } finally {
      registrationInFlight = null;
    }
  })();

  return registrationInFlight;
}
