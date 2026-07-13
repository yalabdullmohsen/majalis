import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { applyFontPreference, readFontPreference } from "./lib/font-preference";
import { initClientErrorReporting } from "./lib/error-report";
import { resetMobileNavBodyLock } from "./lib/mobile-nav-body-lock";
import { bootstrapSupabaseFromServer, resetSupabaseClient } from "./lib/supabase-bootstrap";
import { createAppQueryClient } from "./lib/query-client";
import { PERF_SLOW_MS } from "./lib/performance-monitor";
import { registerProductionServiceWorker } from "./lib/service-worker";
import { setupStatusBar, setupKeyboard, isAndroid } from "./lib/capacitor-utils";
import "./index.css";
import "./styles/design-system.css";
import "./styles/patterns.css";
import "./styles/highlighted-content.css";
import "./styles/majalis-v2.css";
import "./styles/modern-2026.css";
import "./styles/elite-2026.css";
import "./styles/sins-rights.css";

const queryClient = createAppQueryClient();

resetMobileNavBodyLock();
applyFontPreference(readFontPreference());
initClientErrorReporting();

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
}

void mount();

registerProductionServiceWorker();

// إعداد Capacitor Native (يُهمَل تلقائياً على الويب)
void setupStatusBar();
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
