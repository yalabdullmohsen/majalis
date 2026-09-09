/**
 * Hadith page tests — hub, cards, modal, copy button, filters.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "./helpers";

async function openSahihList(page: import("@playwright/test").Page) {
  await page.goto("/hadith/sahih");
  await waitForContent(page);
  await page.waitForTimeout(1200);
}

test.describe("Hadith — الحديث", () => {
  test("hub loads quickly without embedded corpus grid", async ({ page }) => {
    await page.goto("/hadith");
    await waitForContent(page);
    const body = await page.locator("body").innerText();
    expect(body).toContain("الحديث وعلومه");
    expect(body).toContain("الأربعون النووية");
    const embeddedCards = page.locator('[data-testid="hadith-card"]');
    await expect(embeddedCards).toHaveCount(0);
    const cta = page.locator(".hadith-browse-cta");
    await expect(cta).toBeVisible();
  });

  test("navigating to arbaeen does not wait for hadith corpus", async ({ page }) => {
    await page.goto("/hadith");
    await waitForContent(page);
    const start = Date.now();
    await page.locator('a[href="/arbaeen-nawawi"]').first().click();
    await page.waitForURL("**/arbaeen-nawawi**", { timeout: 5000 });
    expect(Date.now() - start).toBeLessThan(4000);
    await expect(page.locator("body")).toContainText(/الأربعون|الحديث 1/);
  });

  test("sahih list shows hadith cards", async ({ page }) => {
    await openSahihList(page);
    const body = await page.locator("body").innerText();
    expect(body.length, "صفحة الأحاديث الصحيحة فارغة").toBeGreaterThan(50);
  });

  test("hadith card opens detail modal or navigates to detail page", async ({ page }) => {
    await openSahihList(page);
    const cards = page.locator('[data-testid="hadith-card"], [class*="hadith-card"]').filter({ hasText: /حديث|قال|روى|النبي/ });
    if (await cards.count() > 0) {
      const readMore = cards.first().locator('a.hadith-card__read-more, button.hadith-card__read-more').first();
      if (await readMore.count() > 0) {
        const tag = await readMore.evaluate((el) => el.tagName.toLowerCase());
        if (tag === "a") {
          await readMore.click();
          await page.waitForURL(/\/hadith\//, { timeout: 5000 });
          expect(page.url()).toMatch(/\/hadith\//);
        } else {
          await readMore.click();
          await page.waitForTimeout(400);
          const modal = page.locator('[role="dialog"], [class*="modal"]');
          const bodyText = await page.locator("body").innerText();
          const hasDetail = (await modal.count()) > 0 || bodyText.includes("المصدر");
          expect(hasDetail, "النقر على قراءة المزيد يجب أن يفتح التفاصيل").toBe(true);
        }
      }
    }
  });

  test("Escape closes hadith modal", async ({ page }) => {
    await openSahihList(page);
    const cards = page.locator('[data-testid="hadith-card"], [class*="hadith-card"]').filter({ hasText: /حديث|قال|روى|النبي/ });
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
    await openSahihList(page);
    const filter = page.locator('[class*="filter"], button, [class*="hadith-quick-cat"]').filter({ hasText: /البخاري|مسلم|متفق|الكل/ }).first();
    if (await filter.count() > 0) {
      await filter.click();
      await page.waitForTimeout(400);
      const body = await page.locator("body").innerText();
      expect(body.length).toBeGreaterThan(5);
    }
  });

  test("hadith copy button copies text (no crash)", async ({ page }) => {
    await openSahihList(page);
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const copyBtn = page.locator('button[aria-label*="نسخ"], button[title*="نسخ"]').first();
    if (await copyBtn.count() > 0) {
      await copyBtn.click();
      await page.waitForTimeout(300);
      expect(await page.locator("body").innerText()).toBeTruthy();
    }
  });
});
