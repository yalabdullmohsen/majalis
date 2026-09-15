/**
 * NotificationTelemetry — أحداث دون محتوى حسّاس أو tokens.
 */

export type NotificationTelemetryEvent =
  | "permission_prompted"
  | "permission_granted"
  | "permission_denied"
  | "notification_scheduled"
  | "notification_sent"
  | "notification_opened"
  | "notification_dismissed"
  | "notification_failed"
  | "category_disabled";

type Payload = Record<string, string | number | boolean | null | undefined>;

const BUFFER_KEY = "sunnah.notifications.telemetry.v1";
const MAX = 100;

function scrub(payload: Payload): Payload {
  const out: Payload = {};
  for (const [k, v] of Object.entries(payload)) {
    if (/token|secret|password|email|phone|body|title/i.test(k)) continue;
    out[k] = v;
  }
  return out;
}

export function trackNotificationTelemetry(
  event: NotificationTelemetryEvent,
  payload: Payload = {},
): void {
  const entry = {
    event,
    at: new Date().toISOString(),
    ...scrub(payload),
  };
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    const next = Array.isArray(list) ? list : [];
    next.unshift(entry);
    localStorage.setItem(BUFFER_KEY, JSON.stringify(next.slice(0, MAX)));
  } catch {
    /* ignore */
  }

  try {
    // خط تحليلات اختياري إن وُجد بدون فرض موافقة هنا
    const w = window as unknown as {
      sunnahTrack?: (name: string, data?: Payload) => void;
    };
    w.sunnahTrack?.(`notif_${event}`, scrub(payload));
  } catch {
    /* ignore */
  }
}

export function readNotificationTelemetryBuffer(): unknown[] {
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
