import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { applyFontPreference, readFontPreference } from "./lib/font-preference";
import { readThemePreference, resolveTheme } from "./lib/theme-preference";
import { initClientErrorReporting } from "./lib/error-report";
import { resetMobileNavBodyLock } from "./lib/mobile-nav-body-lock";
import { bootstrapSupabaseFromServer, resetSupabaseClient } from "./lib/supabase-bootstrap";
import { createAppQueryClient } from "./lib/query-client";
import { PERF_SLOW_MS } from "./lib/performance-monitor";
import { registerProductionServiceWorker } from "./lib/service-worker";
import { setupStatusBar, setupKeyboard, isAndroid, isIOS, isNative } from "./lib/capacitor-utils";
import { purgeNativeWebRuntimeCaches } from "./lib/native-cache-freshness";
import { initFinalPolish } from "./lib/init-final-polish";
import { prewarmAudioCdns, prewarmTextApis, prewarmSupabaseOrigin } from "./lib/resource-prewarm";
import { refreshQuranAudioRemoteConfig } from "./lib/quran-audio-remote-config";
import { armSplashAutoHide } from "./lib/splash-screen";
import { prefetchTopRoutesOnIdle } from "./lib/prefetch-top-routes";
// هوية identity-v2 — الرموز أولاً (@theme + --mj-*) قبل أي طبقة قديمة
import "./app/styles/theme.css";
import "./styles/components/page-hero.css";
import "./styles/components/hub-card.css";
// Majlisilm 2030 + طبقات الأساس (تُبقى كما هي — لا حذف في هذا الـPR)
import "./styles/brand-v4.css";
import "./index.css";
import "./styles/design-system.css";
import "./styles/final-release.css";
import "./styles/brand-v4-components.css";
import "./styles/brand-v4-contrast-fixes.css";
import "./styles/a11y-release-gate.css";
import "./styles/capacitor-native-ux.css";
import "./styles/m2030/foundation.css";
import "./styles/m2030/navigation.css";
import "./styles/m2030/pages.css";
import "./styles/m2030/interactions.css";
// جسر aliases: يوجّه --brand/--em-* /shadcn إلى لوحة --mj-* (آخر شيء)
import "./styles/theme-aliases.css";
import "./styles/ios-edge.css";

if (isNative) {
  document.documentElement.classList.add("capacitor-native");
  document.documentElement.dataset.platform = isAndroid ? "android" : isIOS ? "ios" : "native";
}

const queryClient = createAppQueryClient();

resetMobileNavBodyLock();
applyFontPreference(readFontPreference());
initClientErrorReporting();
initFinalPolish();
// Idle preconnect for audio/text CDNs — LCP/INP handshake savings without blocking mount.
if (typeof requestIdleCallback === "function") {
  requestIdleCallback(() => {
    prewarmAudioCdns();
    prewarmTextApis();
    prewarmSupabaseOrigin();
    void refreshQuranAudioRemoteConfig();
  }, { timeout: 3_000 });
} else {
  setTimeout(() => {
    prewarmAudioCdns();
    prewarmTextApis();
    prewarmSupabaseOrigin();
    void refreshQuranAudioRemoteConfig();
  }, 1);
}

prefetchTopRoutesOnIdle();

async function mount() {
  const started = performance.now();

  // داخل Capacitor: ألغِ SW/CacheStorage القديمة قبل أول رسم حتى لا تُخدم أصول عتيقة.
  await purgeNativeWebRuntimeCaches();

  // Render immediately — do not block the shell on Supabase bootstrap.
  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>,
  );

  // أخفِ شاشة الدخول عند أول عرض ناجح للمسار (سقف 2.5s)
  armSplashAutoHide();

  void bootstrapSupabaseFromServer()
    .then(() => resetSupabaseClient())
    .catch(() => {});

  const renderMs = Math.round(performance.now() - started);
  if (renderMs > PERF_SLOW_MS) {
    console.warn(`[perf:slow] render "app-mount" ${renderMs}ms`);
  }

  // بعد استقرار الإقلاع (لا خطأ chunk خلال 8 ثوانٍ)، يُحرَّر حارس إعادة
  // التحميل لخطأ chunk في ErrorBoundary.tsx — فيبقى خطأ chunk لاحق (نشر
  // جديد بعد ساعات مثلاً بينما التبويب مفتوح) قادرًا على إعادة تحميل
  // تلقائية واحدة أيضًا، لا محظورًا للأبد لبقية عمر التبويب.
  setTimeout(() => {
    void import("@/lib/lazy-with-retry").then(({ clearChunkReloadGuard }) => {
      clearChunkReloadGuard();
    }).catch(() => {
      try {
        sessionStorage.removeItem("majalis-chunk-reload");
        sessionStorage.removeItem("mj-chunk-reload-attempted");
      } catch { /* تجاهل */ }
    });
  }, 8000);
}

void mount();

// داخل تطبيق Capacitor الأصلي نمنع تسجيل SW تمامًا لتفادي أي بقايا كاش
// من جلسات سابقة داخل WebView؛ تحديث iOS يعتمد على ملفات cap sync فقط.
if (!isNative) {
  registerProductionServiceWorker();
}

// إعداد Capacitor Native (يُهمَل تلقائياً على الويب) — بلون/نمط الوضع الفعلي
// عند الإقلاع، لا قيمة ثابتة (ThemePreferenceProvider يُعيد المزامنة عند أي تبديل لاحق).
void setupStatusBar(resolveTheme(readThemePreference()));
void setupKeyboard();

// معالجة زر الرجوع في Android
if (isAndroid) {
  import("@capacitor/app").then(({ App: CapApp }) => {
    CapApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        // في الصفحة الرئيسية — اعرض تأكيد الخروج
        const confirmExit = window.confirm("هل تريد الخروج من التطبيق؟");
        if (confirmExit) CapApp.exitApp();
      }
    });
  }).catch(() => {});
}

/**
 * روابط عميقة (Universal Links على iOS، عبر majlisilm.com/apple-app-site-association
 * + com.apple.developer.associated-domains في App.entitlements) — تفتح
 * التطبيق مباشرة على المسار المطلوب بدل متصفح خارجي. نستخدم pushState +
 * حدث popstate صناعي بدل window.location.href كي يلتقطه المُوجِّه
 * (wouter يستمع لـpopstate) بلا إعادة تحميل كاملة للـWebView، التي قد لا
 * تُصيَّر المسار بشكل صحيح خارج تحميل index.html الأول.
 */
if (isNative) {
  import("@capacitor/app").then(({ App: CapApp }) => {
    CapApp.addListener("appUrlOpen", ({ url }) => {
      void import("@/lib/native-deep-link").then(({ resolveNativeDeepLinkPath, shouldNavigateNativeDeepLink }) => {
        const path = resolveNativeDeepLinkPath(url);
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (shouldNavigateNativeDeepLink(current, path) && path) {
          // path is always same-origin relative — never pushState a www absolute URL
          if (path.startsWith("/") && !path.startsWith("//")) {
            window.history.pushState({}, "", path);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }
        }
      });
    });
  }).catch(() => {});
}
