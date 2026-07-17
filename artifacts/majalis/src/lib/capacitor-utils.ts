import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === "android";
export const isIOS = Capacitor.getPlatform() === "ios";

export async function setupStatusBar() {
  if (!isNative) return;
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: "#153025" });
  await StatusBar.show();
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
 * ردود فعل لمسية (haptics) لتطبيق iOS/Android الأصلي فقط — بلا تأثير على
 * نسخة الويب. تُستخدم لتأكيد تفاعلات قصيرة ومتكررة (عدّاد التسبيح، إجابة
 * سؤال) بدل الاعتماد على المؤثرات البصرية وحدها.
 */
export async function hapticTap(style: "light" | "medium" | "heavy" = "light") {
  if (!isNative) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  } catch { /* منصّة لا تدعم الاهتزاز — تجاهل بأمان */ }
}

export async function hapticNotify(type: "success" | "warning" | "error") {
  if (!isNative) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    const map = { success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error };
    await Haptics.notification({ type: map[type] });
  } catch { /* تجاهل بأمان */ }
}
