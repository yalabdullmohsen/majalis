import type { Page, ConsoleMessage } from "@playwright/test";

/** Collect JS console errors (ignores network noise and known non-critical warnings) */
export function collectConsoleErrors(page: Page): ConsoleMessage[] {
  const errors: ConsoleMessage[] = [];
  const IGNORE = [
    "Failed to load resource",
    "net::ERR",
    "favicon",
    "supabase",
    "[vite]",
    "Content-Security-Policy",
    "ResizeObserver",
  ];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!IGNORE.some((s) => text.includes(s))) {
        errors.push(msg);
      }
    }
  });
  return errors;
}

/** Wait until the lazy-loading spinner is gone */
export async function waitForContent(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  // Give React time to hydrate + lazy load
  await page.waitForTimeout(600);
}

/** Measure Core Web Vitals using PerformanceObserver entries */
export async function measurePerf(page: Page): Promise<{
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
}> {
  return page.evaluate(() => {
    return new Promise<{ fcp: number | null; lcp: number | null; cls: number | null }>(
      (resolve) => {
        const result = { fcp: null as number | null, lcp: null as number | null, cls: null as number | null };
        let clsValue = 0;

        try {
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) {
              if (e.name === "first-contentful-paint") result.fcp = Math.round(e.startTime);
            }
          }).observe({ type: "paint", buffered: true });

          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) result.lcp = Math.round(e.startTime);
          }).observe({ type: "largest-contentful-paint", buffered: true });

          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) {
              const le = e as PerformanceEntry & { value: number; hadRecentInput: boolean };
              if (!le.hadRecentInput) clsValue += le.value;
            }
          }).observe({ type: "layout-shift", buffered: true });
        } catch {
          /* unsupported */
        }

        setTimeout(() => {
          result.cls = Math.round(clsValue * 1000) / 1000;
          resolve(result);
        }, 2500);
      },
    );
  });
}
