/**
 * NotificationDispatcher — مسار واحد لكل قناة (local أو push)، بلا ازدواج.
 */

import { Capacitor } from "@capacitor/core";
import type { SunnahNotificationChannel } from "./channels";
import { composeSunnahNotification, type ComposeInput } from "./composer";
import { upsertDedupeRecord } from "./deduplicator";
import { evaluateNotificationEligibility } from "./eligibility";
import { recordNonEssentialSend } from "./rate-limit";
import { trackNotificationTelemetry } from "./telemetry";

export type DispatchRequest = {
  channel: SunnahNotificationChannel;
  userId?: string | null;
  entityId: string;
  eventType: string;
  compose: Omit<ComposeInput, "channel">;
  stillRelevant?: boolean;
  expiresAt?: string | null;
  now?: Date;
};

export type DispatchResult =
  | {
      ok: true;
      transport: "local" | "push";
      dedupeKey: string;
      deliverAt: string;
      title: string;
      body: string;
      deepLink: string | null;
      deferred: boolean;
    }
  | { ok: false; reason: string; detail?: string };

async function scheduleLocalNotification(payload: {
  title: string;
  body: string;
  deepLink: string | null;
  deliverAt: string;
  idHash: string;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // ويب: Notification API فقط إن كان الإذن ممنوحًا مسبقًا — بلا طلب هنا
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const when = Date.parse(payload.deliverAt);
    const delay = Math.max(0, when - Date.now());
    window.setTimeout(() => {
      try {
        const n = new Notification(payload.title, {
          body: payload.body,
          tag: payload.idHash.slice(0, 64),
          data: { url: payload.deepLink },
        });
        void n;
      } catch {
        /* ignore */
      }
    }, Math.min(delay, 2_147_000_000));
    return;
  }

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const when = new Date(payload.deliverAt);
    const id = Math.abs(
      Array.from(payload.idHash).reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0),
    );
    await LocalNotifications.schedule({
      notifications: [
        {
          id: (id % 900_000) + 50_000,
          title: payload.title,
          body: payload.body,
          schedule: { at: when },
          extra: { url: payload.deepLink, channel: "sunnah" },
        },
      ],
    });
  } catch {
    /* native unavailable */
  }
}

/**
 * إرسال/جدولة إشعار عبر المسار الوحيد للقناة.
 * لا يستدعي push و local معًا.
 */
export async function dispatchSunnahNotification(
  request: DispatchRequest,
): Promise<DispatchResult> {
  const eligibility = evaluateNotificationEligibility({
    channel: request.channel,
    userId: request.userId,
    entityId: request.entityId,
    eventType: request.eventType,
    deepLink: request.compose.deepLink,
    stillRelevant: request.stillRelevant,
    expiresAt: request.expiresAt,
    now: request.now,
  });

  if (!eligibility.ok) {
    trackNotificationTelemetry("notification_failed", {
      channel: request.channel,
      reason: eligibility.reason,
    });
    return { ok: false, reason: eligibility.reason, detail: eligibility.detail };
  }

  const composed = composeSunnahNotification({
    channel: request.channel,
    ...request.compose,
    deepLink: eligibility.deepLink ?? request.compose.deepLink,
  });

  const expiresAt =
    request.expiresAt ??
    new Date(Date.parse(eligibility.deliverAt) + 36 * 60 * 60 * 1000).toISOString();

  upsertDedupeRecord({
    key: eligibility.dedupeKey,
    channel: request.channel,
    status: "scheduled",
    expiresAt,
    transport: eligibility.transport,
  });

  trackNotificationTelemetry("notification_scheduled", {
    channel: request.channel,
    transport: eligibility.transport,
  });

  if (eligibility.transport === "local") {
    await scheduleLocalNotification({
      title: composed.title,
      body: composed.body,
      deepLink: composed.deepLink,
      deliverAt: eligibility.deliverAt,
      idHash: eligibility.dedupeKey,
    });
    upsertDedupeRecord({
      key: eligibility.dedupeKey,
      channel: request.channel,
      status: "sent",
      expiresAt,
      transport: "local",
    });
    recordNonEssentialSend(request.channel, request.now ?? new Date());
    trackNotificationTelemetry("notification_sent", {
      channel: request.channel,
      transport: "local",
    });
  } else {
    // Push: العميل لا يرسل مباشرة لمستخدمين آخرين — يُسجَّل للخادم الموثوق فقط
    upsertDedupeRecord({
      key: eligibility.dedupeKey,
      channel: request.channel,
      status: "scheduled",
      expiresAt,
      transport: "push",
    });
    trackNotificationTelemetry("notification_scheduled", {
      channel: request.channel,
      transport: "push",
      queued: true,
    });
  }

  const deferred = Date.parse(eligibility.deliverAt) > Date.now() + 1000;
  return {
    ok: true,
    transport: eligibility.transport,
    dedupeKey: eligibility.dedupeKey,
    deliverAt: eligibility.deliverAt,
    title: composed.title,
    body: composed.body,
    deepLink: composed.deepLink,
    deferred,
  };
}
