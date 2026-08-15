/**
 * إشعارات محلية أصلية لتنبيه الصلاة (عبر @capacitor/local-notifications على iOS/أندرويد).
 * على الويب: تُستخدَم بنية adhan-scheduler.ts الحالية (window.Notification) بدلاً منها.
 *
 * لا يُطلَب إذن الإشعارات تلقائياً هنا — انظر requestNotificationPermission()، يُستدعى
 * فقط بعد أن يضغط المستخدم زر "تفعيل" في شارة الشرح (PermissionPrompt).
 */
import { isNative } from "@/lib/capacitor-utils";
import {
  CHANNEL_PRAYER,
  DEFAULT_ALERT_SOUND,
  ensureNotificationChannels,
} from "@/lib/notifications/channels";
import {
  pickPrayerNotificationCopy,
  preAlertKindForMinutes,
} from "@/lib/prayer-notification-copy";
import {
  resolvePrayerNotificationSound,
  resolveAdhanStyleNotificationSound,
  soundRoleForNotifKind,
  type PrayerSoundProfile,
} from "@/lib/prayer-notification-sounds";
import { POST_REMINDER_MINUTES } from "@/lib/prayer-alert-preferences";
import { getEffectiveMuezzinId, loadAdhanPrefs } from "@/lib/adhan-preferences";

const PRE_ALERT_ID_BASE = 9100; // نطاق ثابت لمعرّفات إشعارات "قبل الصلاة"
const ENTER_ID_BASE = 9200; // نطاق ثابت لمعرّفات إشعارات "دخول الوقت"
const POST_ID_BASE = 9400; // نطاق ثابت لمعرّفات التذكير الخفيف بعد الدخول

const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

function idFor(base: number, prayerKey: string): number {
  const idx = PRAYER_ORDER.indexOf(prayerKey as (typeof PRAYER_ORDER)[number]);
  return base + (idx >= 0 ? idx : 9);
}

export type PermissionStatus = "granted" | "denied" | "prompt" | "unsupported";

export async function getNotificationPermissionStatus(): Promise<PermissionStatus> {
  if (!isNative) {
    if (!("Notification" in window)) return "unsupported";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    return "prompt";
  }
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const res = await LocalNotifications.checkPermissions();
    if (res.display === "granted") return "granted";
    if (res.display === "denied") return "denied";
    return "prompt";
  } catch {
    return "unsupported";
  }
}

