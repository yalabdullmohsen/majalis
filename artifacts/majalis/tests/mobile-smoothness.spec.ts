/**
 * سلاسة الجوال — تنقل، قوائم، بحث، مصحف بلا أخطاء console.
 */
import { test, expect } from "@playwright/test";
import { collectConsoleErrors, waitForContent } from "./helpers";

test.describe("Mobile smoothness — سلاسة الجوال", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("navigation flow keeps bottom nav stable", async ({ page }) => {
    test.setTimeout(60_000);
    const errors = collectConsoleErrors(page);
    const nav = page.locator("nav.bottom-nav, nav.bottom-nav--v2").first();

    await page.goto("/");
    await waitForContent(page);
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute("data-hidden", "false");

    await page.goto("/lessons");
    await waitForContent(page);
    await expect(nav).toHaveAttribute("data-hidden", "false");

    const filterBtn = page.getByRole("button", { name: "تصفية" });
    if ((await filterBtn.count()) > 0) {
      await filterBtn.click();
      await page.waitForTimeout(300);
      await expect(nav).toHaveAttribute("data-hidden", "false");
      await page.keyboard.press("Escape");
    }

    await page.goto("/quran-hub");
    await waitForContent(page);
    await expect(nav).toHaveAttribute("data-hidden", "false");

    await page.goto("/mushaf?page=1");
    await waitForContent(page);
    const viewport = page.getByTestId("mushaf-viewport");
    await expect(viewport).toBeVisible({ timeout: 20000 });

    const box = await viewport.boundingBox();
    if (box) {
      const y = box.y + box.height * 0.45;
      await page.mouse.move(box.x + box.width * 0.75, y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.25, y, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(500);
      await expect(viewport).not.toHaveAttribute("data-page", "1", { timeout: 8000 });
    }

    await page.goto("/");
    await waitForContent(page);
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: "instant" as ScrollBehavior }));
    await page.waitForTimeout(350);
    await page.evaluate(() => window.scrollTo({ top: 100, behavior: "instant" as ScrollBehavior }));
    await page.waitForTimeout(350);
    await expect(nav).toHaveAttribute("data-hidden", "false");

    await page.getByRole("button", { name: "فتح البحث" }).first().click();
    await expect(page.locator(".gsm-overlay")).toBeVisible({ timeout: 5000 });
    const searchInput = page.locator(".gsm-overlay input[type='search'], .gsm-overlay input").first();
    await searchInput.fill("الصلاة");
    await page.waitForTimeout(400);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    await page.goBack();
    await waitForContent(page);

    expect(errors, `console errors: ${errors.map((e) => e.text()).join("; ")}`).toHaveLength(0);
  });
});
