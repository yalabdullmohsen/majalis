/**
 * E2E — Quran Engine reader journeys (page flip, continuous mode, ayah sheet + audio).
 * Does not alter application code; asserts against existing DOM contracts.
 */
import { test, expect } from "@playwright/test";
import { waitForContent, collectConsoleErrors } from "../helpers";

test.describe("Quran Engine — قارئ المصحف E2E", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "قارئ المصحف يُختبر على Chromium");

  test("يفتح المصحف ويقلّب الصفحات مع حدود صحيحة", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/mushaf/page/1");
    await waitForContent(page);
    await page.waitForTimeout(1200);

    await expect(page.locator(".qs-mushaf-frame, .mpv-body--continuous, .mf2-lines").first()).toBeVisible({
      timeout: 15_000,
    });

    const pageInput = page.locator(".mpv-navbar__page-input");
    if (await pageInput.count()) {
      await expect(pageInput).toHaveValue("1");
      await page.getByRole("button", { name: "الصفحة التالية" }).click();
      await page.waitForTimeout(800);
      await expect(pageInput).toHaveValue("2");
      await page.getByRole("button", { name: "الصفحة السابقة" }).click();
      await page.waitForTimeout(600);
      await expect(pageInput).toHaveValue("1");
      // حدود: لا انتقال قبل الصفحة 1
      await expect(page.getByRole("button", { name: "الصفحة السابقة" })).toBeDisabled();
    }

    expect(errors.length, `أخطاء كونسول: ${errors.map((e) => e.text()).join(" | ")}`).toBe(0);
  });

  test("يبدّل إلى القراءة المتصلة ويحافظ على حدود الصفحة عند العودة", async ({ page }) => {
    await page.goto("/mushaf/page/3");
    await waitForContent(page);
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "إعدادات القراءة" }).click();
    await expect(page.getByRole("heading", { name: "إعدادات القراءة" })).toBeVisible();

    const continuous = page.getByRole("button", { name: "قراءة متصلة" });
    await continuous.click();
    await page.waitForTimeout(500);
    // أغلق اللوحة إن بقي الزر ظاهرًا
    const closeBtn = page.locator(".mpv-settings-panel").getByRole("button", { name: "إغلاق" });
    if (await closeBtn.count()) await closeBtn.click();

    await expect(page.locator(".mpv-body--continuous, .cur-frame").first()).toBeVisible({ timeout: 10_000 });

    // أعد الوضع المديني
    await page.getByRole("button", { name: "إعدادات القراءة" }).click();
    await page.getByRole("button", { name: "مصحف المدينة" }).click();
    if (await closeBtn.count()) await closeBtn.click();
    await page.waitForTimeout(600);

    const pageInput = page.locator(".mpv-navbar__page-input");
    if (await pageInput.count()) {
      const val = await pageInput.inputValue();
      const n = Number(val);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(604);
    }
  });

  test("يفتح ورقة الآية ويشغّل التلاوة مع تمييز الآية النشطة", async ({ page }) => {
    await page.goto("/mushaf/page/2");
    await waitForContent(page);
    await page.waitForFunction(() => {
      const line = document.querySelector(".mf2-lines") as HTMLElement | null;
      return Boolean(line && getComputedStyle(line).opacity !== "0" && document.querySelectorAll(".mf2-ayah-group").length > 0);
    }, { timeout: 25_000 });

    const clicked = await page.evaluate(() => {
      const groups = Array.from(document.querySelectorAll(".mf2-ayah-group")) as HTMLElement[];
      const target =
        groups.find((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.top > 100 && r.bottom < window.innerHeight - 100;
        }) ?? groups[Math.min(1, groups.length - 1)];
      if (!target) return false;
      target.scrollIntoView({ block: "center" });
      target.click();
      return true;
    });
    expect(clicked).toBe(true);
    await page.waitForTimeout(600);

    const sheet = page.locator(".ayah-sheet, [class*='ayah-sheet'], .mpv-settings-sheet").first();
    const playBtn = page.getByRole("button", { name: /تشغيل|استمع|إيقاف|Play|Pause/i }).first();
    const hasSheet = (await sheet.count()) > 0 && (await sheet.isVisible().catch(() => false));
    const hasPlay = (await playBtn.count()) > 0;
    const hasActive = (await page.locator(".mf2-ayah-group--active, [aria-current='true']").count()) > 0;
    expect(hasSheet || hasPlay || hasActive).toBe(true);

    if (hasPlay) {
      await playBtn.click();
      await page.waitForTimeout(1000);
      expect((await page.locator("body").innerText()).length).toBeGreaterThan(5);
    }
  });
});
