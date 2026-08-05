/**
 * أصوات إشعارات الصلاة لـ Capacitor Local Notifications (iOS/Android).
 *
 * iOS: ضع ملفات .caf/.wav/.aiff في حزمة التطبيق:
 *   artifacts/majalis/ios/App/App/Sounds/
 *   ثم أضِفها إلى Xcode target (Copy Bundle Resources).
 * Android: ضع ملفات .wav/.mp3 (بدون امتداد في الاسم عند الإسناد) في:
 *   artifacts/majalis/android/app/src/main/res/raw/
 *
 * حتى تُضاف الملفات الفعلية يبقى PRAYER_CUSTOM_SOUNDS_ENABLED=false
 * فيُرجَع دائمًا صوت النظام الافتراضي دون كسر البناء أو الصمت غير المتوقع.
 */
import { DEFAULT_ALERT_SOUND } from "@/lib/notifications/channels";

/** أسماء الملفات المتوقعة في حزمة iOS (مع الامتداد كما يطلب Capacitor على iOS). */
export const PRAYER_SOUND_FILES = {
  quiet: "prayer_quiet.caf",
  clear: "prayer_clear.caf",
  soft: "prayer_soft.caf",
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
  { id: "quiet", label: "هادئ", hint: "مناسب للتنبيه المسبق" },
  { id: "clear", label: "واضح", hint: "مناسب لدخول الوقت" },
  { id: "soft", label: "خفيف", hint: "للتذكير اللطيف" },
  { id: "system", label: "صوت النظام", hint: "الصوت الافتراضي للجهاز" },
];

/**
 * فعّل بعد إضافة ملفات الأصوات إلى حزمة iOS/Android.
 * عند التعطيل: resolve يعيد دائمًا DEFAULT_ALERT_SOUND (آمن للبناء والتشغيل).
 */
export const PRAYER_CUSTOM_SOUNDS_ENABLED = false;

export function soundRoleForNotifKind(
  kind: "pre" | "enter" | "post",
): PrayerSoundRole {
  if (kind === "enter") return "clear";
  if (kind === "post") return "soft";
  return "quiet";
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
    return file || DEFAULT_ALERT_SOUND;
  } catch {
    return DEFAULT_ALERT_SOUND;
  }
}
