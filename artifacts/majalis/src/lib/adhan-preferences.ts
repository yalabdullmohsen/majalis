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
/** مفتاح مواصفات الواجهة — يُزامَن مع defaultMuezzinId */
export const SELECTED_MUEZZIN_STORAGE_KEY = "selected_muezzin_id";

function syncSelectedMuezzinId(id: string) {
  try {
    if (id) localStorage.setItem(SELECTED_MUEZZIN_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

function readSelectedMuezzinIdFallback(): string | null {
  try {
    const v = localStorage.getItem(SELECTED_MUEZZIN_STORAGE_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

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

/** تنبيه لكل صلاة: كامل / قصير / تكبيرات / صامت — أو فارغ = الوضع العام */
export type AdhanDeliveryMode = AdhanPlaybackMode;

export type PerPrayerPrefs = {
  enabled: boolean;         // adhan notification on/off for this prayer
  muezzinId: string;        // which muezzin to use (overrides default if set)
  advanceMinutes: AdvanceMinutes; // advance reminder, 0=off
  /** override اختياري؛ فارغ = استخدم playbackMode العام */
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
  /**
   * تجاوز الوضع الصامت — غير مدعوم دون Critical Alerts من Apple.
   * يُحفظ للتوافق ويُتجاهل دائمًا ما دام CRITICAL_ALERTS_ENTITLEMENT_PRESENT=false.
   */
  bypassSilentMode: boolean;
  /**
   * تجريبي: أذان كامل عبر إشعارات متتابعة (مقاطع CAF).
   * غير مضمون على iOS مع الصامت/Focus — الافتراضي false.
   */
  iosSequentialFullAdhan: boolean;
  prayers: Record<PrayerKey, PerPrayerPrefs>;
  fridayBannerEnabled: boolean;     // show Friday Jumuah banner
};

export function isAdhanDeliveryMode(v: unknown): v is AdhanDeliveryMode {
  return isAdhanPlaybackMode(v);
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
    iosSequentialFullAdhan: false,
    prayers,
    fridayBannerEnabled: true,
  };
}

export function loadAdhanPrefs(): AdhanPreferences {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const legacyId = readSelectedMuezzinIdFallback();
      const base = defaultPrefs();
      if (legacyId) {
        const withLegacy = { ...base, defaultMuezzinId: legacyId };
        syncSelectedMuezzinId(legacyId);
        return sanitizeFajrMuezzinPrefs(withLegacy);
      }
      syncSelectedMuezzinId(base.defaultMuezzinId);
      return base;
    }
    const parsed = JSON.parse(raw) as Partial<AdhanPreferences>;
    const base = defaultPrefs();
    const vol = typeof parsed.volume === "number" && Number.isFinite(parsed.volume)
      ? Math.min(1, Math.max(0, parsed.volume))
      : base.volume;
    const iqDelay = parsed.iqamahDelayMinutes;
    const defaultMuezzinId =
      parsed.defaultMuezzinId ??
      readSelectedMuezzinIdFallback() ??
      base.defaultMuezzinId;
    const merged: AdhanPreferences = {
      globalEnabled: parsed.globalEnabled ?? base.globalEnabled,
      browserNotificationsEnabled: parsed.browserNotificationsEnabled ?? base.browserNotificationsEnabled,
      silentReminderEnabled: parsed.silentReminderEnabled ?? base.silentReminderEnabled,
      defaultMuezzinId,
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
      bypassSilentMode: false, // Critical Alerts غير متوفر — لا نفعّل أبدًا من التخزين
      iosSequentialFullAdhan: parsed.iosSequentialFullAdhan ?? base.iosSequentialFullAdhan,
      prayers: { ...base.prayers, ...parsed.prayers },
      fridayBannerEnabled: parsed.fridayBannerEnabled ?? base.fridayBannerEnabled,
    };
    syncSelectedMuezzinId(merged.defaultMuezzinId);
    return sanitizeFajrMuezzinPrefs(merged);
  } catch {
    return defaultPrefs();
  }
}

/** يُطلَق بعد كل حفظ لتفضيلات الأذان — يعيد جدولة المؤقّتات والإشعارات. */
export const ADHAN_PREFS_CHANGED_EVENT = "majalis:adhan-prefs-changed";

function emitAdhanPrefsChanged() {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(ADHAN_PREFS_CHANGED_EVENT));
    }
  } catch {
    /* ignore */
  }
}

export function saveAdhanPrefs(prefs: AdhanPreferences): AdhanPreferences {
  const safe = sanitizeFajrMuezzinPrefs({
    ...prefs,
    bypassSilentMode: false,
  });
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(safe));
  } catch { /* ignore quota errors */ }
  syncSelectedMuezzinId(safe.defaultMuezzinId);
  emitAdhanPrefsChanged();
  return safe;
}

export function patchAdhanPrefs(patch: Partial<AdhanPreferences>): AdhanPreferences {
  const current = loadAdhanPrefs();
  // Critical Alerts غير متوفر — تجاهل أي محاولة لتفعيل تجاوز الصامت
  return saveAdhanPrefs({ ...current, ...patch, bypassSilentMode: false });
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
 * صيغة التشغيل الفعلية لصلاة: تجاوز لكل صلاة إن وُجد، وإلا الوضع العام.
 * إذا عُطّلت الصلاة (enabled=false) تُعامل كـ silent من جهة المستدعي.
 */
export function getEffectivePlaybackMode(
  prefs: AdhanPreferences,
  key: PrayerKey,
): AdhanPlaybackMode {
  const global = prefs.playbackMode ?? "short";
  const per = prefs.prayers[key]?.deliveryMode;
  if (isAdhanDeliveryMode(per)) return per;
  return global;
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
