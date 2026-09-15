/**
 * PrayerNotificationPreferences — تخزين محلي بإصدار schema + ترحيل محافظ.
 */
import { loadAdhanPrefs, saveAdhanPrefs } from "@/lib/adhan-preferences";
import { loadPrayerAlertPrefs, savePrayerAlertPrefs } from "@/lib/prayer-alert-preferences";
import {
  PRAYER_NOTIFICATION_KEYS,
  PRAYER_NOTIFICATION_SCHEMA_VERSION,
  type PrayerNotificationKey,
  type PrayerNotificationPreferences,
} from "./types";

const STORE_KEY = "majalis-prayer-notification-prefs-v1";
const LEGACY_ADHAN_KEY = "majalis-adhan-prefs-v1";
const LEGACY_ALERT_KEY = "majalis-prayer-alert-prefs-v1";

export const PRAYER_NOTIFICATION_PREFS_CHANGED = "majalis:prayer-notification-prefs-changed";

function emptyPrayers(on: boolean): Record<PrayerNotificationKey, boolean> {
  return {
    fajr: on,
    dhuhr: on,
    asr: on,
    maghrib: on,
    isha: on,
  };
}

/** افتراضي محافظ للتثبيت الجديد: معطّل حتى يفعّل المستخدم. */
export function defaultPrayerNotificationPreferences(): PrayerNotificationPreferences {
  return {
    schemaVersion: PRAYER_NOTIFICATION_SCHEMA_VERSION,
    featureEnabled: true,
    masterEnabled: false,
    prayers: emptyPrayers(false),
    soundKind: "system",
    lastTimeZone: null,
    lastFingerprint: null,
    lastSuccessfulScheduleAt: null,
  };
}

function hasLegacyPrefs(): boolean {
  try {
    return Boolean(localStorage.getItem(LEGACY_ADHAN_KEY) || localStorage.getItem(LEGACY_ALERT_KEY));
  } catch {
    return false;
  }
}

/** ترحيل من المفاتيح القديمة عند وجودها؛ وإلا إعداد محافظ. */
export function migrateFromLegacyPreferences(): PrayerNotificationPreferences {
  const base = defaultPrayerNotificationPreferences();
  if (!hasLegacyPrefs()) return base;

  try {
    const adhan = loadAdhanPrefs();
    const alerts = loadPrayerAlertPrefs();
    const prayers = emptyPrayers(false);
    for (const key of PRAYER_NOTIFICATION_KEYS) {
      prayers[key] = Boolean(adhan.prayers[key]?.enabled);
    }
    return {
      ...base,
      featureEnabled: true,
      masterEnabled: Boolean(adhan.globalEnabled && alerts.alertsEnabled),
      prayers,
      soundKind: "system",
    };
  } catch {
    return base;
  }
}

function normalize(
  raw: Partial<PrayerNotificationPreferences> | null,
): PrayerNotificationPreferences {
  const base = defaultPrayerNotificationPreferences();
  if (!raw || typeof raw !== "object") return base;
  const prayers = emptyPrayers(false);
  for (const key of PRAYER_NOTIFICATION_KEYS) {
    prayers[key] = Boolean(raw.prayers?.[key]);
  }
  return {
    schemaVersion: PRAYER_NOTIFICATION_SCHEMA_VERSION,
    featureEnabled: raw.featureEnabled !== false,
    masterEnabled: Boolean(raw.masterEnabled),
    prayers,
    soundKind: "system",
    lastTimeZone: typeof raw.lastTimeZone === "string" ? raw.lastTimeZone : null,
    lastFingerprint: typeof raw.lastFingerprint === "string" ? raw.lastFingerprint : null,
    lastSuccessfulScheduleAt:
      typeof raw.lastSuccessfulScheduleAt === "string" ? raw.lastSuccessfulScheduleAt : null,
  };
}

export function loadPrayerNotificationPreferences(): PrayerNotificationPreferences {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const migrated = migrateFromLegacyPreferences();
      savePrayerNotificationPreferences(migrated, { silent: true });
      return migrated;
    }
    const parsed = JSON.parse(raw) as Partial<PrayerNotificationPreferences>;
    if (
      typeof parsed.schemaVersion !== "number" ||
      parsed.schemaVersion < PRAYER_NOTIFICATION_SCHEMA_VERSION
    ) {
      const merged = normalize({
        ...migrateFromLegacyPreferences(),
        ...parsed,
        schemaVersion: PRAYER_NOTIFICATION_SCHEMA_VERSION,
      });
      savePrayerNotificationPreferences(merged, { silent: true });
      return merged;
    }
    return normalize(parsed);
  } catch {
    return defaultPrayerNotificationPreferences();
  }
}

export function savePrayerNotificationPreferences(
  prefs: PrayerNotificationPreferences,
  opts?: { silent?: boolean },
): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(normalize(prefs)));
  } catch {
    /* quota */
  }
  if (!opts?.silent && typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(PRAYER_NOTIFICATION_PREFS_CHANGED));
    } catch {
      /* ignore */
    }
  }
}

export function patchPrayerNotificationPreferences(
  patch: Partial<PrayerNotificationPreferences>,
): PrayerNotificationPreferences {
  const next = normalize({ ...loadPrayerNotificationPreferences(), ...patch });
  savePrayerNotificationPreferences(next);
  return next;
}

export function markScheduleMeta(opts: {
  timeZone: string;
  fingerprint: string;
  atIso?: string;
}): PrayerNotificationPreferences {
  return patchPrayerNotificationPreferences({
    lastTimeZone: opts.timeZone,
    lastFingerprint: opts.fingerprint,
    lastSuccessfulScheduleAt: opts.atIso ?? new Date().toISOString(),
  });
}

export function isPrayerAlertEnabled(
  prefs: PrayerNotificationPreferences,
  key: PrayerNotificationKey,
): boolean {
  return prefs.featureEnabled && prefs.masterEnabled && Boolean(prefs.prayers[key]);
}

/** مزامنة محافظة مع التفضيلات القديمة عند تغيير الواجهة الموحّدة. */
export function syncLegacyTogglesFromUnified(prefs: PrayerNotificationPreferences): void {
  try {
    const adhan = loadAdhanPrefs();
    adhan.globalEnabled = prefs.masterEnabled;
    for (const key of PRAYER_NOTIFICATION_KEYS) {
      adhan.prayers[key] = { ...adhan.prayers[key], enabled: prefs.prayers[key] };
    }
    saveAdhanPrefs(adhan);
  } catch {
    /* ignore */
  }
  try {
    const alerts = loadPrayerAlertPrefs();
    savePrayerAlertPrefs({ ...alerts, alertsEnabled: prefs.masterEnabled });
  } catch {
    /* ignore */
  }
}
