/**
 * نصوص إشعارات الصلاة — واجهة متوافقة مع الجدولة الحالية.
 * المصدر المركزي: `notifications/localization.ts`.
 */

import {
  NOTIFICATION_CATALOG,
  buildPrayerLocalizedCopy,
  fillNotificationTemplate,
  formatNotificationMinutesPhrase,
  pickFromPool,
  pickLocalizedNotification,
  type LocalizedNotification,
} from "@/lib/notifications/localization";

export type PrayerNotifKind =
  | "pre-15"
  | "pre-10"
  | "pre-5"
  | "enter"
  | "after"
  | "post-soft";

export type PrayerNotifCopy = LocalizedNotification;

type Template = { title: string; body: string };

const TEMPLATES: Record<PrayerNotifKind, Template[]> = {
  enter: [...NOTIFICATION_CATALOG.prayerAdhan],
  "pre-15": [...NOTIFICATION_CATALOG.prayerPre],
  "pre-10": [...NOTIFICATION_CATALOG.prayerPre],
  "pre-5": [...NOTIFICATION_CATALOG.prayerPre],
  after: [...NOTIFICATION_CATALOG.prayerPost],
  "post-soft": [...NOTIFICATION_CATALOG.prayerPost],
};

const FALLBACK: PrayerNotifCopy = {
  title: "وقت الصلاة",
  body: "دخل وقت الصلاة.",
};

function fill(template: string, name: string, mins: number): string {
  return fillNotificationTemplate(template, {
    name,
    mins,
    minsPhrase: formatNotificationMinutesPhrase(mins),
  });
}

/** أقرب مجموعة نصوص حسب دقائق التنبيه المسبق. */
export function preAlertKindForMinutes(minutes: number): "pre-15" | "pre-10" | "pre-5" {
  if (minutes <= 5) return "pre-5";
  if (minutes <= 10) return "pre-10";
  return "pre-15";
}

export function formatPreAlertMinutesPhrase(minutes: number): string {
  return formatNotificationMinutesPhrase(minutes);
}

/**
 * نص مجدول لإشعارات الصلاة.
 * يستدعيه prayer-local-notifications و adhan-scheduler.
 */
export function buildScheduledPrayerNotificationCopy(opts: {
  kind: "pre" | "enter" | "post" | "iqamah";
  prayerName: string;
  prayerTimeLabel: string;
  minutesBefore?: number;
}): PrayerNotifCopy {
  return buildPrayerLocalizedCopy({
    kind: opts.kind,
    prayerName: opts.prayerName,
    prayerTimeLabel: opts.prayerTimeLabel,
    minutesBefore: opts.minutesBefore,
  });
}

/** رسالة احترام هدوء الجوال — بلا افتراض أن المستخدم يصلّي. */
export function pickPrayerRespectPostBody(name = ""): string {
  // عبارات مرجعية للبوابة: وضع الصامت | أغلق الجوال
  return pickLocalizedNotification("prayerRespect", { name }).body;
}

/** @deprecated اسم قديم */
export const pickPrayerRespectPostBodyLegacy = pickPrayerRespectPostBody;

export function pickPrayerNotificationCopy(
  kind: PrayerNotifKind,
  prayerName: string,
  minutes = 0,
): PrayerNotifCopy {
  try {
    const pool = TEMPLATES[kind];
    if (!pool?.length) {
      return {
        title: FALLBACK.title,
        body: fill("دخل وقت صلاة {{name}}.", prayerName, minutes) || FALLBACK.body,
      };
    }
    const safeMins = Math.max(1, minutes || 1);
    const copy = pickFromPool(`prayer-legacy-${kind}`, pool, {
      name: prayerName,
      mins: safeMins,
      minsPhrase: formatNotificationMinutesPhrase(safeMins),
    });
    // قوالب الأذان الحديثة تعتمد {{clock}}؛ عند غياب الساعة نضمن متنًا قصيرًا غير فارغ.
    if (!copy.body.trim()) {
      const fallbackBody =
        kind === "enter"
          ? "دخل الوقت."
          : kind.startsWith("pre")
            ? "اقترب الأذان."
            : "تذكير بالصلاة.";
      return { title: copy.title, body: fallbackBody };
    }
    return copy;
  } catch {
    return {
      title: FALLBACK.title,
      body: fill("اقتربت صلاة {{name}}.", prayerName, minutes) || FALLBACK.body,
    };
  }
}

export function listPrayerNotificationTemplates(): Record<PrayerNotifKind, Template[]> {
  return TEMPLATES;
}
