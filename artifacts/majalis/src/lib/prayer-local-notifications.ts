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
import { buildScheduledPrayerNotificationCopy } from "@/lib/prayer-notification-copy";
import {
  resolvePrayerNotificationSound,
  resolveAdhanStyleNotificationSound,
  soundRoleForNotifKind,
  type PrayerSoundProfile,
} from "@/lib/prayer-notification-sounds";
import { POST_REMINDER_MINUTES } from "@/lib/prayer-alert-preferences";
import { getEffectiveMuezzinId, loadAdhanPrefs } from "@/lib/adhan-preferences";
import {
  allPrayerNotificationIdsForWindow,
  dateISOInZone,
  friendlyAdhanNotificationKey,
  hashPrayerNotificationId,
} from "@/lib/prayer-notification-ids";
import {
  logPrayerGuardBlock,
  shouldDeliverPrayerNotification,
} from "@/lib/prayer-notification-guard";
import { formatTime12 } from "@/lib/prayer-times";

const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

/** ميزانية نظام التشغيل (~64) — نافذة متحركة: اليوم + الغد × 5 × 3 أنواع. */
const MAX_NATIVE_PRAYER_NOTIFS = 30;

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
  extra: {
    url: string;
    kind: string;
    prayerKey: string;
    prayerAtMs: number;
    dateISO: string;
    /** adhan-fajr-yyyy-mm-dd — للتشخيص؛ id الرقمي لـ Capacitor */
    friendlyKey: string;
  };
};

/** اسم ملف فقط لـ UNNotificationSound — بلا مسار. */
function assertIosNotificationFilename(sound: string): string {
  const cleaned = sound.replace(/^.*\//, "").trim();
  if (!cleaned || cleaned.includes("/") || cleaned.includes("\\")) {
    console.error("[notifications/prayer] invalid iOS sound path — using default", sound);
    return DEFAULT_ALERT_SOUND;
  }
  return cleaned;
}

function safeSound(
  role: "quiet" | "clear" | "soft",
  profile: PrayerSoundProfile,
  muezzinId?: string,
): string {
  try {
    if (role === "clear" && muezzinId) {
      return assertIosNotificationFilename(resolveAdhanStyleNotificationSound(muezzinId));
    }
    return assertIosNotificationFilename(
      resolvePrayerNotificationSound(role, profile) || DEFAULT_ALERT_SOUND,
    );
  } catch {
    return DEFAULT_ALERT_SOUND;
  }
}

function minutesToTime24(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** احذف كل معلّق وقته في الماضي + معلّقات أيام سابقة خارج النافذة. */
export async function purgePastPrayerNativeNotifications(): Promise<number> {
  if (!isNative) return 0;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { notifications } = await LocalNotifications.getPending();
    const now = Date.now();
    const past = notifications.filter((n) => {
      const at = n.schedule?.at ? new Date(n.schedule.at).getTime() : 0;
      return at > 0 && at <= now;
    });
    if (past.length) {
      await LocalNotifications.cancel({
        notifications: past.map((n) => ({ id: n.id })),
      });
    }
    return past.length;
  } catch {
    return 0;
  }
}

/**
 * بعد الجدولة: قارن أول ثلاثة أوقات بالمواقيت المتوقعة؛ فارق > دقيقة = خطأ ظاهر.
 */
export async function verifyPendingAgainstExpected(
  expected: Array<{ prayerKey: string; atMs: number; kind: string }>,
): Promise<{ ok: boolean; diffs: Array<{ id: number; deltaMin: number }> }> {
  if (!isNative) return { ok: true, diffs: [] };
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { notifications } = await LocalNotifications.getPending();
    const diffs: Array<{ id: number; deltaMin: number }> = [];
    for (const exp of expected.slice(0, 3)) {
      const match = notifications.find((n) => {
        const extra = n.extra as { prayerKey?: string; kind?: string } | undefined;
        return (
          extra?.prayerKey?.toLowerCase() === exp.prayerKey.toLowerCase() &&
          String(extra?.kind || "").includes(exp.kind)
        );
      });
      if (!match?.schedule?.at) continue;
      const deltaMin = Math.round(
        (new Date(match.schedule.at).getTime() - exp.atMs) / 60_000,
      );
      if (Math.abs(deltaMin) > 1) {
        diffs.push({ id: match.id, deltaMin });
        console.error("[notifications/prayer] schedule drift >1m", {
          id: match.id,
          deltaMin,
          expected: new Date(exp.atMs).toISOString(),
          pending: new Date(match.schedule.at).toISOString(),
        });
      }
    }
    return { ok: diffs.length === 0, diffs };
  } catch {
    return { ok: true, diffs: [] };
  }
}

let _guardListenerAttached = false;

