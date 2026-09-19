/**
 * عقد أصوات تنبيهات الصلاة — مصدر حقيقة واحد لـ Native Notification Sound.
 *
 * فئات:
 * - SYSTEM_DEFAULT: صوت إشعار النظام (لا ملف مخصص).
 * - CUSTOM_NOTIFICATION_SOUND: ملف قصير في App Bundle لإشعار الخلفية.
 * - SILENT: إشعار بلا صوت.
 * - IN_APP_ADHAN: تشغيل داخل التطبيق فقط — ليس صوت إشعار خلفية.
 * - EARLY_REMINDER: تنبيه ما قبل الصلاة (قصير منفصل).
 *
 * السبب الجذري (PR-1): كتالوج الإعدادات يعلن `iosNotificationSound` لكن المجدول
 * كان يحل الصوت عبر muezzinId/profile فقط ويتجاهل الاختيار الفعلي؛ والمعاينة
 * تشغّل ملف ويب مختلفًا عن CAF الإشعار.
 */
import { DEFAULT_ALERT_SOUND } from "@/lib/notifications/channels";

export type PrayerSoundCategory =
  | "SYSTEM_DEFAULT"
  | "CUSTOM_NOTIFICATION_SOUND"
  | "SILENT"
  | "IN_APP_ADHAN"
  | "EARLY_REMINDER";

export type PrayerSoundManifestEntry = {
  id: string;
  labelAr: string;
  category: PrayerSoundCategory;
  /** اسم الملف داخل Bundle فقط (مثل prayer-alert.caf) — بلا مسار */
  nativeFileName: string | null;
  /** مسار معاينة ويب تحت /public — قد يختلف عن native */
  webPreviewPath: string | null;
  /** مدة معلنة بالثواني (يجب ≤ 30 لإشعار iOS) */
  durationSec: number | null;
  supportedPlatforms: ReadonlyArray<"ios" | "android" | "web">;
  licenseStatus: "approved" | "blocked" | "n/a";
  appStoreSafe: boolean;
  notificationCompatible: boolean;
  enabled: boolean;
  /** معرّف حزمة المؤذن إن وُجد */
  muezzinId?: string;
  blockReason?: string;
};

/** حد iOS التقريبي لصوت الإشعار المخصص. */
export const IOS_NOTIFICATION_SOUND_MAX_SEC = 30;

/**
 * Manifest موحّد — فقط ما يُسمح بعرضه/تمريره لـ Native بعد التحقق.
 * IN_APP_ADHAN: notificationCompatible=false دائمًا.
 */
