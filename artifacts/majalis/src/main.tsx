import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { applyFontPreference, readFontPreference } from "./lib/font-preference";
import { initClientErrorReporting } from "./lib/error-report";
import { resetMobileNavBodyLock } from "./lib/mobile-nav-body-lock";
import { bootstrapSupabaseFromServer, resetSupabaseClient } from "./lib/supabase-bootstrap";
import { invalidateLessonsCache } from "./lib/lessons-service";
import { createAppQueryClient } from "./lib/query-client";
import { PERF_SLOW_MS } from "./lib/performance-monitor";
import { registerProductionServiceWorker } from "./lib/service-worker";
import "./index.css";
import "./styles/design-system.css";
import "./styles/tokens-2026.css";
import "./styles/highlighted-content.css";
import "./styles/adhkar-v3.css";
import "./styles/rulings-encyclopedia.css";
import "./styles/scientific-research.css";
import "./styles/quran-scientific-circles.css";

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
    .then((ok) => {
      resetSupabaseClient();
      if (ok) {
        invalidateLessonsCache();
        window.dispatchEvent(new CustomEvent("majalis:supabase-ready"));
      }
    })
    .catch(() => {});

  const renderMs = Math.round(performance.now() - started);
  if (renderMs > PERF_SLOW_MS) {
    console.warn(`[perf:slow] render "app-mount" ${renderMs}ms`);
  }
}

void mount();

registerProductionServiceWorker();