/** يُستدعى فقط بعد موافقة المستخدم الصريحة على شرح الفائدة — لا يُستدعى تلقائياً أبداً. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative) {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    // iOS: requestPermissions يطلب alert + sound + badge معًا؛ النتيجة عبر `display`.
    const res = await LocalNotifications.requestPermissions();
    const granted = res.display === "granted";
    console.info("[notifications/prayer] permission request →", {
      display: res.display,
      options: "alert+sound+badge (iOS system prompt)",
    });
    return granted;
  } catch (e) {
    console.warn("[notifications/prayer] requestPermissions failed", e);
    return false;
  }
}

type NativeNotif = {
  id: number;
  title: string;
  body: string;
  schedule: { at: Date; allowWhileIdle: boolean };
  sound: string;
  channelId: string;
  interruptionLevel: "timeSensitive";
  extra: { url: string; kind: string; prayerKey: string };
};

function safeSound(
  role: "quiet" | "clear" | "soft",
  profile: PrayerSoundProfile,
  muezzinId?: string,
): string {
  try {
    // عند دخول الوقت: اربط بصوت المؤذن القصير إن وُجد
    if (role === "clear" && muezzinId) {
      return resolveAdhanStyleNotificationSound(muezzinId);
    }
    return resolvePrayerNotificationSound(role, profile) || DEFAULT_ALERT_SOUND;
  } catch {
    return DEFAULT_ALERT_SOUND;
  }
}

/** جدولة إشعار قبل الصلاة + دخول الوقت + تذكير خفيف اختياري، عبر النظام الأصلي مباشرة. */
export async function schedulePrayerNativeNotifications(opts: {
  prayerKey: string;
  prayerName: string;
  prayerTimeEpochMs: number;
  preAlertEnabled: boolean;
  enterAlertEnabled: boolean;
  postReminderEnabled?: boolean;
  preAlertMinutes: number;
  soundProfile?: PrayerSoundProfile;
}): Promise<void> {
  if (!isNative) return; // على الويب: adhan-scheduler.ts يتكفّل بالتنبيهات
  try {
    await ensureNotificationChannels();
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      console.info("[notifications/prayer] skip schedule — permission", perm.display);
      return;
    }

    // ألغِ أي جدولة سابقة لنفس الصلاة قبل إعادة الجدولة (لا تكرار).
    await cancelPrayerNativeNotifications(opts.prayerKey);

    const profile: PrayerSoundProfile = opts.soundProfile ?? "auto";
    const adhanPrefs = loadAdhanPrefs();
    const prayerKeyNorm = opts.prayerKey.toLowerCase();
    const muezzinId = getEffectiveMuezzinId(
      adhanPrefs,
      (["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(prayerKeyNorm)
        ? prayerKeyNorm
        : "fajr") as "fajr" | "dhuhr" | "asr" | "maghrib" | "isha",
    );
    const notifications: NativeNotif[] = [];
    const preAlertEpoch = opts.prayerTimeEpochMs - opts.preAlertMinutes * 60_000;

    if (opts.preAlertEnabled && preAlertEpoch > Date.now()) {
      const preCopy = pickPrayerNotificationCopy(
        preAlertKindForMinutes(opts.preAlertMinutes),
        opts.prayerName,
        opts.preAlertMinutes,
      );
      const sound = safeSound(soundRoleForNotifKind("pre"), profile, muezzinId);
      const id = idFor(PRE_ALERT_ID_BASE, opts.prayerKey);
      notifications.push({
        id,
        title: preCopy.title,
        body: preCopy.body,
        schedule: { at: new Date(preAlertEpoch), allowWhileIdle: true },
        sound,
        channelId: CHANNEL_PRAYER,
        interruptionLevel: "timeSensitive",
        extra: {
          url: "/prayer-times",
          kind: "prayer-pre",
          prayerKey: opts.prayerKey,
        },
      });
      console.info("[notifications/prayer] schedule", {
        prayerName: opts.prayerName,
        time: new Date(preAlertEpoch).toISOString(),
        soundName: sound,
        notificationId: id,
        kind: "pre",
      });
    }

    if (opts.enterAlertEnabled && opts.prayerTimeEpochMs > Date.now()) {
      const enterCopy = pickPrayerNotificationCopy("enter", opts.prayerName);
      const sound = safeSound(soundRoleForNotifKind("enter"), profile, muezzinId);
      const id = idFor(ENTER_ID_BASE, opts.prayerKey);
      notifications.push({
        id,
        title: enterCopy.title,
        body: enterCopy.body,
        schedule: { at: new Date(opts.prayerTimeEpochMs), allowWhileIdle: true },
        sound,
        channelId: CHANNEL_PRAYER,
        interruptionLevel: "timeSensitive",
        extra: {
          url: "/prayer-times",
          kind: "prayer-enter",
          prayerKey: opts.prayerKey,
        },
      });
      console.info("[notifications/prayer] schedule", {
        prayerName: opts.prayerName,
        time: new Date(opts.prayerTimeEpochMs).toISOString(),
        soundName: sound,
        notificationId: id,
        kind: "enter",
        muezzinId,
      });
    }

    const postEpoch = opts.prayerTimeEpochMs + POST_REMINDER_MINUTES * 60_000;
    if (opts.postReminderEnabled && postEpoch > Date.now()) {
      const postCopy = pickPrayerNotificationCopy("post-soft", opts.prayerName);
      const sound = safeSound(soundRoleForNotifKind("post"), profile, muezzinId);
      const id = idFor(POST_ID_BASE, opts.prayerKey);
      notifications.push({
        id,
        title: postCopy.title,
        body: postCopy.body,
        schedule: { at: new Date(postEpoch), allowWhileIdle: true },
        sound,
        channelId: CHANNEL_PRAYER,
        interruptionLevel: "timeSensitive",
        extra: {
          url: "/prayer-times",
          kind: "prayer-post",
          prayerKey: opts.prayerKey,
        },
      });
      console.info("[notifications/prayer] schedule", {
        prayerName: opts.prayerName,
        time: new Date(postEpoch).toISOString(),
        soundName: sound,
        notificationId: id,
        kind: "post",
      });
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
      console.info(
        "[notifications/prayer] scheduled batch",
        opts.prayerKey,
        notifications.map((n) => ({ id: n.id, sound: n.sound, at: n.schedule.at.toISOString() })),
      );
    }
  } catch (e) {
    console.warn("[notifications/prayer] schedule failed", e);
  }
}

export async function cancelPrayerNativeNotifications(prayerKey: string): Promise<void> {
  if (!isNative) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({
      notifications: [
        { id: idFor(PRE_ALERT_ID_BASE, prayerKey) },
        { id: idFor(ENTER_ID_BASE, prayerKey) },
        { id: idFor(POST_ID_BASE, prayerKey) },
      ],
    });
  } catch { /* تجاهل */ }
}

export async function cancelAllPrayerNativeNotifications(): Promise<void> {
  if (!isNative) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const ids = PRAYER_ORDER.flatMap((key) => [
      { id: idFor(PRE_ALERT_ID_BASE, key) },
      { id: idFor(ENTER_ID_BASE, key) },
      { id: idFor(POST_ID_BASE, key) },
    ]);
    await LocalNotifications.cancel({ notifications: ids });
  } catch { /* تجاهل */ }
}
