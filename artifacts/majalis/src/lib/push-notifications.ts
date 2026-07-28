/**
 * Web Push Notifications — frontend subscription logic.
 *
 * Client-only: uses the public VAPID key (`VITE_VAPID_PUBLIC_KEY`).
 * Private VAPID material must stay on the server (never bundled here).
 */

import { decodeBase64UrlToBytes, zeroBytes } from "@/lib/secure-memory";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const PUSH_SUB_KEY     = "mj-push-sub-v1";

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

    const keyBytes = decodeBase64UrlToBytes(VAPID_PUBLIC_KEY!);
    try {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes,
      });

      savePushSub(sub);
      await sendSubToServer(sub);
      return sub;
    } finally {
      zeroBytes(keyBytes);
    }
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
      try {
        const json = sub.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            endpoint: json.endpoint,
            expirationTime: json.expirationTime ?? null,
            keys: json.keys,
            unsubscribe: true,
          }),
        });
      } catch { /* ignore network */ }
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
    const json = sub.toJSON();
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        endpoint: json.endpoint,
        expirationTime: json.expirationTime ?? null,
        keys: json.keys,
      }),
    });
  } catch { /* ignore — subscription is saved locally */ }
}
