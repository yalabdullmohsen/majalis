/**
 * بوابة Playwright: الرجوع بعد شرائح/تبويبات — ضغطة واحدة.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

async function historyLength(page: import("@playwright/test").Page): Promise<number> {
  return page.evaluate(() => window.history.length);
}

test.describe("Back navigation — سجل التاريخ", () => {
  test("tarikh-islami: 4 شرائح → رجوع واحد يخرج من القسم", async ({ page }) => {
    await page.goto("/");
    await waitForContent(page);
    const lenEnter = await historyLength(page);

    await page.goto("/tarikh-islami");
    await waitForContent(page);
    await expect(page.locator(".topic-page__tab")).toHaveCount(6);

    const tabs = ["mudun", "muassasat", "tarikh-hadara", "azamat"];
    for (const tab of tabs) {
      const before = await historyLength(page);
      await page.locator(`.topic-page__tab[data-topic-tab="${tab}"]`).click();
      await waitForContent(page);
      const after = await historyLength(page);
      expect(after - before, `شريحة ${tab} لا تزيد history`).toBeLessThanOrEqual(1);
    }

    const lenAfterTabs = await historyLength(page);
    expect(lenAfterTabs - lenEnter, "4 شرائح لا تلوّث السجل").toBeLessThanOrEqual(2);

    await page.goBack();
    await waitForContent(page);
    expect(page.url()).not.toContain("/tarikh-islami");
  });

  test("lessons: تبويبات ?tab= بلا تراكم history", async ({ page }) => {
    await page.goto("/lessons");
    await waitForContent(page);
    const base = await historyLength(page);

    for (const tab of ["courses", "men", "women", "makkah"]) {
      const chip = page.locator(`[data-lessons-tab="${tab}"], button:has-text("${tab}")`).first();
      if (await chip.count()) {
        const before = await historyLength(page);
        await chip.click();
        await page.waitForTimeout(200);
        const after = await historyLength(page);
        expect(after - before).toBeLessThanOrEqual(1);
      }
    }

    await page.goBack();
    await waitForContent(page);
    const finalLen = await historyLength(page);
    expect(finalLen).toBeLessThanOrEqual(base + 1);
  });

  test("fiqh lobby → رجوع SectionLobby", async ({ page }) => {
    await page.goto("/");
    await waitForContent(page);
    await page.goto("/fiqh");
    await waitForContent(page);
    await page.locator('[data-section-back="1"]').click();
    await waitForContent(page);
    expect(page.url()).not.toContain("/fiqh");
  });
});
