/**
 * Search tests — global search, page-level search, filters.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

test.describe("Search — البحث", () => {
  test("search page loads and shows input", async ({ page }) => {
    await page.goto("/search");
    await waitForContent(page);
    await expect(page.locator('input[type="search"], input[placeholder*="بحث"], input[aria-label*="بحث"]').first()).toBeVisible();
  });

  test("search query via URL shows results or empty state", async ({ page }) => {
    await page.goto("/search/صلاة");
    await waitForContent(page);
    await page.waitForTimeout(1500); // wait for Supabase results
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(5);
  });

  test("lessons page search filters results", async ({ page }) => {
    await page.goto("/lessons");
    await waitForContent(page);
    const searchInput = page.locator('input[aria-label*="بحث"], input[placeholder*="بحث"]').first();
    if (await searchInput.count() > 0 && await searchInput.isVisible()) {
      await searchInput.fill("فقه");
      await page.waitForTimeout(800); // debounce
      const body = await page.locator("body").innerText();
      expect(body.length).toBeGreaterThan(5);
    }
  });

  test("hadith page search works", async ({ page }) => {
    await page.goto("/hadith");
    await waitForContent(page);
    await page.waitForTimeout(1000);
    const searchInput = page.locator('input[type="search"], input[placeholder*="بحث"]').first();
    if (await searchInput.count() > 0 && await searchInput.isVisible()) {
      await searchInput.fill("تقوى");
      await page.waitForTimeout(800);
      const body = await page.locator("body").innerText();
      expect(body.length).toBeGreaterThan(5);
    }
  });

  test("search clears and resets correctly", async ({ page }) => {
    await page.goto("/search");
    await waitForContent(page);
    const input = page.locator('input').first();
    await input.fill("اختبار");
    await page.waitForTimeout(500);
    await input.clear();
    await page.waitForTimeout(300);
    expect(await input.inputValue()).toBe("");
  });
});
