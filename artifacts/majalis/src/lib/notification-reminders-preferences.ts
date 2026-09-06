/**
 * تفضيلات التذكيرات الدينية الموحّدة (صلاة، أذان قصير، أذكار، أوراد…).
 * التخزين محلي فقط — بلا خادم. الأذان الكامل محذوف نهائيًا.
 */

import {
  DEFAULT_ADHAN_SHORT_SOUND_ID,
  DEFAULT_ALERT_SOUND_ID,
  getApprovedAlertSound,
} from "./notification-alert-catalog";
import {
  hasAskedNotificationPermission,
  markNotificationPermissionAsked,
} from "./prayer-alert-preferences";
import type { PrayerKey } from "./adhan-preferences";
import { PRAYER_KEYS } from "./adhan-preferences";

export const NOTIF_REMINDERS_STORE_KEY = "majalis-notif-reminders-v1";
export const NOTIF_REMINDERS_CHANGED_EVENT = "majalis:notif-reminders-changed";

export type ReminderSoundPrefs = {
  enabled: boolean;
  soundId: string;
};

export type OffsetReminderPrefs = ReminderSoundPrefs & {
  /** دقائق قبل/بعد الحدث المرجعي */
  offsetMinutes: number;
};

export type PrayerEnterAlertPrefs = ReminderSoundPrefs & {
  /** رسائل اختيارية لكل صلاة — إن وُجدت تُستخدم بدل النص الافتراضي */
  messages?: Partial<Record<PrayerKey, string>>;
};

export type QiyamMode = "after_isha" | "fixed";
export type QiyamReminderPrefs = ReminderSoundPrefs & {
  mode: QiyamMode;
  /** عند mode=fixed */
  hour: number;
  minute: number;
  /** دقائق بعد العشاء عند mode=after_isha */
  offsetMinutes: number;
};

export type WitrMode = "before_sleep" | "before_fajr";
export type WitrReminderPrefs = ReminderSoundPrefs & {
  mode: WitrMode;
  /** ساعة النوم التقريبية عند before_sleep */
  hour: number;
  minute: number;
  /** دقائق قبل الفجر عند before_fajr */
  offsetMinutes: number;
};

export type EveningAdhkarMode = "after_asr" | "before_maghrib";
export type EveningAdhkarPrefs = ReminderSoundPrefs & {
  mode: EveningAdhkarMode;
  offsetMinutes: number;
};

export type DailyFixedReminderPrefs = ReminderSoundPrefs & {
  hour: number;
  minute: number;
};

export type CustomGeneralReminderPrefs = ReminderSoundPrefs & {
  title: string;
  hour: number;
  minute: number;
};

export type NotifRemindersPreferences = {
  prayerPreAlert: OffsetReminderPrefs;
  prayerEnterAlert: PrayerEnterAlertPrefs;
  shortAdhan: ReminderSoundPrefs;
  lastThirdNight: ReminderSoundPrefs;
  qiyam: QiyamReminderPrefs;
  witr: WitrReminderPrefs;
  morningAdhkar: OffsetReminderPrefs;
  eveningAdhkar: EveningAdhkarPrefs;
  istighfar: DailyFixedReminderPrefs;
  dua: DailyFixedReminderPrefs;
  salawat: DailyFixedReminderPrefs;
  quranWird: DailyFixedReminderPrefs;
  kahfFriday: DailyFixedReminderPrefs;
  customGeneral: CustomGeneralReminderPrefs;
  /** وقت آخر إعادة جدولة ناجحة (ISO) */
  lastRescheduleAt: string | null;
  /**
   * هل طُلب إذن الإشعارات — يُفضَّل مفتاح prayer-alert المشترك؛
   * يُحفظ هنا أيضًا للتوافق مع واجهات التذكيرات.
   */
  permissionAsked: boolean;
};

function clampHour(v: unknown, fallback: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : fallback;
  return Math.min(23, Math.max(0, n));
}

