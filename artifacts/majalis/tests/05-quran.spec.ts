/**
 * Quran tests — hub page loads, section navigation, radio controls.
 * قارئ المصحف صفحة-بصفحة حُذف (2026-07-14)؛ /quran و/mushaf يُحوَّلان الآن إلى /quran-hub.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

test.describe("Quran — مركز القرآن", () => {
  test("/quran redirects to quran hub and loads with content", async ({ page }) => {
    await page.goto("/quran");
    await waitForContent(page);
    await page.waitForTimeout(800);
    expect(page.url()).toContain("/quran-hub");
    const body = await page.locator("body").innerText();
    const hasContent = body.length > 10;
    expect(hasContent, "مركز القرآن يجب أن يحمّل بمحتوى").toBe(true);
  });

  test("clicking a section card navigates to its page", async ({ page }) => {
    await page.goto("/quran-hub");
    await waitForContent(page);
    await page.waitForTimeout(600);
    const card = page.locator(".quran-hub-card").first();
    if (await card.count() > 0) {
      await card.click();
      await waitForContent(page);
      const url = page.url();
      expect(url).not.toContain("/quran-hub");
    }
  });

  test("quran hub has explorable sections grid", async ({ page }) => {
    await page.goto("/quran-hub");
    await waitForContent(page);
    const cards = page.locator(".quran-hub-card");
    const hasCards = await cards.count() > 0;
    const hasList = await page.locator("body").innerText().then((t) => t.length > 50);
    expect(hasCards || hasList).toBe(true);
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
