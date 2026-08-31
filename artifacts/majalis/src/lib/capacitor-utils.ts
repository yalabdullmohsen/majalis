/**
 * أدوات Capacitor — StatusBar يُدار مركزياً عبر apply-page-chrome (overlay + لون الصفحة).
 * setupStatusBar يبقى للتوافق (إقلاع / استعادة بعد immersive) ويعيد مزامنة chrome الحالي.
 */
import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();
/** اسم صريح لواجهة التطبيق — مطابق لـ Capacitor.isNativePlatform() */
export const isNativeApp = isNative;
export const isAndroid = Capacitor.getPlatform() === "android";
export const isIOS = Capacitor.getPlatform() === "ios";

/** ألوان سطح افتراضية — تطابق theme-color / --mj-bg */
export const STATUS_BAR_BG_LIGHT = "#F2F4F3";
export const STATUS_BAR_BG_DARK = "#101614";

/**
 * @deprecated تفضيل applyPageChrome / reapplyPageChromeFromLocation.
 * يُبقي الاستدعاءات القديمة تعمل عبر إعادة مزامنة chrome حسب المسار والوضع.
 */
export async function setupStatusBar(theme: "light" | "dark" = "dark") {
  const { reapplyPageChromeFromLocation, bootstrapStatusBarOverlay } = await import(
    "@/lib/apply-page-chrome"
  );
  await bootstrapStatusBarOverlay();
  await reapplyPageChromeFromLocation(theme);
}

export async function setupKeyboard() {
  if (!isNative) return;
  const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
  await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
}

const OWN_HOSTS = new Set([
  "www.ssunnah.com",
  "ssunnah.com",
  "majlisilm.com",
  "www.majlisilm.com",
  "localhost",
  "127.0.0.1",
]);

function isOwnHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  return OWN_HOSTS.has(h) || h.endsWith(".ssunnah.com") || h.endsWith(".majlisilm.com");
}

/** روابط علامتنا تُفتح داخل التطبيق — لا Safari (يمنع ارتداد Universal Links). */
function navigateOwnUrlInApp(url: string): boolean {
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.href : "https://www.ssunnah.com");
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (!isOwnHost(u.hostname)) return false;
    const path = `${u.pathname}${u.search}${u.hash}` || "/";
    if (!path.startsWith("/") || path.startsWith("//")) return false;
    if (typeof window === "undefined") return false;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (current !== path) {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
    return true;
  } catch {
    return false;
  }
}

export async function openExternalUrl(
  url: string,
  opts?: { confirmLeave?: boolean },
) {
  if (navigateOwnUrlInApp(url)) return;
  if (!isNative) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  if (opts?.confirmLeave) {
    const ok = window.confirm("سيُفتح رابط خارج التطبيق. المتابعة؟");
    if (!ok) return;
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
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    try {
      navigator.vibrate(WEB_VIBRATE_MS[style]);
    } catch {
      /* تجاهل — أجهزة بلا دعم أو سياسة المتصفح */
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
    /* تجاهل — إضافة غير متاحة أو جهاز بلا محرك لمسي */
  }
}

export async function hapticNotify(type: "success" | "warning" | "error") {
  if (!isNative) {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    try {
      navigator.vibrate(WEB_VIBRATE_PATTERN[type]);
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
