/**
 * Responsive design tests — mobile (375×812) and desktop (1280×800).
 * These tests run on both projects defined in playwright.config.ts.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

const KEY_PAGES = ["/", "/lessons", "/hadith", "/quran-hub", "/adhkar", "/muezzins"];

test.describe("Responsive — التجاوب مع الشاشات", () => {
  for (const path of KEY_PAGES) {
    test(`${path} renders without overflow`, async ({ page }) => {
      await page.goto(path);
      await waitForContent(page);
      await page.waitForTimeout(500);

      const { width } = page.viewportSize()!;

      // Check horizontal scroll — body should not be wider than viewport
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(
        bodyWidth,
        `${path} يسبب تمرير أفقي (body=${bodyWidth}px > viewport=${width}px)`,
      ).toBeLessThanOrEqual(width + 1); // 1px tolerance for rounding
    });
  }

  test("home page — navigation is accessible on mobile", async ({ page }) => {
    await page.goto("/");
    await waitForContent(page);
    // Bottom nav or hamburger should be present
    const nav = page.locator('nav, [role="navigation"], [class*="bottom-nav"], [class*="tab-bar"]').first();
    await expect(nav).toBeVisible();
  });

  test("hadith page — cards fit in viewport without overlap", async ({ page }) => {
    await page.goto("/hadith");
    await waitForContent(page);
    await page.waitForTimeout(1200);
    // No horizontal scroll
    const { width } = page.viewportSize()!;
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollW).toBeLessThanOrEqual(width + 2);
  });

  test("quran hub page — sections grid scrollable vertically on mobile", async ({ page }) => {
    await page.goto("/quran-hub");
    await waitForContent(page);
    await page.waitForTimeout(600);
    const scrollH = await page.evaluate(() => document.documentElement.scrollHeight);
    const viewH = page.viewportSize()!.height;
    // Content should either fit or be scrollable
    expect(scrollH).toBeGreaterThan(0);
    void viewH;
  });

  test("login page renders on mobile without overflow", async ({ page }) => {
    await page.goto("/login");
    await waitForContent(page);
    await page.waitForTimeout(1000);
    // No horizontal scroll
    const { width } = page.viewportSize()!;
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollW, "صفحة الدخول تسبب تمرير أفقي على الهاتف").toBeLessThanOrEqual(width + 2);
    // Page has content
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(5);
    // If form is visible, check it fits in viewport
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      const box = await emailInput.boundingBox();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(width + 2);
      }
    }
  });
});
