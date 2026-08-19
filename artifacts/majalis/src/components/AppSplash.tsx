import { useEffect } from "react";

declare global {
  interface Window {
    __mjSplashStart?: number;
    __mjDismissSplash?: (immediate: boolean) => void;
  }
}

/**
 * يتحكم فقط في إزالة طبقة `#mj-silent-splash` الموجودة في `index.html`
 * بحيث تكون سياسة الظهور/الاختفاء:
 * - minVisible: 900ms
 * - maxVisible: 1500ms
 * - exit: 250-300ms عبر transition في CSS (EXIT_MS = 300)
 */
export function AppSplash(): null {
  useEffect(() => {
    const dismiss = window.__mjDismissSplash;
    if (typeof dismiss !== "function") return;

    const start = typeof window.__mjSplashStart === "number" ? window.__mjSplashStart : performance.now();
    const reduced = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

    const MIN_MS = 900;
    const MAX_MS = 1500;
    const EXIT_MS = 300;

    const onPaint = () => {
      const elapsed = performance.now() - start;
      const minStartExitAt = MIN_MS;
      // Start exit a bit earlier to absorb event-loop jitter
      // so that DOM removal stays <= MAX_MS.
      const maxStartExitAt = Math.max(0, MAX_MS - EXIT_MS - 60);

      const plannedExitAt = Math.min(Math.max(elapsed, minStartExitAt), maxStartExitAt);
      const delay = Math.max(0, plannedExitAt - elapsed);

      window.setTimeout(() => dismiss(reduced), delay);
    };

    window.addEventListener("mj:app-painted", onPaint, { once: true });
    return () => {
      window.removeEventListener("mj:app-painted", onPaint);
    };
  }, []);

  return null;
}