export const PRAYER_SOUND_MANIFEST: readonly PrayerSoundManifestEntry[] = [
  {
    id: "system-default",
    labelAr: "صوت النظام",
    category: "SYSTEM_DEFAULT",
    nativeFileName: null,
    webPreviewPath: null,
    durationSec: null,
    supportedPlatforms: ["ios", "android", "web"],
    licenseStatus: "n/a",
    appStoreSafe: true,
    notificationCompatible: true,
    enabled: true,
  },
  {
    id: "silent",
    labelAr: "صامت",
    category: "SILENT",
    nativeFileName: null,
    webPreviewPath: null,
    durationSec: null,
    supportedPlatforms: ["ios", "android", "web"],
    licenseStatus: "n/a",
    appStoreSafe: true,
    notificationCompatible: true,
    enabled: true,
  },
  {
    id: "tone-prayer",
    labelAr: "تنبيه صلاة واضح",
    category: "CUSTOM_NOTIFICATION_SOUND",
    nativeFileName: "prayer-alert.caf",
    webPreviewPath: "/audio/adhan/prayer-alert.mp3",
    durationSec: 3,
    supportedPlatforms: ["ios", "android"],
    licenseStatus: "approved",
    appStoreSafe: true,
    notificationCompatible: true,
    enabled: true,
  },
  {
    id: "tone-soft",
    labelAr: "رنة هادئة",
    category: "CUSTOM_NOTIFICATION_SOUND",
    nativeFileName: "soft-ring.caf",
    webPreviewPath: "/audio/adhan/soft-ring.mp3",
    durationSec: 2,
    supportedPlatforms: ["ios", "android"],
    licenseStatus: "approved",
    appStoreSafe: true,
    notificationCompatible: true,
    enabled: true,
  },
  {
    id: "tone-short",
    labelAr: "رنة قصيرة",
    category: "CUSTOM_NOTIFICATION_SOUND",
    nativeFileName: "short-ring.caf",
    webPreviewPath: "/audio/adhan/short-ring.mp3",
    durationSec: 2,
    supportedPlatforms: ["ios", "android"],
    licenseStatus: "approved",
    appStoreSafe: true,
    notificationCompatible: true,
    enabled: true,
  },
  {
    id: "tone-alarm",
    labelAr: "منبّه واضح",
    category: "CUSTOM_NOTIFICATION_SOUND",
    nativeFileName: "alarm-clear.caf",
    webPreviewPath: "/audio/adhan/alarm-clear.mp3",
    durationSec: 3,
    supportedPlatforms: ["ios", "android"],
    licenseStatus: "approved",
    appStoreSafe: true,
    notificationCompatible: true,
    enabled: true,
  },
  {
    id: "notif-makkah-short",
    labelAr: "تنبيه أذان قصير (مكة)",
    category: "CUSTOM_NOTIFICATION_SOUND",
    nativeFileName: "adhan-short-makkah.caf",
    webPreviewPath: "/audio/adhan/adhan-makkah.mp3",
    durationSec: 8,
    supportedPlatforms: ["ios", "android"],
    licenseStatus: "approved",
    appStoreSafe: true,
    notificationCompatible: true,
    enabled: true,
    muezzinId: "makkah",
  },
  {
    id: "notif-egypt-short",
    labelAr: "تنبيه أذان قصير (تقليدي)",
    category: "CUSTOM_NOTIFICATION_SOUND",
    nativeFileName: "adhan-short-egypt.caf",
    webPreviewPath: "/audio/adhan/adhan-egypt-full.m4a",
    durationSec: 8,
    supportedPlatforms: ["ios", "android"],
    licenseStatus: "approved",
    appStoreSafe: true,
    notificationCompatible: true,
    enabled: true,
    muezzinId: "egypt",
  },
  {
    id: "notif-aqsa-short",
    labelAr: "تنبيه أذان قصير (الأقصى)",
    category: "CUSTOM_NOTIFICATION_SOUND",
    nativeFileName: "adhan-short-aqsa.caf",
    webPreviewPath: "/audio/adhan/adhan-aqsa-full.mp3",
    durationSec: 8,
    supportedPlatforms: ["ios", "android"],
    licenseStatus: "approved",
    appStoreSafe: true,
    notificationCompatible: true,
    enabled: true,
    muezzinId: "aqsa",
  },
  {
    id: "notif-takbeerat-short",
    labelAr: "تكبيرات قصيرة",
    category: "CUSTOM_NOTIFICATION_SOUND",
    nativeFileName: "adhan-short-takbeerat.caf",
    webPreviewPath: "/audio/adhan/adhan-takbeerat-short.mp3",
    durationSec: 5,
    supportedPlatforms: ["ios", "android"],
    licenseStatus: "approved",
    appStoreSafe: true,
    notificationCompatible: true,
    enabled: true,
    muezzinId: "takbeerat",
  },
  {
    id: "notif-kuwait-short",
    labelAr: "تنبيه أذان خليجي قصير",
    category: "CUSTOM_NOTIFICATION_SOUND",
    nativeFileName: "short-ring.caf",
    webPreviewPath: "/audio/adhan/adhan-gulf-short.mp3",
    durationSec: 2,
    supportedPlatforms: ["ios", "android"],
    licenseStatus: "approved",
    appStoreSafe: true,
    notificationCompatible: true,
    enabled: true,
    muezzinId: "kuwait",
  },
  {
    id: "early-quiet",
    labelAr: "تنبيه ما قبل الصلاة",
    category: "EARLY_REMINDER",
    nativeFileName: "soft-ring.caf",
    webPreviewPath: "/audio/adhan/soft-ring.mp3",
    durationSec: 2,
    supportedPlatforms: ["ios", "android"],
    licenseStatus: "approved",
    appStoreSafe: true,
    notificationCompatible: true,
    enabled: true,
  },
  // —— داخل التطبيق فقط (لا يُمرَّر كـ sound لإشعار الخلفية) ——
  {
    id: "in-app-makkah",
    labelAr: "أذان مكة (داخل التطبيق)",
    category: "IN_APP_ADHAN",
    nativeFileName: null,
    webPreviewPath: "/audio/adhan/adhan-makkah.mp3",
    durationSec: null,
    supportedPlatforms: ["web", "ios", "android"],
    licenseStatus: "approved",
    appStoreSafe: true,
    notificationCompatible: false,
    enabled: true,
    muezzinId: "makkah",
    blockReason: "يعمل عند فتح سُنّة فقط — ليس صوت إشعار خلفية",
  },
  {
    id: "in-app-egypt",
    labelAr: "أذان تقليدي (داخل التطبيق)",
    category: "IN_APP_ADHAN",
    nativeFileName: null,
    webPreviewPath: "/audio/adhan/adhan-egypt-full.m4a",
    durationSec: null,
    supportedPlatforms: ["web", "ios", "android"],
    licenseStatus: "approved",
    appStoreSafe: true,
    notificationCompatible: false,
    enabled: true,
    muezzinId: "egypt",
    blockReason: "يعمل عند فتح سُنّة فقط — ليس صوت إشعار خلفية",
  },
  {
    id: "in-app-aqsa",
    labelAr: "أذان الأقصى (داخل التطبيق)",
    category: "IN_APP_ADHAN",
    nativeFileName: null,
    webPreviewPath: "/audio/adhan/adhan-aqsa-full.mp3",
    durationSec: null,
    supportedPlatforms: ["web", "ios", "android"],
    licenseStatus: "approved",
    appStoreSafe: true,
    notificationCompatible: false,
    enabled: true,
    muezzinId: "aqsa",
    blockReason: "يعمل عند فتح سُنّة فقط — ليس صوت إشعار خلفية",
  },
  // —— محجوب ——
  {
    id: "blocked-qatami",
    labelAr: "أذان القطامي",
    category: "IN_APP_ADHAN",
    nativeFileName: null,
    webPreviewPath: null,
    durationSec: null,
    supportedPlatforms: ["web"],
    licenseStatus: "blocked",
    appStoreSafe: false,
    notificationCompatible: false,
    enabled: false,
    muezzinId: "qatami",
    blockReason: "خطر اسم مشهور / حقوق غير مثبتة للإنتاج",
  },
] as const;

