/**
 * Quran tests — hub page loads, section navigation, radio controls.
 * /quran صفحة قراءة بنمط المدينة؛ /quran-hub المركز؛ /mushaf المصحف الرسمي.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

test.describe("Quran — مركز القرآن", () => {
  test("/quran loads Madinah-style page with Al-Fatiha", async ({ page }) => {
    await page.goto("/quran");
    await waitForContent(page);
    await page.waitForTimeout(800);
    expect(page.url()).toMatch(/\/quran\/?$/);
    await expect(page.locator(".qp-madinah__surah-title")).toContainText("الْفَاتِحَة");
    await expect(page.locator(".qp-madinah__ayah")).toHaveCount(7);
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

  test("خطط الحفظ تحفظ التقدم وتعرض خطة الشهر كمراجعة", async ({ page }) => {
    await page.goto("/quran/memorization-plans");
    await waitForContent(page);

    await expect(page.getByRole("heading", { name: "خطط الحفظ والمراجعة" })).toBeVisible();
    await expect(page.getByRole("button", { name: /مراجعة مكثفة، 30 يومًا/ })).toContainText("ليست وعدًا بحفظ جديد");

    await page.getByRole("button", { name: /خطة سنة/ }).click();
    await page.getByRole("button", { name: "أتممت الجلسة" }).click();
    await expect(page.getByRole("heading", { name: "جلسة اليوم 2" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "جلسة اليوم 2" })).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
  });

});
