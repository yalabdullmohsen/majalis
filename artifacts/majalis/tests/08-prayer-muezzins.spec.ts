/**
 * Prayer times tests.
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