function clampMinute(v: unknown, fallback: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : fallback;
  return Math.min(59, Math.max(0, n));
}

function clampOffset(v: unknown, fallback: number, min = 0, max = 180): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : fallback;
  return Math.min(max, Math.max(min, n));
}

/** يرفض الأذان الكامل وأي صوت غير معتمد — يرجع الافتراضي الآمن. */
export function sanitizeReminderSoundId(
  soundId: unknown,
  fallback: string = DEFAULT_ALERT_SOUND_ID,
): string {
  if (typeof soundId !== "string" || !soundId.trim()) return fallback;
  const id = soundId.trim();
  // لا تسمح بأذان كامل أو مسارات قديمة
  if (id.includes("full") || id.startsWith("adhan-seq-") || id === "adhan-full-any") {
    return fallback === DEFAULT_ADHAN_SHORT_SOUND_ID
      ? DEFAULT_ADHAN_SHORT_SOUND_ID
      : DEFAULT_ALERT_SOUND_ID;
  }
  const approved = getApprovedAlertSound(id);
  if (approved.kind === "adhan_full") {
    return DEFAULT_ADHAN_SHORT_SOUND_ID;
  }
  return approved.id;
}

/** ترحيل أي playbackMode قديم "full" → short (لا يُكتب full أبدًا). */
export function migratePlaybackModeAwayFromFull(mode: unknown): "short" | "takbir" | "silent" {
  if (mode === "full") return "short";
  if (mode === "takbir" || mode === "silent" || mode === "short") return mode;
  return "short";
}

function defaultPrefs(): NotifRemindersPreferences {
  return {
    prayerPreAlert: {
      enabled: true,
      soundId: DEFAULT_ALERT_SOUND_ID,
      offsetMinutes: 15,
    },
    prayerEnterAlert: {
      enabled: true,
      soundId: DEFAULT_ALERT_SOUND_ID,
      messages: {},
    },
    shortAdhan: {
      enabled: true,
      soundId: DEFAULT_ADHAN_SHORT_SOUND_ID,
    },
    lastThirdNight: {
      enabled: false,
      soundId: "alert-third-night",
    },
    qiyam: {
      enabled: false,
      soundId: "alert-qiyam",
      mode: "after_isha",
      hour: 2,
      minute: 0,
      offsetMinutes: 90,
    },
    witr: {
      enabled: false,
      soundId: "alert-witr",
      mode: "before_fajr",
      hour: 22,
      minute: 30,
      offsetMinutes: 30,
    },
    morningAdhkar: {
      enabled: true,
      soundId: "alert-soft-chime",
      offsetMinutes: 20,
    },
    eveningAdhkar: {
      enabled: true,
      soundId: "alert-clear-ping",
      mode: "after_asr",
      offsetMinutes: 10,
    },
    istighfar: {
      enabled: false,
      soundId: "alert-istighfar",
      hour: 10,
      minute: 0,
    },
    dua: {
      enabled: false,
      soundId: "alert-dua",
      hour: 14,
      minute: 0,
    },
    salawat: {
      enabled: false,
      soundId: "alert-salawat",
      hour: 16,
      minute: 0,
    },
    quranWird: {
      enabled: true,
      soundId: "alert-quran-wird",
      hour: 17,
      minute: 0,
    },
    kahfFriday: {
      enabled: true,
      soundId: "alert-kahf-friday",
      hour: 9,
      minute: 0,
    },
    customGeneral: {
      enabled: false,
      title: "تذكير عام",
      soundId: DEFAULT_ALERT_SOUND_ID,
      hour: 12,
      minute: 0,
    },
    lastRescheduleAt: null,
    permissionAsked: hasAskedNotificationPermission(),
  };
}

function sanitizeSoundPrefs(
  raw: Partial<ReminderSoundPrefs> | undefined,
  base: ReminderSoundPrefs,
  soundFallback: string,
): ReminderSoundPrefs {
  return {
    enabled: raw?.enabled ?? base.enabled,
    soundId: sanitizeReminderSoundId(raw?.soundId ?? base.soundId, soundFallback),
  };
}

