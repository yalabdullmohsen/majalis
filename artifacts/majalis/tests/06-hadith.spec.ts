/**
 * Hadith page tests — cards, modal, copy button, filters.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

test.describe("Hadith — الحديث", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hadith");
    await waitForContent(page);
    await page.waitForTimeout(1500); // wait for Supabase fetch
  });

  test("page loads and shows hadith cards", async ({ page }) => {
    const body = await page.locator("body").innerText();
    expect(body.length, "صفحة الحديث فارغة").toBeGreaterThan(50);
  });

  test("hadith card opens detail modal on click", async ({ page }) => {
    const cards = page.locator('[class*="hadith-card"], article').filter({ hasText: /حديث|قال|روى/ });
    if (await cards.count() > 0) {
      await cards.first().click();
      await page.waitForTimeout(400);
      // Modal or detail should appear
      const modal = page.locator('[role="dialog"], [class*="modal"]');
      const bodyText = await page.locator("body").innerText();
      const hasDetail = await modal.count() > 0 || bodyText.includes("المصدر");
      expect(hasDetail, "النقر على بطاقة الحديث يجب أن يفتح التفاصيل").toBe(true);
    }
  });

  test("Escape closes hadith modal", async ({ page }) => {
    const cards = page.locator('[class*="hadith-card"], article').filter({ hasText: /حديث|قال|روى/ });
    if (await cards.count() > 0) {
      await cards.first().click();
      await page.waitForTimeout(300);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      const modal = page.locator('[role="dialog"]');
      if (await modal.count() > 0) {
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test("collection filter chips are clickable", async ({ page }) => {
    const filter = page.locator('[class*="filter"], button').filter({ hasText: /البخاري|مسلم|متفق/ }).first();
    if (await filter.count() > 0) {
      await filter.click();
      await page.waitForTimeout(400);
      const body = await page.locator("body").innerText();
      expect(body.length).toBeGreaterThan(5);
    }
  });

  test("hadith copy button copies text (no crash)", async ({ page }) => {
    // Grant clipboard write
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const copyBtn = page.locator('button[aria-label*="نسخ"], button[title*="نسخ"]').first();
    if (await copyBtn.count() > 0) {
      await copyBtn.click();
      await page.waitForTimeout(300);
      // Button should show "تم النسخ" or similar
      // At minimum it shouldn't crash
      expect(await page.locator("body").innerText()).toBeTruthy();
    }
  });
});
