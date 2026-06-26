import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { applyFontPreference, readFontPreference } from "./lib/font-preference";
import { initClientErrorReporting } from "./lib/error-report";
import "./index.css";

applyFontPreference(readFontPreference());
initClientErrorReporting();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("[majalis:pwa] service worker registration failed", error);
    });
  });
}
