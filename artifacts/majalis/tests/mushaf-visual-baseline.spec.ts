/**
 * خط الأساس البصري المعتمد للمصحف — البند ٠ من جولة feat/mushaf-round-2.
 * ١٢ صفحة مرجعية × وضعين. أي انحراف يتجاوز maxDiffPixelRatio يُفشل البوابة.
 * الترسيم الحالي معتمد كمرجع — لا يُغيَّر إلا بطلب صريح (راجع MUSHAF_SPEC.md).
 */
import { test, expect, type Page } from "@playwright/test";

const REFERENCE_PAGES = [1, 2, 50, 77, 187, 293, 377, 453, 528, 601, 602, 604];
const VIEWPORT = { width: 390, height: 844 };

test.use({ viewport: VIEWPORT });

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((t) => {
    window.localStorage.setItem("majalis-theme", t);
  }, theme);
}

async function gotoMushafPage(page: Page, n: number) {
  await page.goto(`/mushaf?page=${n}`, { waitUntil: "networkidle" });
  await page.waitForSelector(`[data-testid="mushaf-page"][data-page="${n}"]`, { timeout: 20000 });
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="mushaf-controls"]');
    if (el) el.setAttribute("data-open", "0");
  });
  await page.waitForTimeout(400);
}

for (const n of REFERENCE_PAGES) {
  for (const theme of ["light", "dark"] as const) {
    test(`mushaf baseline — صفحة ${n} (${theme === "dark" ? "ليلي" : "نهاري"})`, async ({ page }) => {
      await setTheme(page, theme);
      await gotoMushafPage(page, n);
      await expect(page.locator('[data-testid="mushaf-viewport"]')).toHaveScreenshot(
        `page-${String(n).padStart(3, "0")}-${theme}.png`,
        { maxDiffPixelRatio: 0.01, animations: "disabled" },
      );
    });
  }
}