/** حارس عند التسليم: يسجّل الحالات المرفوضة (لا يُلغى العرض على iOS بعد الإطلاق بسهولة). */
export async function ensurePrayerDeliveryGuardListener(): Promise<void> {
  if (!isNative || _guardListenerAttached) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.addListener("localNotificationReceived", (n) => {
      const extra = n.extra as {
        kind?: string;
        prayerKey?: string;
        prayerAtMs?: number;
      } | undefined;
      if (!extra?.prayerAtMs || !extra.kind?.startsWith("prayer-")) return;
      const kindRaw = extra.kind.replace("prayer-", "") as "pre" | "enter" | "post";
      const decision = shouldDeliverPrayerNotification({
        kind: kindRaw === "pre" || kindRaw === "enter" || kindRaw === "post" ? kindRaw : "enter",
        prayerAtMs: extra.prayerAtMs,
      });
      if (!decision.allow) {
        logPrayerGuardBlock({
          kind: kindRaw === "pre" || kindRaw === "post" ? kindRaw : "enter",
          prayerKey: extra.prayerKey ?? "?",
          prayerAtIso: new Date(extra.prayerAtMs).toISOString(),
          reason: decision.reason ?? "blocked",
        });
        console.warn("[notifications/prayer] guard blocked delivery", decision.reason, extra);
      }
    });
    _guardListenerAttached = true;
  } catch {
    /* ignore */
  }
}

/** جدولة إشعار قبل الصلاة + دخول الوقت + تذكير خفيف اختياري، عبر النظام الأصلي مباشرة. */
export async function schedulePrayerNativeNotifications(opts: {
  prayerKey: string;
  prayerName: string;
  prayerTimeEpochMs: number;
  /** دقائق اليوم 0–1439 لعرض الوقت في النص */
  prayerMinutesOfDay?: number;
  dateISO: string;
  preAlertEnabled: boolean;
  enterAlertEnabled: boolean;
  postReminderEnabled?: boolean;
  preAlertMinutes: number;
  soundProfile?: PrayerSoundProfile;
}): Promise<Array<{ id: number; kind: string; atMs: number }>> {
  if (!isNative) return [];
  const scheduled: Array<{ id: number; kind: string; atMs: number }> = [];
  try {
    await ensureNotificationChannels();
    await ensurePrayerDeliveryGuardListener();
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      console.info("[notifications/prayer] skip schedule — permission", perm.display);
      return [];
    }

    const profile: PrayerSoundProfile = opts.soundProfile ?? "auto";
    const adhanPrefs = loadAdhanPrefs();
    const prayerKeyNorm = opts.prayerKey.toLowerCase();
    const muezzinId = getEffectiveMuezzinId(
      adhanPrefs,
      (PRAYER_ORDER.includes(prayerKeyNorm as (typeof PRAYER_ORDER)[number])
        ? prayerKeyNorm
        : "fajr") as "fajr" | "dhuhr" | "asr" | "maghrib" | "isha",
    );

    const time24 =
      opts.prayerMinutesOfDay != null
        ? minutesToTime24(opts.prayerMinutesOfDay)
        : new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Kuwait",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(new Date(opts.prayerTimeEpochMs));
    const timeLabel = formatTime12(time24);

    const notifications: NativeNotif[] = [];
    const now = Date.now();
    // إشارة سالبة صريحة: قبل الصلاة
    const preAlertEpoch = opts.prayerTimeEpochMs - opts.preAlertMinutes * 60_000;

    if (opts.preAlertEnabled && opts.preAlertMinutes > 0 && preAlertEpoch > now) {
      const actualMins = Math.round((opts.prayerTimeEpochMs - preAlertEpoch) / 60_000);
      const preCopy = buildScheduledPrayerNotificationCopy({
        kind: "pre",
        prayerName: opts.prayerName,
        prayerTimeLabel: timeLabel,
        minutesBefore: actualMins,
      });
      const sound = safeSound(soundRoleForNotifKind("pre"), profile, muezzinId);
      const id = hashPrayerNotificationId(opts.prayerKey, opts.dateISO, "pre");
      notifications.push({
        id,
        title: preCopy.title,
        body: preCopy.body,
        // قبل الصلاة فقط — منفصل عن دخول الوقت (لا offset على الأذان نفسه)
        schedule: { at: new Date(preAlertEpoch), allowWhileIdle: true },
        sound,
        channelId: CHANNEL_PRAYER,
        interruptionLevel: "timeSensitive",
        extra: {
          url: "/prayer-times",
          kind: "prayer-pre",
          prayerKey: opts.prayerKey,
          prayerAtMs: opts.prayerTimeEpochMs,
          dateISO: opts.dateISO,
          friendlyKey: friendlyAdhanNotificationKey(opts.prayerKey, opts.dateISO, "pre"),
        },
      });
      scheduled.push({ id, kind: "pre", atMs: preAlertEpoch });
    }

    if (opts.enterAlertEnabled && opts.prayerTimeEpochMs > now) {
      const enterCopy = buildScheduledPrayerNotificationCopy({
        kind: "enter",
        prayerName: opts.prayerName,
        prayerTimeLabel: timeLabel,
      });
      const sound = safeSound(soundRoleForNotifKind("enter"), profile, muezzinId);
      const id = hashPrayerNotificationId(opts.prayerKey, opts.dateISO, "enter");
      notifications.push({
        id,
        title: enterCopy.title,
        body: enterCopy.body,
        // دخول الوقت = وقت الصلاة نفسه بالضبط — بلا تقديم ولا تأخير
        schedule: { at: new Date(opts.prayerTimeEpochMs), allowWhileIdle: true },
        sound,
        channelId: CHANNEL_PRAYER,
        interruptionLevel: "timeSensitive",
        extra: {
          url: "/prayer-times",
          kind: "prayer-enter",
          prayerKey: opts.prayerKey,
          prayerAtMs: opts.prayerTimeEpochMs,
          dateISO: opts.dateISO,
          friendlyKey: friendlyAdhanNotificationKey(opts.prayerKey, opts.dateISO, "enter"),
        },
      });
      scheduled.push({ id, kind: "enter", atMs: opts.prayerTimeEpochMs });
    }

    const postEpoch = opts.prayerTimeEpochMs + POST_REMINDER_MINUTES * 60_000;
    if (opts.postReminderEnabled && postEpoch > now) {
      const postCopy = buildScheduledPrayerNotificationCopy({
        kind: "post",
        prayerName: opts.prayerName,
        prayerTimeLabel: timeLabel,
      });
      const sound = safeSound(soundRoleForNotifKind("post"), profile, muezzinId);
      const id = hashPrayerNotificationId(opts.prayerKey, opts.dateISO, "post");
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
          prayerAtMs: opts.prayerTimeEpochMs,
          dateISO: opts.dateISO,
          friendlyKey: friendlyAdhanNotificationKey(opts.prayerKey, opts.dateISO, "post"),
        },
      });
      scheduled.push({ id, kind: "post", atMs: postEpoch });
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
  return scheduled;
}

