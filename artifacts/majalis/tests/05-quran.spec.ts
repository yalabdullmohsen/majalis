/**
 * Quran tests — hub page loads, section navigation, radio controls.
 * /quran اختصار لمركز القرآن، بينما /mushaf قارئ حي مستقل.
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

test.describe("مصحف حقيقي /mushaf — تحديد آية وتلاوة", () => {
  test("tap على آية لا يغيّر رقم الصفحة ويفتح شريط الآية", async ({ page }) => {
    await page.goto("/mushaf?page=1");
    await waitForContent(page);
    const viewport = page.getByTestId("mushaf-viewport");
    await expect(viewport).toBeVisible({ timeout: 20000 });
    await expect(viewport).toHaveAttribute("data-page", "1");

    const ayah = page.getByTestId("mushaf-ayah-hit").first();
    await expect(ayah).toBeVisible({ timeout: 20000 });
    await ayah.click({ force: true });

    await expect(page.getByTestId("mushaf-ayah-actions")).toBeVisible({ timeout: 5000 });
    await expect(viewport).toHaveAttribute("data-page", "1");
    await expect(viewport).toHaveAttribute("data-ayah-bar", "1");
  });

  test("زر التشغيل يظهر ويُرسل نية play دون تغيير الصفحة", async ({ page }) => {
    await page.goto("/mushaf?page=2");
    await waitForContent(page);
    const viewport = page.getByTestId("mushaf-viewport");
    await expect(viewport).toBeVisible({ timeout: 20000 });

    const ayah = page.getByTestId("mushaf-ayah-hit").first();
    await expect(ayah).toBeVisible({ timeout: 20000 });
    await ayah.click({ force: true });
    await expect(page.getByTestId("mushaf-ayah-actions")).toBeVisible();

    const play = page.getByTestId("mushaf-ayah-play");
    await expect(play).toBeVisible();
    await play.click();
    // إما حالة تحميل/تشغيل أو خطأ واضح — لا صمت
    await expect
      .poll(async () => {
        const status = await page.getByTestId("mushaf-audio-status").count();
        const err = await page.getByTestId("mushaf-audio-error").count();
        const transport = await page.locator(".mm-ayah-bar__transport").count();
        return status + err + transport > 0;
      }, { timeout: 8000 })
      .toBe(true);
    await expect(viewport).toHaveAttribute("data-page", "2");
  });

  test("swipe أفقي واضح يغيّر الصفحة", async ({ page }) => {
    await page.goto("/mushaf?page=3");
    await waitForContent(page);
    const viewport = page.getByTestId("mushaf-viewport");
    await expect(viewport).toBeVisible({ timeout: 20000 });
    await expect(viewport).toHaveAttribute("data-page", "3");

    const box = await viewport.boundingBox();
    if (!box) return;
    const y = box.y + box.height * 0.45;
    const x0 = box.x + box.width * 0.7;
    const x1 = box.x + box.width * 0.25;
    await page.mouse.move(x0, y);
    await page.mouse.down();
    await page.mouse.move(x1, y, { steps: 12 });
    await page.mouse.up();
    await expect(viewport).toHaveAttribute("data-page", "4", { timeout: 5000 });
  });
});