/** تنقية كائن التفضيلات — لا يُحفظ وضع full أبدًا. */
export function sanitizeNotifRemindersPreferences(
  raw: Partial<NotifRemindersPreferences> & Record<string, unknown>,
): NotifRemindersPreferences {
  const base = defaultPrefs();

  // ترحيل صامت: إن وُجد playbackMode قديم داخل الكائن
  if ("playbackMode" in raw) {
    migratePlaybackModeAwayFromFull(raw.playbackMode);
  }

  const prayerEnterMessages: Partial<Record<PrayerKey, string>> = {};
  const rawMessages = (raw.prayerEnterAlert as PrayerEnterAlertPrefs | undefined)?.messages;
  if (rawMessages && typeof rawMessages === "object") {
    for (const key of PRAYER_KEYS) {
      const msg = rawMessages[key];
      if (typeof msg === "string" && msg.trim()) {
        prayerEnterMessages[key] = msg.trim().slice(0, 120);
      }
    }
  }

  const qiyamRaw = raw.qiyam as Partial<QiyamReminderPrefs> | undefined;
  const witrRaw = raw.witr as Partial<WitrReminderPrefs> | undefined;
  const eveningRaw = raw.eveningAdhkar as Partial<EveningAdhkarPrefs> | undefined;
  const customRaw = raw.customGeneral as Partial<CustomGeneralReminderPrefs> | undefined;

  const pre = raw.prayerPreAlert as Partial<OffsetReminderPrefs> | undefined;
  const morning = raw.morningAdhkar as Partial<OffsetReminderPrefs> | undefined;

  return {
    prayerPreAlert: {
      ...sanitizeSoundPrefs(pre, base.prayerPreAlert, DEFAULT_ALERT_SOUND_ID),
      offsetMinutes: clampOffset(pre?.offsetMinutes, base.prayerPreAlert.offsetMinutes, 0, 60),
    },
    prayerEnterAlert: {
      ...sanitizeSoundPrefs(
        raw.prayerEnterAlert as ReminderSoundPrefs | undefined,
        base.prayerEnterAlert,
        DEFAULT_ALERT_SOUND_ID,
      ),
      messages: prayerEnterMessages,
    },
    shortAdhan: sanitizeSoundPrefs(
      raw.shortAdhan as ReminderSoundPrefs | undefined,
      base.shortAdhan,
      DEFAULT_ADHAN_SHORT_SOUND_ID,
    ),
    lastThirdNight: sanitizeSoundPrefs(
      raw.lastThirdNight as ReminderSoundPrefs | undefined,
      base.lastThirdNight,
      "alert-third-night",
    ),
    qiyam: {
      ...sanitizeSoundPrefs(qiyamRaw, base.qiyam, "alert-qiyam"),
      mode: qiyamRaw?.mode === "fixed" ? "fixed" : "after_isha",
      hour: clampHour(qiyamRaw?.hour, base.qiyam.hour),
      minute: clampMinute(qiyamRaw?.minute, base.qiyam.minute),
      offsetMinutes: clampOffset(qiyamRaw?.offsetMinutes, base.qiyam.offsetMinutes, 0, 360),
    },
    witr: {
      ...sanitizeSoundPrefs(witrRaw, base.witr, "alert-witr"),
      mode: witrRaw?.mode === "before_sleep" ? "before_sleep" : "before_fajr",
      hour: clampHour(witrRaw?.hour, base.witr.hour),
      minute: clampMinute(witrRaw?.minute, base.witr.minute),
      offsetMinutes: clampOffset(witrRaw?.offsetMinutes, base.witr.offsetMinutes, 5, 180),
    },
    morningAdhkar: {
      ...sanitizeSoundPrefs(morning, base.morningAdhkar, "alert-soft-chime"),
      offsetMinutes: clampOffset(morning?.offsetMinutes, base.morningAdhkar.offsetMinutes, 0, 180),
    },
    eveningAdhkar: {
      ...sanitizeSoundPrefs(eveningRaw, base.eveningAdhkar, "alert-clear-ping"),
      mode: eveningRaw?.mode === "before_maghrib" ? "before_maghrib" : "after_asr",
      offsetMinutes: clampOffset(eveningRaw?.offsetMinutes, base.eveningAdhkar.offsetMinutes, 0, 120),
    },
    istighfar: {
      ...sanitizeSoundPrefs(
        raw.istighfar as ReminderSoundPrefs | undefined,
        base.istighfar,
        "alert-istighfar",
      ),
      hour: clampHour((raw.istighfar as DailyFixedReminderPrefs | undefined)?.hour, base.istighfar.hour),
      minute: clampMinute(
        (raw.istighfar as DailyFixedReminderPrefs | undefined)?.minute,
        base.istighfar.minute,
      ),
    },
    dua: {
      ...sanitizeSoundPrefs(raw.dua as ReminderSoundPrefs | undefined, base.dua, "alert-dua"),
      hour: clampHour((raw.dua as DailyFixedReminderPrefs | undefined)?.hour, base.dua.hour),
      minute: clampMinute((raw.dua as DailyFixedReminderPrefs | undefined)?.minute, base.dua.minute),
    },
    salawat: {
      ...sanitizeSoundPrefs(
        raw.salawat as ReminderSoundPrefs | undefined,
        base.salawat,
        "alert-salawat",
      ),
      hour: clampHour((raw.salawat as DailyFixedReminderPrefs | undefined)?.hour, base.salawat.hour),
      minute: clampMinute(
        (raw.salawat as DailyFixedReminderPrefs | undefined)?.minute,
        base.salawat.minute,
      ),
    },
    quranWird: {
      ...sanitizeSoundPrefs(
        raw.quranWird as ReminderSoundPrefs | undefined,
        base.quranWird,
        "alert-quran-wird",
      ),
      hour: clampHour(
        (raw.quranWird as DailyFixedReminderPrefs | undefined)?.hour,
        base.quranWird.hour,
      ),
      minute: clampMinute(
        (raw.quranWird as DailyFixedReminderPrefs | undefined)?.minute,
        base.quranWird.minute,
      ),
    },
    kahfFriday: {
      ...sanitizeSoundPrefs(
        raw.kahfFriday as ReminderSoundPrefs | undefined,
        base.kahfFriday,
        "alert-kahf-friday",
      ),
      hour: clampHour(
        (raw.kahfFriday as DailyFixedReminderPrefs | undefined)?.hour,
        base.kahfFriday.hour,
      ),
      minute: clampMinute(
        (raw.kahfFriday as DailyFixedReminderPrefs | undefined)?.minute,
        base.kahfFriday.minute,
      ),
    },
    customGeneral: {
      ...sanitizeSoundPrefs(customRaw, base.customGeneral, DEFAULT_ALERT_SOUND_ID),
      title:
        typeof customRaw?.title === "string" && customRaw.title.trim()
          ? customRaw.title.trim().slice(0, 80)
          : base.customGeneral.title,
      hour: clampHour(customRaw?.hour, base.customGeneral.hour),
      minute: clampMinute(customRaw?.minute, base.customGeneral.minute),
    },
    lastRescheduleAt:
      typeof raw.lastRescheduleAt === "string" ? raw.lastRescheduleAt : base.lastRescheduleAt,
    permissionAsked:
      typeof raw.permissionAsked === "boolean"
        ? raw.permissionAsked
        : hasAskedNotificationPermission(),
  };
}

