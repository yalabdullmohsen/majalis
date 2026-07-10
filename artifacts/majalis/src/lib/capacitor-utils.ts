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