export type ResolveNativeSoundResult = {
  sound: string;
  manifestId: string;
  category: PrayerSoundCategory;
  fallbackUsed: boolean;
  fallbackReason?: string;
};

function isBareNativeFilename(name: string): boolean {
  return Boolean(name) && !name.includes("/") && !name.includes("\\") && /\.(caf|wav|aiff|mp3)$/i.test(name);
}

export function getManifestEntry(id: string): PrayerSoundManifestEntry | undefined {
  return PRAYER_SOUND_MANIFEST.find((e) => e.id === id);
}

export function listEnabledNotificationSounds(): PrayerSoundManifestEntry[] {
  return PRAYER_SOUND_MANIFEST.filter(
    (e) =>
      e.enabled &&
      e.notificationCompatible &&
      e.appStoreSafe &&
      e.licenseStatus !== "blocked",
  );
}

export function listBlockedManifestEntries(): PrayerSoundManifestEntry[] {
  return PRAYER_SOUND_MANIFEST.filter((e) => !e.enabled || e.licenseStatus === "blocked");
}

/** ربط muezzinId → أفضل صوت إشعار مخصص معتمد (يفضّل notif-* على النغمات العامة). */
export function findNotificationSoundForMuezzin(muezzinId: string): PrayerSoundManifestEntry | undefined {
  const matches = listEnabledNotificationSounds().filter(
    (e) =>
      e.muezzinId === muezzinId &&
      e.category === "CUSTOM_NOTIFICATION_SOUND" &&
      e.nativeFileName,
  );
  return matches.find((e) => e.id.startsWith("notif-")) ?? matches[0];
}

/**
 * يحل اسم ملف Native من معرّف Manifest أو muezzin أو اسم CAF خام.
 * عند الفشل → SYSTEM_DEFAULT (`default`) مع تسجيل السبب.
 */
