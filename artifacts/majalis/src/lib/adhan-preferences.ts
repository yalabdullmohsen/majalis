/**
 * Adhan notification preferences — stored in localStorage.
 * No server dependency; works offline and without login.
 */

import {
  DEFAULT_MUEZZIN_ID,
  getDefaultFajrMuezzin,
  getMuezzin,
  hasFajrAdhan,
} from "./adhan-audio";
import {
  isAdhanPlaybackMode,
  type AdhanPlaybackMode,
} from "./adhan-playback-modes";

const STORE_KEY = "majalis-adhan-prefs-v1";

export type { AdhanPlaybackMode };

export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export const PRAYER_KEYS: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export const PRAYER_ARABIC: Record<PrayerKey, string> = {
  fajr:    "الفجر",
  dhuhr:   "الظهر",
  asr:     "العصر",
  maghrib: "المغرب",
  isha:    "العشاء",
};

export const PRAYER_ICON: Record<PrayerKey, string> = {
  fajr:    "Moon",
  dhuhr:   "Sun",
  asr:     "CloudSun",
  maghrib: "Sunset",
  isha:    "CloudMoon",
};

/** Minutes before the adhan to trigger an advance reminder. 0 = disabled. */
export type AdvanceMinutes = 0 | 5 | 10 | 15 | 20 | 30;

/** تنبيه واحد قصير (افتراضي) أو أذان كامل — لكل صلاة */
export type AdhanDeliveryMode = "short" | "full";

export type PerPrayerPrefs = {
  enabled: boolean;         // adhan notification on/off for this prayer
  muezzinId: string;        // which muezzin to use (overrides default if set)
  advanceMinutes: AdvanceMinutes; // advance reminder, 0=off
  /** override اختياري؛ فارغ = استخدم playbackMode العام إن كان short/full */
  deliveryMode?: AdhanDeliveryMode | "";
};

export type AdhanPreferences = {
  globalEnabled: boolean;           // master on/off
  browserNotificationsEnabled: boolean;
  silentReminderEnabled: boolean;
  defaultMuezzinId: string;         // fallback muezzin for all prayers
  /** صيغة التشغيل: كامل / قصير / تكبير / صامت — الافتراضي short؛ لا يُفعَّل full تلقائيًا */
  playbackMode: AdhanPlaybackMode;
  /** تشغيل مقطع الإقامة بعد الأذان إن توفّر */
  iqamahEnabled: boolean;
  /** دقائق بعد الأذان لتنبيه الإقامة (0 = مع الأذان إن فُعّلت الإقامة) */
  iqamahDelayMinutes: 0 | 5 | 10 | 15;
  /** مستوى صوت الأذان 0–1 */
  volume: number;
  /** اهتزاز مع التنبيه */
  vibrateEnabled: boolean;
  /** تجاوز الوضع الصامت / عدم الإزعاج (صريح من المستخدم) */
  bypassSilentMode: boolean;
  prayers: Record<PrayerKey, PerPrayerPrefs>;
  fridayBannerEnabled: boolean;     // show Friday Jumuah banner
};

export function isAdhanDeliveryMode(v: unknown): v is AdhanDeliveryMode {
  return v === "short" || v === "full";
}

const DEFAULT_ADVANCE: Record<PrayerKey, AdvanceMinutes> = {
  fajr:    15,
  dhuhr:   10,
  asr:     10,
  maghrib: 5,
  isha:    10,
};

function defaultPrefs(): AdhanPreferences {
  const prayers = {} as Record<PrayerKey, PerPrayerPrefs>;
  for (const key of PRAYER_KEYS) {
    prayers[key] = {
      enabled: true,
      muezzinId: "",           // "" = use defaultMuezzinId
      advanceMinutes: DEFAULT_ADVANCE[key],
      deliveryMode: "",
    };
  }
  return {
    globalEnabled: true,
    browserNotificationsEnabled: false,
    silentReminderEnabled: true,
    defaultMuezzinId: DEFAULT_MUEZZIN_ID,
    playbackMode: "short",
    iqamahEnabled: false,
    iqamahDelayMinutes: 0,
    volume: 1,
    vibrateEnabled: true,
    bypassSilentMode: false,
    prayers,
    fridayBannerEnabled: true,
  };
}

