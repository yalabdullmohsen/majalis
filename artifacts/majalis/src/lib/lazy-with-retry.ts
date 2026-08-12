import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { PAGE_LOAD_TIMEOUT_MS } from "@/lib/request-manager";

/** Unified session key — shared with ErrorBoundary / SectionErrorBoundary. */
export const CHUNK_RELOAD_KEY = "majalis-chunk-reload";

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : "";
  const lower = message.toLowerCase();
  const nameLower = name.toLowerCase();
  return (
    nameLower === "chunkloaderror" ||
    lower.includes("failed to fetch dynamically imported module") ||
    lower.includes("importing a module script failed") ||
    lower.includes("is not a valid javascript mime type") ||
    lower.includes("error loading dynamically imported module") ||
    lower.includes("loading css chunk") ||
    lower.includes("loading chunk") ||
    lower.includes("chunkloaderror") ||
    /\/assets\/[^?\s]+\.(js|mjs|css)/i.test(message)
  );
}

/** One auto-reload per tab session for stale post-deploy chunks. */
export function consumeChunkReloadAllowance(label = "1"): boolean {
  try {
    if (typeof sessionStorage === "undefined") return true;
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, label || "1");
    return true;
  } catch {
    return true;
  }
}

export function clearChunkReloadGuard(): void {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      // Legacy key from pre-unification ErrorBoundary
      sessionStorage.removeItem("mj-chunk-reload-attempted");
    }
  } catch {
    /* ignore */
  }
}

/**
 * Lazy load with a single hard reload when a stale post-deploy chunk is requested.
 * Root cause: open tabs keep an old module graph that imports missing /assets/*.js hashes.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  label?: string,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await factory();
      clearChunkReloadGuard();
      return mod;
    } catch (error) {
      if (typeof window !== "undefined" && isChunkLoadError(error)) {
        // استيراد ديناميكي لكسر دورة الاعتماد مع chunk-recovery
        const { tryRecoverFromStaleChunk } = await import("@/lib/chunk-recovery");
        if (tryRecoverFromStaleChunk(label || "1")) {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, PAGE_LOAD_TIMEOUT_MS);
          });
        }
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
