import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yousef.majlisilm",
  appName: "سُنّة",
  // مخرجات `vite build` — لا تستخدم public/ (أصول المصدر فقط).
  webDir: "dist",
  server: {
    // الإنتاج الحي على www.ssunnah.com (200). majlisilm.com وssunnah.com
    // يحوّلان 308 إليه — تحميلهما في WKWebView يعلّق الإقلاع قبل أول رسم.
    url: "https://www.ssunnah.com",
    allowNavigation: [
      "www.ssunnah.com",
      "ssunnah.com",
      "majlisilm.com",
      "www.majlisilm.com",
    ],
    // صفحة محلية عند فشل تحميل الإنتاج — Capacitor iOS/Android errorPath
    errorPath: "native-load-error.html",
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      /* سطح الرئيسية — بلا خلفية خضراء قديمة ولا أيقونة دعائية */
      backgroundColor: "#F2F4F3",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      splashImmersive: true,
      splashFullScreen: true,
    },
    StatusBar: {
      // يمتد الـWebView تحت الساعة — لون المنطقة من CSS (--app-status-bg) حسب الصفحة
      overlaysWebView: true,
      style: "DARK",
      backgroundColor: "#F2F4F3",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      // iOS: badge + sound + banner + notification center (Capacitor 8.2+)
      presentationOptions: ["badge", "sound", "banner", "list"],
    },
    PushNotifications: {
      // Foreground presentation for remote pushes (APNs/FCM)
      presentationOptions: ["badge", "sound", "banner", "list"],
    },
  },
  android: {
    buildOptions: {
      keystorePath: "majalisilm-release.keystore",
      keystorePassword: "${KEYSTORE_PASSWORD}",
      keystoreAlias: "majalisilm",
      keystoreAliasPassword: "${KEYSTORE_ALIAS_PASSWORD}",
      releaseType: "APK",
    },
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    // Safe areas are owned by the shared CSS shell via env(safe-area-inset-*).
    // UIKit adjustment here would apply a second inset around the WKWebView.
    contentInset: "never",
    // سطح الرئيسية — يطابق أول إطار ويمنع وميض أخضر قديم
    backgroundColor: "#F2F4F3",
    scrollEnabled: true,
  },
};

export default config;
