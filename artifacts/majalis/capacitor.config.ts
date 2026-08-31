import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yousef.majlisilm",
  appName: "سُنّة",
  // مخرجات `vite build` — لا تستخدم public/ (أصول المصدر فقط).
  webDir: "dist",
  server: {
    // Production: حمّل الـ canonical الحي مباشرة — بلا majlisilm.com (308)
    // وبلا apex ssunnah.com (308). AASA يستثني `/` لمنع ارتداد Safari↔التطبيق.
    url: "https://www.ssunnah.com",
    errorPath: "native-load-error.html",
    allowNavigation: [
      "www.ssunnah.com",
      "ssunnah.com",
      "majlisilm.com",
      "www.majlisilm.com",
    ],
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