export function loadNotifRemindersPrefs(): NotifRemindersPreferences {
  try {
    const raw = localStorage.getItem(NOTIF_REMINDERS_STORE_KEY);
    if (!raw) return defaultPrefs();
    const parsed = JSON.parse(raw) as Partial<NotifRemindersPreferences> & Record<string, unknown>;
    return sanitizeNotifRemindersPreferences(parsed);
  } catch {
    return defaultPrefs();
  }
}

function emitChanged() {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(NOTIF_REMINDERS_CHANGED_EVENT));
    }
  } catch {
    /* ignore */
  }
}

export function saveNotifRemindersPrefs(
  prefs: NotifRemindersPreferences,
): NotifRemindersPreferences {
  const safe = sanitizeNotifRemindersPreferences(prefs as NotifRemindersPreferences & Record<string, unknown>);
  // مزامنة علم الإذن مع مفتاح prayer-alert المشترك
  if (safe.permissionAsked) {
    markNotificationPermissionAsked();
  }
  try {
    localStorage.setItem(NOTIF_REMINDERS_STORE_KEY, JSON.stringify(safe));
  } catch {
    /* ignore quota */
  }
  emitChanged();
  return safe;
}

export function patchNotifRemindersPrefs(
  patch: Partial<NotifRemindersPreferences>,
): NotifRemindersPreferences {
  return saveNotifRemindersPrefs({ ...loadNotifRemindersPrefs(), ...patch });
}

