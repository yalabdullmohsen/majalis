import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yousef.majlisilm",
  appName: "المجلس العلمي",
  // مخرجات `vite build` — لا تستخدم public/ (أصول المصدر فقط).
  webDir: "dist",
  server: {
    // Canonical apex (www → majlisilm.com is a 308). Load apex directly so
    // WKWebView cold starts do not depend on a redirect before first paint.
    url: "https://majlisilm.com",
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      showSpinner: true,
      androidSpinnerStyle: "small",
      iosSpinnerStyle: "small",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ffffff",
      overlaysWebView: false,
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
    backgroundColor: "#ffffff",
    scrollEnabled: true,
  },
};

export default config;
