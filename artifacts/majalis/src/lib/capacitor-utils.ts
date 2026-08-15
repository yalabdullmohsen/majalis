/**
 * تُطابق شريط الحالة الأصلي (iOS/Android) مع الوضع الفعلي.
 * overlaysWebView=false: الـWebView تحت الشريط — لا نكرّر inset-top في CSS.
 */
import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === "android";
export const isIOS = Capacitor.getPlatform() === "ios";

/** ألوان سطح التطبيق — تطابق theme-color / --mj-bg */
export const STATUS_BAR_BG_LIGHT = "#F2F4F3";
export const STATUS_BAR_BG_DARK = "#101614";

export async function setupStatusBar(theme: "light" | "dark" = "dark") {
  if (!isNative) return;
  const { StatusBar, Style } = await import("@capacitor/status-bar");

  // استقرار: لا رسم تحت الساعة/البطارية — الـCSS لا يضيف inset-top على Capacitor
  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    /* منصّات قديمة — تجاهل */
  }

  try {
    // Dark style = أيقونات داكنة (نهاري) · Light style = أيقونات فاتحة (ليلي)
    await StatusBar.setStyle({ style: theme === "dark" ? Style.Light : Style.Dark });
    await StatusBar.show();
  } catch {
    /* تجاهل */
  }

  try {
    await StatusBar.setBackgroundColor({
      color: theme === "dark" ? STATUS_BAR_BG_DARK : STATUS_BAR_BG_LIGHT,
    });
  } catch {
    /* iOS قد لا يدعم setBackgroundColor — متوقَّع */
  }
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
 * Haptics، وعلى الويب عبر Vibration API.
 */
const WEB_VIBRATE_MS: Record<"light" | "medium" | "heavy", number> = {
  light: 15,
  medium: 35,
  heavy: 60,
};
const WEB_VIBRATE_PATTERN: Record<"success" | "warning" | "error", number[]> = {
  success: [20],
  warning: [25, 40, 25],
  error: [40, 60, 40],
};

export async function hapticTap(style: "light" | "medium" | "heavy" = "light") {
  if (!isNative) {
    try {
      navigator.vibrate?.(WEB_VIBRATE_MS[style]);
    } catch {
      /* تجاهل */
    }
    return;
  }
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: map[style] });
  } catch {
    /* تجاهل */
  }
}

export async function hapticNotify(type: "success" | "warning" | "error") {
  if (!isNative) {
    try {
      navigator.vibrate?.(WEB_VIBRATE_PATTERN[type]);
    } catch {
      /* تجاهل */
    }
    return;
  }
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    const map = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };
    await Haptics.notification({ type: map[type] });
  } catch {
    /* تجاهل */
  }
}
