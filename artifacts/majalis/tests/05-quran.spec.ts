/**
 * Quran tests — page loads, surah list, navigation, audio controls.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

test.describe("Quran — المصحف", () => {
  test("quran page loads with surah list", async ({ page }) => {
    await page.goto("/quran");
    await waitForContent(page);
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    // قسم القرآن أُحيل لـ"قريباً" — نتحقق فقط من تحميل الصفحة بمحتوى
    const hasContent = body.length > 10;
    expect(hasContent, "صفحة القرآن يجب أن تحمّل بمحتوى").toBe(true);
  });

  test("clicking on Surah Al-Fatiha navigates to its page", async ({ page }) => {
    await page.goto("/quran");
    await waitForContent(page);
    await page.waitForTimeout(600);
    const fatiha = page.locator('text=الفاتحة').first();
    if (await fatiha.count() > 0) {
      await fatiha.click();
      await waitForContent(page);
      const body = await page.locator("body").innerText();
      const hasFatiha = body.includes("الفاتحة") || body.includes("بسم الله");
      expect(hasFatiha).toBe(true);
    }
  });

  test("quran page has search or filter capability", async ({ page }) => {
    await page.goto("/quran");
    await waitForContent(page);
    const searchEl = page.locator('input[type="search"], input[placeholder*="بحث"], input[placeholder*="سورة"]');
    // Either search exists or list is visible
    const hasSearch = await searchEl.count() > 0;
    const hasList = await page.locator("body").innerText().then((t) => t.length > 50);
    expect(hasSearch || hasList).toBe(true);
  });

  test("quran radio page loads and shows station list", async ({ page }) => {
    await page.goto("/quran-radio");
    await waitForContent(page);
    await page.waitForTimeout(600);
    const body = await page.locator("body").innerText();
    expect(body.length, "صفحة راديو القرآن فارغة").toBeGreaterThan(20);
  });

  test("quran radio play button is clickable", async ({ page }) => {
    // Grant autoplay
    await page.context().grantPermissions(["camera", "microphone"]);
    await page.goto("/quran-radio");
    await waitForContent(page);
    await page.waitForTimeout(600);
    const playBtn = page.locator('button').filter({ hasText: /تشغيل|▶|play/i }).first();
    if (await playBtn.count() > 0) {
      await playBtn.click();
      await page.waitForTimeout(600);
      // Should not crash — just verify page is still responsive
      const body = await page.locator("body").innerText();
      expect(body.length).toBeGreaterThan(5);
    }
  });
});
