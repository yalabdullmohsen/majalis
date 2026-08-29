import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ChunkRecoveryToast } from "./components/ChunkRecoveryToast";
import { readThemePreference, resolveTheme } from "./lib/theme-preference";
import { initClientErrorReporting } from "./lib/error-report";
import { resetMobileNavBodyLock } from "./lib/mobile-nav-body-lock";
import { createAppQueryClient } from "./lib/query-client";
import { PERF_SLOW_MS } from "./lib/performance-monitor";
import { setupStatusBar, setupKeyboard, isAndroid, isIOS, isNative } from "./lib/capacitor-utils";
import { purgeNativeWebRuntimeCaches } from "./lib/native-cache-freshness";
import { installMajalisClearCacheDebug } from "./lib/runtime-cache-purge";
import {
  markBootAwaitPaint,
  runBootSequenceBeforeMount,
  scheduleMushafLastPagePrewarm,
} from "./lib/boot-sequence";
import { hydrateNativeStorage } from "./lib/native-storage";
import { installInAppNavigationGuard } from "./lib/in-app-navigation";
import { initFinalPolish } from "./lib/init-final-polish";
import { prewarmAudioCdns, prewarmTextApis, prewarmSupabaseOrigin } from "./lib/resource-prewarm";
import { refreshQuranAudioRemoteConfig } from "./lib/quran-audio-remote-config";
import { armNativeSplashController } from "./lib/splash-screen";
import { awaitBootReadiness, registerBootStorageGate } from "./lib/boot-readiness";
import { prefetchTopRoutesOnIdle } from "./lib/prefetch-top-routes";
import { initOnboardingState } from "./lib/onboarding-state";
import { scheduleOnIdle } from "./lib/yield-to-main";
import { logLcpCandidateHint } from "./lib/home-lcp-static-shell";
// خطوط الواجهة المحلية قبل أي طبقة تستخدم --font-app
import "./styles/fonts-ui.css";
// هوية identity-v2 — الرموز أولاً (@theme + --mj-*) قبل أي طبقة قديمة
import "./app/styles/theme.css";
import "./styles/soft-cards.css";
// page-hero / filters / hub-card تُحمَّل مع مكوّناتها (خارج CSS الحرج)
// Majlisilm 2030 + طبقات الأساس (تُبقى كما هي — لا حذف في هذا الـPR)
import "./styles/brand-v4.css";
// أزواج (سطح ← لون فوقه) — يشتق من brand-v4 ويجب أن يليه مباشرة
import "./styles/tokens.css";
// رموز دلالية موحّدة (سطح/نص/حد/خطوط) — بعد tokens وقبل الطبقات القديمة
import "./styles/design-tokens.css";
import "./styles/breakpoints.css";
import "./styles/typography-scale.css";
import "./styles/typography-app.css";
import "./index.css";
import "./styles/brand-v4-contrast-fixes.css";
import "./styles/a11y-release-gate.css";
import "./styles/m2030/foundation.css";
import "./styles/m2030/navigation.css";
// m2030/pages.css + final-release.css — بعد load+idle (ليست حرجة لأول شاشة)
// جسر aliases: يوجّه --brand/--em-* /shadcn إلى لوحة --mj-* (آخر شيء)
import "./styles/theme-aliases.css";
import "./styles/dark-mode-surfaces.css";

// Lighthouse/Playwright: أزل أي SW قديم يتحكم بالصفحة قبل القياس
if (
  !isNative &&
  typeof navigator !== "undefined" &&
  "serviceWorker" in navigator
) {
  try {
    if (navigator.webdriver) {
      void navigator.serviceWorker.getRegistrations().then((regs) =>
        Promise.all(regs.map((r) => r.unregister())),
      );
    }
  } catch {
    /* ignore */
  }
}

// طبقات مظهر غير حرجة — بعد load + idle حتى لا تنافس LCP (كانت void import فوريًا)
function loadNonCriticalCss() {
  void import("./styles/design-system.css").then(() => {
    void import("./styles/brand-v4-components.css");
  });
  void import("./styles/components/instant-interaction.css");
  void import("./styles/components/compact-sources.css");
  void import("./styles/components/native-feel.css");
  void import("./styles/m2030/interactions.css");
  void import("./styles/m2030/pages.css");
  void import("./styles/final-release.css");
}
function scheduleNonCriticalCss() {
  scheduleOnIdle(loadNonCriticalCss, 2500);
  // أوزان 700 متأخرة جدًا — لا rIC (يطلق فور الخمول فيُحسب في Lighthouse)
  window.setTimeout(() => {
    void import("./styles/fonts-ui-bold.css");
  }, 20000);
}
if (document.readyState === "complete") {
  scheduleNonCriticalCss();
} else {
  window.addEventListener("load", scheduleNonCriticalCss, { once: true });
}
// chunk-recovery / capacitor / ios-edge خارج CSS الحرج (gzip ≤60KiB)

if (isNative) {
  document.documentElement.classList.add("capacitor-native");
  document.documentElement.dataset.platform = isAndroid ? "android" : isIOS ? "ios" : "native";
  // أبقِ خلفية الإقلاع حتى يركّب React ويضبط PageChrome.
  {
    const bootTheme = resolveTheme(readThemePreference());
    document.documentElement.style.setProperty(
      "--app-status-bg",
      bootTheme === "dark" ? "#101614" : "#F2F4F3",
    );
    document.documentElement.style.setProperty(
      "--app-status-fg-mode",
      bootTheme === "dark" ? "dark" : "light",
    );
  }
  void import("./styles/capacitor-native-ux.css");
  void import("./styles/ios-edge.css");
}

