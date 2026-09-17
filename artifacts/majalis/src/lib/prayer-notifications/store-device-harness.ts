/**
 * Store device test harness — DEV / explicit opt-in only.
 * Does not alter prayer calculation. Uses a separate notification id namespace.
 */
import { isNative } from "@/lib/capacitor-utils";

export const STORE_DEVICE_HARNESS_NAMESPACE = "majalis-store-device-test";
export const STORE_DEVICE_TEST_NOTIF_ID = 920_001;

export type StoreDeviceHarnessResult =
  | { ok: true; scheduledAtIso: string; platform: "ios" | "android" | "web" }
  | { ok: false; reason: string };

function harnessEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    return localStorage.getItem("majalis-store-device-harness") === "1";
  } catch {
    return false;
  }
}

/** Schedule a single near-future test notification (native + opted-in DEV only). */
export async function scheduleStoreDeviceTestNotification(
  delayMs = 60_000,
): Promise<StoreDeviceHarnessResult> {
  if (!harnessEnabled()) {
    return { ok: false, reason: "harness_disabled" };
  }
  if (!isNative) {
    return { ok: false, reason: "web_context_not_valid_device_proof" };
  }
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const when = new Date(Date.now() + Math.max(15_000, delayMs));
    await LocalNotifications.schedule({
      notifications: [
        {
          id: STORE_DEVICE_TEST_NOTIF_ID,
          title: "سُنّة — اختبار جهاز",
          body: `Harness ${STORE_DEVICE_HARNESS_NAMESPACE}`,
          schedule: { at: when },
          extra: { ns: STORE_DEVICE_HARNESS_NAMESPACE, kind: "store_device_test" },
        },
      ],
    });
    const platform =
      (window as { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.() ===
      "ios"
        ? "ios"
        : "android";
    return { ok: true, scheduledAtIso: when.toISOString(), platform };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "schedule_failed" };
  }
}

export async function cancelStoreDeviceTestNotifications(): Promise<void> {
  if (!isNative) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({
      notifications: [{ id: STORE_DEVICE_TEST_NOTIF_ID }],
    });
  } catch {
    /* ignore */
  }
}