export function resolveNativeNotificationSound(opts: {
  manifestId?: string | null;
  muezzinId?: string | null;
  nativeFileName?: string | null;
  preferSilent?: boolean;
}): ResolveNativeSoundResult {
  if (opts.preferSilent) {
    return {
      sound: DEFAULT_ALERT_SOUND,
      manifestId: "silent",
      category: "SILENT",
      fallbackUsed: true,
      fallbackReason: "silent_requested",
    };
  }

  if (opts.manifestId) {
    const entry = getManifestEntry(opts.manifestId);
    if (entry?.category === "SILENT") {
      return {
        sound: DEFAULT_ALERT_SOUND,
        manifestId: entry.id,
        category: "SILENT",
        fallbackUsed: false,
      };
    }
    if (entry?.category === "SYSTEM_DEFAULT") {
      return {
        sound: DEFAULT_ALERT_SOUND,
        manifestId: entry.id,
        category: "SYSTEM_DEFAULT",
        fallbackUsed: false,
      };
    }
    if (
      entry &&
      entry.enabled &&
      entry.notificationCompatible &&
      entry.appStoreSafe &&
      entry.nativeFileName &&
      isBareNativeFilename(entry.nativeFileName) &&
      (entry.durationSec == null || entry.durationSec <= IOS_NOTIFICATION_SOUND_MAX_SEC)
    ) {
      return {
        sound: entry.nativeFileName,
        manifestId: entry.id,
        category: entry.category,
        fallbackUsed: false,
      };
    }
    if (entry && !entry.notificationCompatible) {
      return {
        sound: DEFAULT_ALERT_SOUND,
        manifestId: "system-default",
        category: "SYSTEM_DEFAULT",
        fallbackUsed: true,
        fallbackReason: entry.blockReason ?? "in_app_adhan_not_notification",
      };
    }
  }

  if (opts.nativeFileName && isBareNativeFilename(opts.nativeFileName)) {
    const byFile = PRAYER_SOUND_MANIFEST.find(
      (e) =>
        e.nativeFileName === opts.nativeFileName &&
        e.enabled &&
        e.notificationCompatible &&
        e.appStoreSafe,
    );
    if (byFile) {
      return {
        sound: byFile.nativeFileName!,
        manifestId: byFile.id,
        category: byFile.category,
        fallbackUsed: false,
      };
    }
  }

  if (opts.muezzinId) {
    const byMuezzin = findNotificationSoundForMuezzin(opts.muezzinId);
    if (byMuezzin?.nativeFileName) {
      return {
        sound: byMuezzin.nativeFileName,
        manifestId: byMuezzin.id,
        category: byMuezzin.category,
        fallbackUsed: false,
      };
    }
  }

  return {
    sound: DEFAULT_ALERT_SOUND,
    manifestId: "system-default",
    category: "SYSTEM_DEFAULT",
    fallbackUsed: true,
    fallbackReason: "no_valid_custom_sound",
  };
}

/** تحقق ثابت للبوابات: تكرار IDs، مدة، أسماء ملفات. */
export function validateManifestIntegrity(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const e of PRAYER_SOUND_MANIFEST) {
    if (ids.has(e.id)) errors.push(`duplicate id: ${e.id}`);
    ids.add(e.id);
    if (e.notificationCompatible && e.category === "CUSTOM_NOTIFICATION_SOUND") {
      if (!e.nativeFileName || !isBareNativeFilename(e.nativeFileName)) {
        errors.push(`${e.id}: invalid nativeFileName`);
      }
      if (e.durationSec != null && e.durationSec > IOS_NOTIFICATION_SOUND_MAX_SEC) {
        errors.push(`${e.id}: duration ${e.durationSec}s > ${IOS_NOTIFICATION_SOUND_MAX_SEC}`);
      }
    }
    if (e.category === "IN_APP_ADHAN" && e.notificationCompatible) {
      errors.push(`${e.id}: IN_APP_ADHAN must not be notificationCompatible`);
    }
    if (e.licenseStatus === "blocked" && e.enabled) {
      errors.push(`${e.id}: blocked entry must be disabled`);
    }
  }
  return errors;
}
