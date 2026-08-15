/**
 * أصوات إشعارات الصلاة لـ Capacitor Local Notifications (iOS/Android).
 *
 * iOS: ملفات .caf في artifacts/majalis/ios/App/App/Sounds/ (Copy Bundle Resources).
 * Android: ملفات في artifacts/majalis/android/app/src/main/res/raw/ (الاسم بلا امتداد عند الإسناد).
 *
 * صوت الإشعار محدود ≈٣٠ث على iOS — هذه الملفات قصيرة (~٧–٨ث).
 * الأذان الكامل داخل التطبيق عبر HTMLAudio + ملفات /sounds/adhan/*.mp3.
 */
import { Capacitor } from "@capacitor/core";
import { DEFAULT_ALERT_SOUND } from "@/lib/notifications/channels";

/** أصوات إضافية للمعاينة/التعيين حسب نمط الأذان (إشعار قصير). */
export const PRAYER_ADHAN_STYLE_SOUNDS = {
  makkah: "adhan-short-makkah.caf",
  madinah: "adhan-short-madinah.caf",
  egypt: "adhan-short-egypt.caf",
  aqsa: "adhan-short-aqsa.caf",
  turkey: "adhan-short-makkah.caf",
  kuwait: "adhan-short-makkah.caf",
  takbeerat: "adhan-short-takbeerat.caf",
  default: "adhan-short-makkah.caf",
  /** توافق أسماء الحزمة القديمة */
  prayer_makkah: "prayer_makkah.caf",
} as const;

export const PRAYER_SOUND_FILES = {
  quiet: "adhan-short-takbeerat.caf",
  clear: "adhan-short-makkah.caf",
  soft: "adhan-short-madinah.caf",
} as const;

export type PrayerSoundRole = keyof typeof PRAYER_SOUND_FILES;

/**
 * ملف تعريف اختيار المستخدم:
 * - auto: حسب نوع الإشعار (هادئ قبل / أوضح عند الدخول / خفيف للتذكير)
 * - quiet | clear | soft: فرض صوت واحد لكل الإشعارات
 * - system: صوت النظام دائمًا
 */
export type PrayerSoundProfile = "auto" | PrayerSoundRole | "system";

export const PRAYER_SOUND_PROFILE_OPTIONS: Array<{
  id: PrayerSoundProfile;
  label: string;
  hint: string;
}> = [
  { id: "auto", label: "تلقائي", hint: "هادئ قبل الصلاة، أوضح عند الدخول، خفيف للتذكير" },
  { id: "quiet", label: "هادئ / تنبيه قصير", hint: "تكبيرات قصيرة للتنبيه المسبق" },
  { id: "clear", label: "أذان واضح (قصير)", hint: "مقطع قصير من نمط مكة لدخول الوقت" },
  { id: "soft", label: "خفيف / مدني", hint: "مقطع لطيف للتذكير بعد الصلاة" },
  { id: "system", label: "صوت النظام", hint: "الصوت الافتراضي للجهاز" },
];

/**
 * مفعّل بعد تضمين ملفات .caf في iOS و .mp3 في Android raw.
 * عند التعطيل: resolve يعيد دائمًا DEFAULT_ALERT_SOUND.
 */
export const PRAYER_CUSTOM_SOUNDS_ENABLED = true;

export function soundRoleForNotifKind(
  kind: "pre" | "enter" | "post",
): PrayerSoundRole {
  if (kind === "enter") return "clear";
  if (kind === "post") return "soft";
  return "quiet";
}

/** اسم الصوت المناسب للمنصّة (iOS: مع .caf — Android: بلا امتداد). */
export function platformNotificationSoundName(iosFileWithExt: string): string {
  try {
    if (Capacitor.getPlatform() === "android") {
      return iosFileWithExt.replace(/\.(caf|wav|aiff|mp3)$/i, "");
    }
  } catch {
    /* web / tests */
  }
  return iosFileWithExt;
}

/**
 * يحل اسم ملف الصوت لـ LocalNotifications.sound مع fallback آمن إلى default.
 */
export function resolvePrayerNotificationSound(
  role: PrayerSoundRole,
  profile: PrayerSoundProfile = "auto",
): string {
  try {
    if (profile === "system" || !PRAYER_CUSTOM_SOUNDS_ENABLED) {
      return DEFAULT_ALERT_SOUND;
    }
    const effective: PrayerSoundRole =
      profile === "auto" ? role : (profile as PrayerSoundRole);
    const file = PRAYER_SOUND_FILES[effective];
    if (!file) return DEFAULT_ALERT_SOUND;
    return platformNotificationSoundName(file);
  } catch {
    return DEFAULT_ALERT_SOUND;
  }
}

/** صوت إشعار قصير حسب معرّف تسجيل الأذان (fallback لـ clear). */
export function resolveAdhanStyleNotificationSound(recordingId: string): string {
  if (!PRAYER_CUSTOM_SOUNDS_ENABLED) return DEFAULT_ALERT_SOUND;
  const key = recordingId as keyof typeof PRAYER_ADHAN_STYLE_SOUNDS;
  const file =
    PRAYER_ADHAN_STYLE_SOUNDS[key] ?? PRAYER_ADHAN_STYLE_SOUNDS.default;
  return platformNotificationSoundName(file);
}
