import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yousef.majlisilm",
  appName: "المجلس العلمي",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#153025",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      splashImmersive: true,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#153025",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
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
    backgroundColor: "#153025",
    scrollEnabled: true,
  },
};

export default config;