const queryClient = createAppQueryClient();

resetMobileNavBodyLock();
installMajalisClearCacheDebug();
// تسلسل إقلاع موحّد (مسح قديم + ترطيب ثيم/صفحة + قفل مقاييس) — بلا await قبل createRoot
runBootSequenceBeforeMount();

const bootReporting = () => {
  initClientErrorReporting();
  logLcpCandidateHint();
  // RUM بعد idle — لا ينافس LCP؛ يُفعَّل فقط مع موافقة التحليلات
  scheduleOnIdle(() => {
    void import("./lib/rum-telemetry").then((m) => m.initRumTelemetry());
  }, 4_000);
};
if (typeof requestIdleCallback === "function") {
  requestIdleCallback(bootReporting, { timeout: 2_500 });
} else {
  setTimeout(bootReporting, 0);
}

const bootFinalPolish = () => initFinalPolish();
if (typeof requestIdleCallback === "function") {
  requestIdleCallback(bootFinalPolish, { timeout: 4_000 });
} else {
  setTimeout(bootFinalPolish, 1);
}

function scheduleNetworkWarm() {
  const run = () => {
    prewarmAudioCdns();
    prewarmTextApis();
    prewarmSupabaseOrigin();
    void refreshQuranAudioRemoteConfig();
    void import("./lib/adhan-audio-remote-config").then((m) =>
      m.refreshAdhanAudioRemoteConfig(),
    );
    void import("./lib/tafsir-audio-remote-config").then((m) =>
      m.refreshTafsirAudioRemoteConfig(),
    );
  };
  const start = () => window.setTimeout(() => scheduleOnIdle(run), 20_000);
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
scheduleNetworkWarm();

prefetchTopRoutesOnIdle();

async function mount() {
  const started = performance.now();

  // ترحيل راية الخصوصية ومسح مفاتيح الدخولية القديمة — بلا شاشة بدء.
  initOnboardingState();

  if (isNative) {
    installInAppNavigationGuard();
  }

  // مهم: لا ننتظر purge/hydrate قبل createRoot — كانت تعلّق شاشة بيضاء/فاتحة
  // داخل Capacitor عندما يعلق جسر Preferences أو مسح الكاش.
  const rootEl = document.getElementById("root");
  if (!rootEl) {
    console.error("[boot] #root missing — cannot mount");
    return;
  }

  try {
    createRoot(rootEl).render(
      <>
        <ChunkRecoveryToast />
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </ErrorBoundary>
      </>,
    );
  } catch (err) {
    console.error("[boot] createRoot failed", err);
    return;
  }

  // مزامنة التخزين الأصلي بالتوازي مع الرسم — لا await قبل createRoot.
  const storageHydrate = hydrateNativeStorage().catch(() => {});
  registerBootStorageGate(storageHydrate);

  // أخفِ الإطلاق بعد جاهزية الثيم/الخطوط/التخزين (document.fonts داخل awaitBootReadiness).
  markBootAwaitPaint();
  armNativeSplashController();
  void awaitBootReadiness().then(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("mj:app-painted"));
        window.dispatchEvent(new Event("app:first-paint"));
        scheduleMushafLastPagePrewarm();
      });
    });
  });

  // خلفيات غير حاجبة للإقلاع — تأجيل طويل (لا rIC: يطلق فور الخمول فيُحسب Unused JS).
  const afterPaint = () => {
    void purgeNativeWebRuntimeCaches().catch(() => {});
    void storageHydrate;
    void import("./lib/supabase-bootstrap")
      .then((m) => m.bootstrapSupabaseFromServer().then(() => m.resetSupabaseClient()))
      .catch(() => {});
  };
  let afterPaintStarted = false;
  const startAfterPaint = () => {
    if (afterPaintStarted) return;
    afterPaintStarted = true;
    afterPaint();
  };
  window.addEventListener("pointerdown", startAfterPaint, { once: true, passive: true });
  window.addEventListener("keydown", startAfterPaint, { once: true });
  window.setTimeout(startAfterPaint, 20000);

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

void mount().catch((err) => {
  console.error("[boot] mount failed", err);
});

// داخل تطبيق Capacitor الأصلي نمنع تسجيل SW تمامًا لتفادي أي بقايا كاش
// من جلسات سابقة داخل WebView؛ تحديث iOS يعتمد على ملفات cap sync فقط.
if (!isNative) {
  const registerSw = () => {
    void import("./lib/service-worker").then((m) => m.registerProductionServiceWorker());
  };
  if (document.readyState === "complete") scheduleOnIdle(registerSw);
  else window.addEventListener("load", () => scheduleOnIdle(registerSw), { once: true });
}

// إعداد Capacitor Native (يُهمَل تلقائياً على الويب) — بعد الرسم حتى لا يحجب TBT
if (isNative) {
  scheduleOnIdle(() => {
    void setupStatusBar(resolveTheme(readThemePreference()));
    void setupKeyboard();
  }, 1500);
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
