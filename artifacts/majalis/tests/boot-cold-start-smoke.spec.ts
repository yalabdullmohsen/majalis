/**
 * Cold-start smoke — 5 مرات على viewport جوال:
 * لا شاشة بيضاء، لا freeze، لا console error، bottom nav ثابت.
 */
import { test, expect } from "@playwright/test";
import { collectConsoleErrors, waitForContent } from "./helpers";

test.describe("Boot cold start — جوال", () => {
  test.describe.configure({ mode: "serial" });

  for (let i = 1; i <= 5; i++) {
    test(`cold start #${i}`, async ({ page, context }) => {
      await context.clearCookies();
      await context.clearPermissions();
      await page.addInitScript(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          /* ignore */
        }
      });

      const errors = collectConsoleErrors(page);
      const hydration: string[] = [];
      page.on("console", (msg) => {
        const t = msg.text();
        if (/hydrat|did not match|Text content does not match/i.test(t)) {
          hydration.push(t);
        }
      });

      const t0 = Date.now();
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await waitForContent(page);

      const bodyText = await page.locator("body").innerText().catch(() => "");
      expect(bodyText.length, "لا شاشة بيضاء").toBeGreaterThan(20);

      const rootVisible = await page.locator("#root").isVisible();
      expect(rootVisible, "root مرئي").toBeTruthy();

      const bottomNav = page.locator("nav.bottom-nav, [data-testid='bottom-nav'], .bottom-nav-bar, nav[aria-label*='التنقل']").first();
      await expect(bottomNav, "bottom nav يظهر").toBeVisible({ timeout: 8_000 });

      const elapsed = Date.now() - t0;
      expect(elapsed, "لا freeze طويل عند الإقلاع").toBeLessThan(12_000);

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth, "لا overflow أفقي من الشريط").toBeLessThanOrEqual(clientWidth + 2);

      expect(errors.map((e) => e.text()), "بلا console error").toHaveLength(0);
      expect(hydration, "بلا hydration mismatch").toHaveLength(0);
    });
  }
});
