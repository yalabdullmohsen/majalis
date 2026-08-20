import { Capacitor } from "@capacitor/core";
import { armIosBootHandoff, hideNativeLaunchScreen } from "./ios";

/** Android 12+: نفس تسلسل iOS ضمن قيود Theme.SplashScreen */
export function armAndroidBootHandoff(): void {
  if (!Capacitor.isNativePlatform()) return;
  armIosBootHandoff();
}

export function armNativeBootHandoff(): void {
  if (!Capacitor.isNativePlatform()) return;
  if (Capacitor.getPlatform() === "android") {
    armAndroidBootHandoff();
  } else {
    armIosBootHandoff();
  }
}

export { hideNativeLaunchScreen };
