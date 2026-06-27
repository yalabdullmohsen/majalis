import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { applyFontPreference, readFontPreference } from "./lib/font-preference";
import { initClientErrorReporting } from "./lib/error-report";
import { resetMobileNavBodyLock } from "./lib/mobile-nav-body-lock";
import { bootstrapSupabaseFromServer, resetSupabaseClient } from "./lib/supabase-bootstrap";
import "./index.css";
import "./styles/design-system.css";
import "./styles/rulings-encyclopedia.css";

resetMobileNavBodyLock();
applyFontPreference(readFontPreference());
initClientErrorReporting();

async function mount() {
  await bootstrapSupabaseFromServer();
  resetSupabaseClient();

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );
}

void mount();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("[majalis:pwa] service worker registration failed", error);
    });
  });
}