export function loadAdhanPrefs(): AdhanPreferences {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultPrefs();
    const parsed = JSON.parse(raw) as Partial<AdhanPreferences>;
    const base = defaultPrefs();
    const vol = typeof parsed.volume === "number" && Number.isFinite(parsed.volume)
      ? Math.min(1, Math.max(0, parsed.volume))
      : base.volume;
    const iqDelay = parsed.iqamahDelayMinutes;
    const merged: AdhanPreferences = {
      globalEnabled: parsed.globalEnabled ?? base.globalEnabled,
      browserNotificationsEnabled: parsed.browserNotificationsEnabled ?? base.browserNotificationsEnabled,
      silentReminderEnabled: parsed.silentReminderEnabled ?? base.silentReminderEnabled,
      defaultMuezzinId: parsed.defaultMuezzinId ?? base.defaultMuezzinId,
      playbackMode: isAdhanPlaybackMode(parsed.playbackMode)
        ? parsed.playbackMode
        : base.playbackMode,
      iqamahEnabled: parsed.iqamahEnabled ?? base.iqamahEnabled,
      iqamahDelayMinutes:
        iqDelay === 0 || iqDelay === 5 || iqDelay === 10 || iqDelay === 15
          ? iqDelay
          : base.iqamahDelayMinutes,
      volume: vol,
      vibrateEnabled: parsed.vibrateEnabled ?? base.vibrateEnabled,
      bypassSilentMode: parsed.bypassSilentMode ?? base.bypassSilentMode,
      prayers: { ...base.prayers, ...parsed.prayers },
      fridayBannerEnabled: parsed.fridayBannerEnabled ?? base.fridayBannerEnabled,
    };
    return sanitizeFajrMuezzinPrefs(merged);
  } catch {
    return defaultPrefs();
  }
}

export function saveAdhanPrefs(prefs: AdhanPreferences): AdhanPreferences {
  const safe = sanitizeFajrMuezzinPrefs(prefs);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(safe));
  } catch { /* ignore quota errors */ }
  return safe;
}

export function patchAdhanPrefs(patch: Partial<AdhanPreferences>): AdhanPreferences {
  const current = loadAdhanPrefs();
  return saveAdhanPrefs({ ...current, ...patch });
}

export function patchPrayerPrefs(
  key: PrayerKey,
  patch: Partial<PerPrayerPrefs>,
): AdhanPreferences {
  const current = loadAdhanPrefs();
  return saveAdhanPrefs({
    ...current,
    prayers: {
      ...current.prayers,
      [key]: { ...current.prayers[key], ...patch },
    },
  });
}

export function getEffectiveMuezzinId(prefs: AdhanPreferences, key: PrayerKey): string {
  const override = prefs.prayers[key].muezzinId;
  const raw = override || prefs.defaultMuezzinId || DEFAULT_MUEZZIN_ID;
  if (key !== "fajr") return raw;
  // الفجر: لا يُسند تسجيل بلا تثويب — ولا يُستبدل بأذانه العام
  const candidate = getMuezzin(raw);
  if (hasFajrAdhan(candidate)) return candidate.id;
  return getDefaultFajrMuezzin().id;
}

/**
 * صيغة التشغيل الفعلية لصلاة: تجاوز لكل صلاة (قصير/كامل) إن وُجد،
 * وإلا الوضع العام. أوضاع takbir/silent تبقى عامة ولا تُتجاوز.
 */
export function getEffectivePlaybackMode(
  prefs: AdhanPreferences,
  key: PrayerKey,
): AdhanPlaybackMode {
  const global = prefs.playbackMode ?? "short";
  if (global === "takbir" || global === "silent") return global;
  const per = prefs.prayers[key]?.deliveryMode;
  if (isAdhanDeliveryMode(per)) return per;
  return global === "full" ? "full" : "short";
}

/** يطبّق المؤذن الافتراضي على كل الصلوات دفعة واحدة */
export function applyDefaultMuezzinToAllPrayers(muezzinId: string): AdhanPreferences {
  const current = loadAdhanPrefs();
  const prayers = { ...current.prayers };
  for (const key of PRAYER_KEYS) {
    prayers[key] = { ...prayers[key], muezzinId: "" };
  }
  return saveAdhanPrefs({
    ...current,
    defaultMuezzinId: muezzinId,
    prayers,
  });
}

/**
 * إن كان للفجر مؤذن بلا تثويب مخزَّن صراحةً، امسحه أو استبدله بمؤهل.
 * يُستدعى عند التحميل/الحفظ حتى لا يبقى اختيار غير شرعي.
 */
export function sanitizeFajrMuezzinPrefs(prefs: AdhanPreferences): AdhanPreferences {
  const fajrId = prefs.prayers.fajr.muezzinId;
  if (!fajrId) {
    // يعتمد على الافتراضي — يُحلّ عبر getEffectiveMuezzinId
    return prefs;
  }
  if (hasFajrAdhan(getMuezzin(fajrId))) return prefs;
  return {
    ...prefs,
    prayers: {
      ...prefs.prayers,
      fajr: { ...prefs.prayers.fajr, muezzinId: getDefaultFajrMuezzin().id },
    },
  };
}