/** قائمة معلّقات الصلاة للتشخيص (عدد + عيّنة friendlyKey/sound). */
export async function listPendingPrayerNotifications(): Promise<{
  count: number;
  items: Array<{ id: number; at: string | null; sound: string | null; friendlyKey: string | null; kind: string | null }>;
}> {
  if (!isNative) return { count: 0, items: [] };
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { notifications } = await LocalNotifications.getPending();
    const items = notifications.map((n) => {
      const extra = (n.extra ?? {}) as { friendlyKey?: string; kind?: string };
      const raw = n as { sound?: unknown };
      return {
        id: n.id,
        at: n.schedule?.at ? new Date(n.schedule.at).toISOString() : null,
        sound: typeof raw.sound === "string" ? raw.sound : null,
        friendlyKey: extra.friendlyKey ?? null,
        kind: extra.kind ?? null,
      };
    });
    return { count: items.length, items };
  } catch {
    return { count: 0, items: [] };
  }
}

/** إلغاء معلّقات الصلاة لليوم+الغد (معرّفات قابلة للتنبؤ) + أي معلّق قديم بنطاق سابق. */
export async function cancelAllPrayerNativeNotifications(): Promise<void> {
  if (!isNative) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const tz = "Asia/Kuwait";
    const today = dateISOInZone(tz);
    const tomorrow = dateISOInZone(tz, new Date(Date.now() + 24 * 3600_000));
    const ids = allPrayerNotificationIdsForWindow([today, tomorrow]);
    // نطاقات قديمة (9100/9200/9400) — تنظيف ترحيلي
    for (const key of PRAYER_ORDER) {
      const idx = PRAYER_ORDER.indexOf(key);
      ids.push({ id: 9100 + idx }, { id: 9200 + idx }, { id: 9400 + idx });
    }
    await LocalNotifications.cancel({ notifications: ids });
    await purgePastPrayerNativeNotifications();
  } catch {
    /* تجاهل */
  }
}

export async function cancelPrayerNativeNotifications(prayerKey: string): Promise<void> {
  if (!isNative) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const tz = "Asia/Kuwait";
    const today = dateISOInZone(tz);
    const tomorrow = dateISOInZone(tz, new Date(Date.now() + 24 * 3600_000));
    await LocalNotifications.cancel({
      notifications: [
        { id: hashPrayerNotificationId(prayerKey, today, "pre") },
        { id: hashPrayerNotificationId(prayerKey, today, "enter") },
        { id: hashPrayerNotificationId(prayerKey, today, "post") },
        { id: hashPrayerNotificationId(prayerKey, tomorrow, "pre") },
        { id: hashPrayerNotificationId(prayerKey, tomorrow, "enter") },
        { id: hashPrayerNotificationId(prayerKey, tomorrow, "post") },
      ],
    });
  } catch {
    /* تجاهل */
  }
}

export { MAX_NATIVE_PRAYER_NOTIFS };
