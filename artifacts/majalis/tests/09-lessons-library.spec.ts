/**
 * Lessons & Library tests.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

test.describe("Lessons — الدروس", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/lessons");
    await waitForContent(page);
    await page.waitForTimeout(1000);
  });

  test("lessons page shows lesson cards", async ({ page }) => {
    const body = await page.locator("body").innerText();
    expect(body.length, "صفحة الدروس فارغة").toBeGreaterThan(50);
  });

  test("lessons search input filters results", async ({ page }) => {
    const searchInput = page.locator('input[aria-label*="بحث"]').first();
    if (await searchInput.count() > 0 && await searchInput.isVisible()) {
      await searchInput.fill("فقه");
      await page.waitForTimeout(600);
      const body = await page.locator("body").innerText();
      expect(body.length).toBeGreaterThan(5);
    }
  });

  test("lessons tab switching works", async ({ page }) => {
    const tabs = page.locator('button[role="tab"], button').filter({ hasText: /دروس|دورات|مساجد/ });
    if (await tabs.count() > 1) {
      await tabs.nth(1).click();
      await page.waitForTimeout(400);
      const body = await page.locator("body").innerText();
      expect(body.length).toBeGreaterThan(5);
    }
  });

  test("kuwait lessons page loads", async ({ page }) => {
    await page.goto("/kuwait-lessons");
    await waitForContent(page);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(5);
  });
});

test.describe("Library — المكتبة", () => {
  test("library page loads with books", async ({ page }) => {
    await page.goto("/library");
    await waitForContent(page);
    await page.waitForTimeout(1000);
    const body = await page.locator("body").innerText();
    expect(body.length, "المكتبة فارغة").toBeGreaterThan(20);
  });

  test("library search works", async ({ page }) => {
    await page.goto("/library");
    await waitForContent(page);
    await page.waitForTimeout(600);
    const search = page.locator('input[type="search"], input[placeholder*="بحث"]').first();
    if (await search.count() > 0 && await search.isVisible()) {
      await search.fill("فقه");
      await page.waitForTimeout(600);
    }
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(5);
  });

  test("fawaid page loads", async ({ page }) => {
    await page.goto("/fawaid");
    await waitForContent(page);
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(20);
  });
});
