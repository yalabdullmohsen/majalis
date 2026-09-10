/**
 * تثبيت بيئة اللقطات البصرية — خطوط، حركة، locale، ساعة، RTL.
 * للاستخدام من سكربتات Playwright فقط (لا شبكة حية).
 */

/** خيارات سياق Playwright المشتركة للقطات العربية RTL */
export const VISUAL_CONTEXT_OPTIONS = {
  locale: "ar-SA",
  timezoneId: "Asia/Riyadh",
  colorScheme: "light",
  reducedMotion: "reduce",
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 2,
};

/** @param {import('playwright').BrowserContext} context */
export async function stabilizeVisualContext(context) {
  await context.addInitScript(() => {
    try {
      const style = document.createElement("style");
      style.setAttribute("data-visual-stabilize", "1");
      style.textContent = `
        *, *::before, *::after {
          animation: none !important;
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition: none !important;
          transition-duration: 0s !important;
          caret-color: transparent !important;
        }
        html { scroll-behavior: auto !important; }
      `;
      const attach = () => {
        if (document.documentElement) document.documentElement.appendChild(style);
        else document.addEventListener("DOMContentLoaded", attach, { once: true });
      };
      attach();
    } catch {
      /* ignore */
    }
  });
}

/**
 * @param {import('playwright').Page} page
 * @param {{ settleMs?: number }} [opts]
 */
export async function waitForVisualReady(page, opts = {}) {
  const settleMs = opts.settleMs ?? 120;
  await page.evaluate(async () => {
    try {
      if (document.fonts?.ready) await document.fonts.ready;
    } catch {
      /* ignore */
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  if (settleMs > 0) await page.waitForTimeout(settleMs);
}
