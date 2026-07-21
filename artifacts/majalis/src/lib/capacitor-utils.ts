import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === "android";
export const isIOS = Capacitor.getPlatform() === "ios";

/**
 * تُطابق شريط الحالة الأصلي (iOS/Android) مع الوضع الفعلي المطبَّق على الهيدر
 * (navbar-v3): فاتح تقريبًا أبيض في الوضع النهاري، أخضر داكن قريب من الأسود
 * في الوضع الليلي (القيم مطابقة لـ html[data-theme="dark"] .navbar-v3 في
 * elite-2026.css). قبل هذا التصحيح كانت القيمة مثبَّتة دومًا على أيقونات فاتحة
 * فوق خلفية داكنة — ما يجعلها غير مرئية عمليًا فوق الهيدر شبه الأبيض في الوضع
 * النهاري (2026-07-18).
 */
export async function setupStatusBar(theme: "light" | "dark" = "dark") {
  if (!isNative) return;
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  // الأهم أولاً (يعمل على iOS وAndroid): ضبط لون الأيقونات وإظهار الشريط.
  try {
    await StatusBar.setStyle({ style: theme === "dark" ? Style.Light : Style.Dark });
    await StatusBar.show();
  } catch { /* منصّة لا تدعم التحكم بشريط الحالة — تجاهل بأمان */ }
  // لون الخلفية: غير مُنفَّذ على iOS في بعض الإصدارات (يرمي استثناءً) — مُعزول
  // في try مستقل كي لا يمنع الخطوة الأهم أعلاه.
  try {
    await StatusBar.setBackgroundColor({ color: theme === "dark" ? "#0D1A14" : "#FFFFFF" });
  } catch { /* iOS: لا وظيفة setBackgroundColor أصلاً — متوقَّع، تجاهل بأمان */ }
}

export async function setupKeyboard() {
  if (!isNative) return;
  const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
  await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
}

export async function openExternalUrl(url: string) {
  if (!isNative) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url, presentationStyle: "popover" });
}

/**
 * ردود فعل لمسية (haptics): تطبيق iOS/Android الأصلي عبر Capacitor
 * Haptics (أدق: أنماط ضغط/إشعار حقيقية)، وعلى الويب عبر Vibration API
 * القياسية (navigator.vibrate) كبديل حقيقي لا تجاهل صامت — يعمل فعليًا
 * على Chrome/Android (لا يدعمه Safari/iOS Safari إطلاقًا، قيد منصّة لا
 * يمكن تجاوزه). تُستخدم لتأكيد تفاعلات قصيرة ومتكررة (عدّاد التسبيح،
 * إجابة سؤال، خطأ مؤكَّد في اختبار التسميع) بدل المؤثرات البصرية وحدها.
 */
const WEB_VIBRATE_MS: Record<"light" | "medium" | "heavy", number> = { light: 15, medium: 35, heavy: 60 };
const WEB_VIBRATE_PATTERN: Record<"success" | "warning" | "error", number[]> = {
  success: [20],
  warning: [25, 40, 25],
  error: [40, 60, 40],
};

export async function hapticTap(style: "light" | "medium" | "heavy" = "light") {
  if (!isNative) {
    try { navigator.vibrate?.(WEB_VIBRATE_MS[style]); } catch { /* متصفح لا يدعم Vibration API — تجاهل بأمان */ }
    return;
  }
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  } catch { /* منصّة لا تدعم الاهتزاز — تجاهل بأمان */ }
}

export async function hapticNotify(type: "success" | "warning" | "error") {
  if (!isNative) {
    try { navigator.vibrate?.(WEB_VIBRATE_PATTERN[type]); } catch { /* تجاهل بأمان */ }
    return;
  }
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    const map = { success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error };
    await Haptics.notification({ type: map[type] });
  } catch { /* تجاهل بأمان */ }
}
