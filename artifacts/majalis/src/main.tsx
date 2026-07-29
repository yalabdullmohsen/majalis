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
import { setupStatusBar, setupKeyboard, isAndroid, isNative } from "./lib/capacitor-utils";
import { initFinalPolish } from "./lib/init-final-polish";
import { prewarmAudioCdns, prewarmTextApis, prewarmSupabaseOrigin } from "./lib/resource-prewarm";
// هوية v4: مصدر الرموز الوحيد (لون/طباعة/مسافات/حواف/ظلال/حركة). يجب أن
// يبقى أول استيراد — كل ملفات CSS اللاحقة تستهلك رموزه، وأنظمة الرموز
// القديمة الـ15 مُعاد توجيهها إليه داخله كـaliases.
import "./styles/brand-v4.css";
import "./index.css";
import "./styles/design-system.css";
import "./styles/patterns.css";
import "./styles/majalis-v2.css";
import "./styles/modern-2026.css";
import "./styles/elite-2026.css";
// Final release layer: one authoritative visual contract loaded after legacy page styles.
import "./styles/final-release.css";
// هوية v4 — طبقة المظهر المشتركة. تُحمَّل أخيرًا كي تحسم شكل البطاقات
// والأزرار والحقول عبر الموقع. لا تحدّد أي لون (انظر رأس الملف).
import "./styles/brand-v4-components.css";
// تصحيحات تباين مُقاسة بـPlaywright (خصوصًا الوضع الداكن). تُحمَّل بعد كل
// شيء كي تحسم التصادمات التي تنتج عن تسطيح الرموز في الثيم الداكن القديم.
import "./styles/brand-v4-contrast-fixes.css";

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
  }, { timeout: 3_000 });
} else {
  setTimeout(() => {
    prewarmAudioCdns();
    prewarmTextApis();
    prewarmSupabaseOrigin();
  }, 1);
}

async function mount() {
  const started = performance.now();

  // Render immediately — do not block the shell on Supabase bootstrap.
  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>,
  );

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
    try { sessionStorage.removeItem("mj-chunk-reload-attempted"); } catch { /* تجاهل */ }
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
      try {
        const parsed = new URL(url);
        const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (path && path !== current) {
          window.history.pushState({}, "", path);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      } catch { /* رابط غير صالح — تجاهل بأمان */ }
    });
  }).catch(() => {});
}
