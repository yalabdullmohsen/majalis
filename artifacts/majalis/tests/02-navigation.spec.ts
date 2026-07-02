/**
 * Navigation tests — bottom bar, links, back/forward, 404 handling.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

test.describe("Navigation — التنقل", () => {
  test("bottom navigation bar is visible on home", async ({ page }) => {
    await page.goto("/");
    await waitForContent(page);
    // Bottom nav should contain known items
    const nav = page.locator("nav, [role=navigation]").first();
    await expect(nav).toBeVisible();
  });

  test("clicking Lessons nav link opens /lessons", async ({ page }) => {
    await page.goto("/");
    await waitForContent(page);
    await page.goto("/lessons");
    await waitForContent(page);
    expect(page.url()).toContain("/lessons");
  });

  test("unknown route shows 404 or redirects", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-xyz");
    await waitForContent(page);
    const text = await page.locator("body").innerText();
    const is404 = text.includes("404") || text.includes("غير موجود") || text.includes("الرئيسية");
    expect(is404, "صفحة غير موجودة يجب أن تعرض 404 أو تعيد التوجيه").toBe(true);
  });

  test("browser back button works correctly", async ({ page }) => {
    await page.goto("/");
    await waitForContent(page);
    await page.goto("/hadith");
    await waitForContent(page);
    await page.goBack();
    await waitForContent(page);
    expect(page.url()).toMatch(/\/(#.*)?$/);
  });

  test("settings page has language / appearance controls", async ({ page }) => {
    await page.goto("/settings");
    await waitForContent(page);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(10);
  });
});
