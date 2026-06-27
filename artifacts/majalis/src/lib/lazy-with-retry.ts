import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { PAGE_LOAD_TIMEOUT_MS } from "@/lib/request-manager";

const RELOAD_KEY = "majalis-chunk-reload";

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("is not a valid JavaScript MIME type") ||
    message.includes("error loading dynamically imported module")
  );
}

/**
 * Lazy load with a single hard reload when a stale post-deploy chunk is requested.
 * Root cause: missing /assets/*.js used to be rewritten to index.html (text/html MIME).
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  label?: string,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await factory();
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(RELOAD_KEY);
      }
      return mod;
    } catch (error) {
      if (typeof window !== "undefined" && isChunkLoadError(error)) {
        const reloaded = sessionStorage.getItem(RELOAD_KEY);
        if (!reloaded) {
          sessionStorage.setItem(RELOAD_KEY, label || "1");
          window.location.reload();
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, PAGE_LOAD_TIMEOUT_MS);
          });
        }
        sessionStorage.removeItem(RELOAD_KEY);
      }
      throw error;
    }
  });
}

/** Preload a lazy route chunk after auth succeeds (admin login path). */
export function preloadRoute(factory: () => Promise<unknown>): void {
  void factory().catch(() => {
    /* ignore — lazyWithRetry handles load at navigation */
  });
}
