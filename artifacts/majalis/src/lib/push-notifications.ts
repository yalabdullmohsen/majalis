/**
 * Web Push Notifications — frontend subscription logic.
 *
 * يتطلب تفعيل الإشعارات الحقيقية ضبط المتغيرات في Vercel:
 *   VITE_VAPID_PUBLIC_KEY  — المفتاح العام للـ VAPID
 *   VAPID_PRIVATE_KEY      — المفتاح الخاص (server-only)
 *   VAPID_EMAIL            — بريد المطوّر (مثل: mailto:admin@example.com)
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const PUSH_SUB_KEY     = "mj-push-sub-v1";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export type PushPermissionState = "unsupported" | "denied" | "granted" | "default" | "no-vapid";

export function getPushSupport(): PushPermissionState {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }
  if (!VAPID_PUBLIC_KEY) return "no-vapid";
  return Notification.permission as PushPermissionState;
}

/** طلب الإذن والاشتراك بـ Push. يعيد null إن رُفض أو غير مدعوم. */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  const state = getPushSupport();
  if (state === "unsupported" || state === "no-vapid" || state === "denied") return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      savePushSub(existing);
      return existing;
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
    });

    savePushSub(sub);
    await sendSubToServer(sub);
    return sub;
  } catch (err) {
    console.warn("[push] subscribe failed:", err);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      localStorage.removeItem(PUSH_SUB_KEY);
    }
  } catch { /* ignore */ }
}

export function getSavedPushSub(): PushSubscription | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PUSH_SUB_KEY);
    return raw ? JSON.parse(raw) as PushSubscription : null;
  } catch { return null; }
}

function savePushSub(sub: PushSubscription): void {
  try { localStorage.setItem(PUSH_SUB_KEY, JSON.stringify(sub)); } catch { /* ignore */ }
}

async function sendSubToServer(sub: PushSubscription): Promise<void> {
  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(sub),
    });
  } catch { /* ignore — subscription is saved locally */ }
}
