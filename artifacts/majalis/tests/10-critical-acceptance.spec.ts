/**
 * قبول حرج: المصحف/المكتبة/المزيد ليست الرئيسية وليست فارغة.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

test.describe("قبول حرج — مسارات ليست الرئيسية", () => {
  test("/mushaf ليس الرئيسية", async ({ page }) => {
    await page.goto("/mushaf", { waitUntil: "domcontentloaded" });
    await waitForContent(page);
    await expect(page).toHaveURL(/\/mushaf/);
    // لا محتوى ترويجي للرئيسية
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/ابدأ طلب العلم/);
    // حاوية المصحف أو الهيكل موجودة (قد يكتمل الرسم لاحقاً)
    const shell = page.locator(".quran-shell, .mf2-lines, .qs-mushaf-body, [data-mushaf]").first();
    await expect(shell).toBeVisible({ timeout: 15_000 });
  });

  test("/library ليست الرئيسية", async ({ page }) => {
    await page.goto("/library", { waitUntil: "domcontentloaded" });
    await waitForContent(page);
    await expect(page).toHaveURL(/\/library/);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(20);
    expect(body).not.toMatch(/ابدأ طلب العلم/);
  });

  test("/more صفحة حقيقية", async ({ page }) => {
    await page.goto("/more", { waitUntil: "domcontentloaded" });
    await waitForContent(page);
    await expect(page).toHaveURL(/\/more/);
    await expect(page.locator("h1, h2").filter({ hasText: /المزيد|الأبواب/ }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("/search يعرض حقلاً", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await waitForContent(page);
    const input = page.locator('input[type="search"], input[name="q"], input[placeholder*="بحث"], input[aria-label*="بحث"]').first();
    await expect(input).toBeVisible({ timeout: 10_000 });
  });
});
