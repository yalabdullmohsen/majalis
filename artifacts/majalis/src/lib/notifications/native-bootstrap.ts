/**
 * إقلاع إشعارات Capacitor: قنوات، مستمعو النقر (محلي + remote)، إعادة جدولة الورد.
 * Remote Push يمر عبر maybeRegisterRemotePush → pushNotifications.ts فقط.
 */
import { isNative } from "@/lib/capacitor-utils";
import { ensureNotificationChannels } from "@/lib/notifications/channels";
import { maybeRegisterRemotePush } from "@/lib/notifications/apns-scaffold";
import { ensureQuranDailyReminderScheduled } from "@/lib/quran-daily-reminder";

const BOOT_FLAG = "__majalis_native_notif_booted__";
let _listenersAttached = false;

function navigateFromNotificationExtra(extra: unknown): void {
  try {
    const url =
      extra && typeof extra === "object" && "url" in extra
        ? (extra as { url?: unknown }).url
        : undefined;
    if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//")) return;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (current === url) return;
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
    console.info("[notifications] deep-link from notification →", url);
  } catch (e) {
    console.warn("[notifications] deep-link failed", e);
  }
}

export async function attachLocalNotificationListeners(): Promise<void> {
  if (!isNative || _listenersAttached) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.addListener("localNotificationActionPerformed", (event) => {
      console.info(
        "[notifications] actionPerformed",
        event.actionId,
        event.notification?.id,
        event.notification?.extra,
      );
      navigateFromNotificationExtra(event.notification?.extra);
    });
    await LocalNotifications.addListener("localNotificationReceived", (notification) => {
      console.info(
        "[notifications] received (foreground)",
        notification.id,
        notification.title,
      );
    });
    _listenersAttached = true;
    console.info("[notifications] local listeners attached");
  } catch (e) {
    console.warn("[notifications] attach local listeners failed", e);
  }
}

/** يُستدعى مرة واحدة من App — آمن للتكرار. */
export async function bootstrapNativeNotifications(): Promise<void> {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w[BOOT_FLAG]) return;
  w[BOOT_FLAG] = true;

  try {
    if (isNative) {
      await ensureNotificationChannels();
      await attachLocalNotificationListeners();
      // Remote push registration (APNs/FCM) — no-op when disabled / non-native.
      await maybeRegisterRemotePush();
      const pending = await import("@capacitor/local-notifications")
        .then(({ LocalNotifications }) => LocalNotifications.getPending())
        .catch(() => null);
      if (pending) {
        console.info(
          "[notifications] pending count on boot:",
          pending.notifications?.length ?? 0,
        );
      }
    }
    await ensureQuranDailyReminderScheduled();
  } catch (e) {
    console.warn("[notifications] bootstrap failed", e);
  }
}