export function setLastRescheduleAt(iso: string | null): NotifRemindersPreferences {
  return patchNotifRemindersPrefs({ lastRescheduleAt: iso });
}

export function getPermissionAskedFlag(): boolean {
  return hasAskedNotificationPermission() || loadNotifRemindersPrefs().permissionAsked;
}

export function markRemindersPermissionAsked(): void {
  markNotificationPermissionAsked();
  patchNotifRemindersPrefs({ permissionAsked: true });
}

/** عناوين عربية افتراضية لدخول وقت الصلاة */
export const PRAYER_ENTER_TITLES: Record<PrayerKey, string> = {
  fajr: "حان وقت صلاة الفجر",
  dhuhr: "حان وقت صلاة الظهر",
  asr: "حان وقت صلاة العصر",
  maghrib: "حان وقت صلاة المغرب",
  isha: "حان وقت صلاة العشاء",
};

export const REMINDER_COPY = {
  lastThirdNight: {
    title: "حان وقت الثلث الأخير من الليل",
    body: "وقتٌ مبارك للقيام والدعاء",
  },
  qiyam: {
    title: "حان وقت قيام الليل",
    body: "قم فصلِّ ما تيسّر لك",
  },
  witr: {
    title: "حان وقت الوتر",
    body: "لا تنسَ الوتر قبل النوم أو قبل الفجر",
  },
  morningAdhkar: {
    title: "حان وقت أذكار الصباح",
    body: "ابدأ يومك بذكر الله",
  },
  eveningAdhkar: {
    title: "حان وقت أذكار المساء",
    body: "اختم نهارك بأذكار المساء",
  },
  istighfar: {
    title: "تذكير بالاستغفار",
    body: "استغفر الله وأتوب إليه",
  },
  dua: {
    title: "تذكير بالدعاء",
    body: "ادعُ الله بما شئت من خير الدنيا والآخرة",
  },
  salawat: {
    title: "تذكير بالصلاة على النبي ﷺ",
    body: "اللهم صلِّ على محمد وعلى آل محمد",
  },
  quranWird: {
    title: "تذكير بورد القرآن",
    body: "اقرأ وردك اليومي من كتاب الله",
  },
  kahfFriday: {
    title: "تذكير بسورة الكهف يوم الجمعة",
    body: "يُستحب قراءة سورة الكهف يوم الجمعة",
  },
  prayerPre: {
    title: (name: string, mins: number) => `تذكير: صلاة ${name} بعد ${mins} دقيقة`,
    body: "استعد للصلاة",
  },
  shortAdhan: {
    title: (name: string) => `أذان ${name}`,
    body: "حيّ على الصلاة",
  },
} as const;
