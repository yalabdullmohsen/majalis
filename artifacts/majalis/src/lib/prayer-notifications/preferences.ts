/**
 * PrayerNotificationPreferences — تخزين محلي بإصدار schema + ترحيل محافظ.
 */
import { loadAdhanPrefs, saveAdhanPrefs } from "@/lib/adhan-preferences";
import { loadPrayerAlertPrefs, savePrayerAlertPrefs } from "@/lib/prayer-alert-preferences";
import {
  PRAYER_ALERT_STYLES,
  PRAYER_NOTIFICATION_KEYS,
  PRAYER_NOTIFICATION_SCHEMA_VERSION,
  type PrayerAlertStyle,
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


const ALERT_STYLE_SET = new Set<string>(PRAYER_ALERT_STYLES);

function emptyAlertStyles(style: PrayerAlertStyle = "system"): Record<PrayerNotificationKey, PrayerAlertStyle> {
  return { fajr: style, dhuhr: style, asr: style, maghrib: style, isha: style };
}

function emptyVoices(voice = ""): Record<PrayerNotificationKey, string> {
  return { fajr: voice, dhuhr: voice, asr: voice, maghrib: voice, isha: voice };
}

function mapDeliveryToAlertStyle(mode: string | undefined | null): PrayerAlertStyle {
  if (mode === "full") return "full_adhan";
  if (mode === "short") return "short_adhan";
  if (mode === "takbir") return "takbirat";
  return "system";
}

function mapAlertStyleToDelivery(style: PrayerAlertStyle): "full" | "short" | "takbir" | "silent" | "" {
  if (style === "full_adhan") return "full";
  if (style === "short_adhan") return "short";
  if (style === "takbirat") return "takbir";
  if (style === "system") return "silent";
  return "";
}


/** افتراضي محافظ للتثبيت الجديد: معطّل حتى يفعّل المستخدم. */
export function defaultPrayerNotificationPreferences(): PrayerNotificationPreferences {
  return {
    schemaVersion: PRAYER_NOTIFICATION_SCHEMA_VERSION,
    featureEnabled: true,
    masterEnabled: false,
    prayers: emptyPrayers(false),
    alertStyleByPrayer: emptyAlertStyles("system"),
    voiceIdByPrayer: emptyVoices(""),
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
    const alertStyleByPrayer = emptyAlertStyles("system");
    const voiceIdByPrayer = emptyVoices("");
    for (const key of PRAYER_NOTIFICATION_KEYS) {
      prayers[key] = Boolean(adhan.prayers[key]?.enabled);
      const delivery = adhan.prayers[key]?.deliveryMode || adhan.playbackMode;
      alertStyleByPrayer[key] = mapDeliveryToAlertStyle(delivery);
      const voice = adhan.prayers[key]?.muezzinId || adhan.defaultMuezzinId || "";
      voiceIdByPrayer[key] = typeof voice === "string" ? voice : "";
    }
    return {
      ...base,
      featureEnabled: true,
      masterEnabled: Boolean(adhan.globalEnabled && alerts.alertsEnabled),
      prayers,
      alertStyleByPrayer,
      voiceIdByPrayer,
      soundKind: "system",
    };
  } catch {
    return base;
  }
}

function normalizeAlertStyles(
  raw: Partial<PrayerNotificationPreferences> | null | undefined,
  fallback: PrayerAlertStyle,
): Record<PrayerNotificationKey, PrayerAlertStyle> {
  const out = emptyAlertStyles(fallback);
  const src = raw?.alertStyleByPrayer;
  if (!src || typeof src !== "object") return out;
  for (const key of PRAYER_NOTIFICATION_KEYS) {
    const value = src[key];
    if (typeof value === "string" && ALERT_STYLE_SET.has(value)) {
      out[key] = value as PrayerAlertStyle;
    }
  }
  return out;
}

function normalizeVoices(
  raw: Partial<PrayerNotificationPreferences> | null | undefined,
): Record<PrayerNotificationKey, string> {
  const out = emptyVoices("");
  const src = raw?.voiceIdByPrayer;
  if (!src || typeof src !== "object") return out;
  for (const key of PRAYER_NOTIFICATION_KEYS) {
    const value = src[key];
    out[key] = typeof value === "string" && value.trim() ? value.trim() : "";
  }
  return out;
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
    alertStyleByPrayer: normalizeAlertStyles(raw, "system"),
    voiceIdByPrayer: normalizeVoices(raw),
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
  const current = loadPrayerNotificationPreferences();
  const next = normalize({
    ...current,
    ...patch,
    prayers: patch.prayers ? { ...current.prayers, ...patch.prayers } : current.prayers,
    alertStyleByPrayer: patch.alertStyleByPrayer
      ? { ...current.alertStyleByPrayer, ...patch.alertStyleByPrayer }
      : current.alertStyleByPrayer,
    voiceIdByPrayer: patch.voiceIdByPrayer
      ? { ...current.voiceIdByPrayer, ...patch.voiceIdByPrayer }
      : current.voiceIdByPrayer,
  });
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

export function getPrayerAlertStyle(
  prefs: PrayerNotificationPreferences,
  key: PrayerNotificationKey,
): PrayerAlertStyle {
  return prefs.alertStyleByPrayer[key] ?? "system";
}

export function getPrayerVoiceId(
  prefs: PrayerNotificationPreferences,
  key: PrayerNotificationKey,
): string {
  return prefs.voiceIdByPrayer[key] ?? "";
}

/** مزامنة محافظة مع التفضيلات القديمة عند تغيير الواجهة الموحّدة. */
export function syncLegacyTogglesFromUnified(prefs: PrayerNotificationPreferences): void {
  try {
    const adhan = loadAdhanPrefs();
    adhan.globalEnabled = prefs.masterEnabled;
    for (const key of PRAYER_NOTIFICATION_KEYS) {
      const delivery = mapAlertStyleToDelivery(prefs.alertStyleByPrayer[key]);
      const voice = prefs.voiceIdByPrayer[key];
      adhan.prayers[key] = {
        ...adhan.prayers[key],
        enabled: prefs.prayers[key],
        deliveryMode: delivery || adhan.prayers[key].deliveryMode || "",
        muezzinId: voice || adhan.prayers[key].muezzinId || adhan.defaultMuezzinId,
      };
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
