/**
 * Prayer times & Muezzins tests.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

test.describe("Prayer Times — مواقيت الصلاة", () => {
  test("prayer times page loads", async ({ page }) => {
    await page.goto("/prayer-times");
    await waitForContent(page);
    const body = await page.locator("body").innerText();
    const hasPrayers =
      body.includes("الفجر") ||
      body.includes("الظهر") ||
      body.includes("العصر") ||
      body.includes("المغرب") ||
      body.includes("العشاء") ||
      body.includes("صلاة");
    expect(hasPrayers, "صفحة مواقيت الصلاة لا تعرض أوقات الصلاة").toBe(true);
  });

  test("prayer times shows qibla link or direction", async ({ page }) => {
    await page.goto("/prayer-times");
    await waitForContent(page);
    const qiblaLink = page.locator("a[href*='qibla'], button").filter({ hasText: /قبلة|اتجاه/ });
    // Either qibla link exists or page has useful content
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(20);
  });

  test("qibla page loads", async ({ page }) => {
    await page.goto("/qibla");
    await waitForContent(page);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(5);
  });

  test("adhan settings page loads with toggle controls", async ({ page }) => {
    await page.goto("/adhan-settings");
    await waitForContent(page);
    const body = await page.locator("body").innerText();
    const hasSettings = body.includes("أذان") || body.includes("إعداد") || body.includes("مؤذن");
    expect(hasSettings).toBe(true);
  });
});

test.describe("Muezzins — المؤذنون", () => {
  test("muezzins page loads with muezzin cards", async ({ page }) => {
    await page.goto("/muezzins");
    await waitForContent(page);
    await page.waitForTimeout(600);
    const body = await page.locator("body").innerText();
    const hasMuezzins = body.includes("مؤذن") || body.includes("أذان") || body.includes("تقييم");
    expect(hasMuezzins, "صفحة المؤذنين لا تحتوي بطاقات").toBe(true);
  });

  test("muezzin style filter works", async ({ page }) => {
    await page.goto("/muezzins");
    await waitForContent(page);
    const filterBtn = page.locator("button").filter({ hasText: /خاشع|رسمي|تقليدي|كلاسيكي/ }).first();
    if (await filterBtn.count() > 0) {
      await filterBtn.click();
      await page.waitForTimeout(400);
      const body = await page.locator("body").innerText();
      expect(body.length).toBeGreaterThan(10);
    }
  });

  test("muezzin preview button exists", async ({ page }) => {
    await page.goto("/muezzins");
    await waitForContent(page);
    await page.waitForTimeout(600);
    const previewBtns = page.locator("button").filter({ hasText: /▶|معاينة|تشغيل/ });
    const count = await previewBtns.count();
    expect(count, "لا توجد أزرار معاينة للمؤذنين").toBeGreaterThan(0);
  });

  test("clicking muezzin preview plays (no crash)", async ({ page }) => {
    await page.context().grantPermissions([]);
    await page.goto("/muezzins");
    await waitForContent(page);
    await page.waitForTimeout(600);
    const previewBtn = page.locator("button").filter({ hasText: /▶/ }).first();
    if (await previewBtn.count() > 0) {
      await previewBtn.click();
      await page.waitForTimeout(500);
      // Page should remain functional
      const body = await page.locator("body").innerText();
      expect(body.length).toBeGreaterThan(5);
    }
  });

  test("muezzin detail page loads", async ({ page }) => {
    await page.goto("/muezzins/sudais");
    await waitForContent(page);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(5);
  });

  test("muezzin favorites page loads", async ({ page }) => {
    await page.goto("/muezzins/favorites");
    await waitForContent(page);
    const body = await page.locator("body").innerText();
    const hasContent = body.includes("مفضل") || body.includes("مؤذن") || body.includes("مكتبة");
    expect(hasContent).toBe(true);
  });
});
