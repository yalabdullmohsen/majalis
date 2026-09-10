/**
 * قبول حرج: المصحف/البحث/الأقسام ليست الرئيسية وليست فارغة.
 * /library → /search و /more → /sections تحويلات متعمدة في AppRoutes.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

test.describe("قبول حرج — مسارات ليست الرئيسية", () => {
  test("/mushaf ليس الرئيسية", async ({ page }) => {
    await page.goto("/mushaf", { waitUntil: "domcontentloaded" });
    await waitForContent(page);
    await expect(page).toHaveURL(/\/mushaf/);
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/ابدأ طلب العلم/);
    const shell = page
      .locator(
        '.mushaf-shell, .nm-root, .mm-viewport, [data-testid="mushaf-page-shell"], [data-mushaf]',
      )
      .first();
    await expect(shell).toBeVisible({ timeout: 15_000 });
  });

  test("/library يحوّل إلى البحث", async ({ page }) => {
    await page.goto("/library", { waitUntil: "domcontentloaded" });
    await waitForContent(page);
    await expect(page).toHaveURL(/\/search/);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(20);
    expect(body).not.toMatch(/ابدأ طلب العلم/);
    const input = page
      .locator(
        'input[type="search"], input[name="q"], input[placeholder*="بحث"], input[aria-label*="بحث"]',
      )
      .first();
    await expect(input).toBeVisible({ timeout: 10_000 });
  });

  test("/more يحوّل إلى الأقسام", async ({ page }) => {
    await page.goto("/more", { waitUntil: "domcontentloaded" });
    await waitForContent(page);
    await expect(page).toHaveURL(/\/sections/);
    await expect(
      page.locator("h1, h2").filter({ hasText: /المزيد|الأبواب|الأقسام/ }).first(),
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test("/search يعرض حقلاً", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await waitForContent(page);
    const input = page
      .locator(
        'input[type="search"], input[name="q"], input[placeholder*="بحث"], input[aria-label*="بحث"]',
      )
      .first();
    await expect(input).toBeVisible({ timeout: 10_000 });
  });
});
