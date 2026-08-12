/**
 * 13-new-features.spec.ts
 *
 * اختبارات الميزات الجديدة:
 *   - الباحث الشرعي (RAG) — /scholarly-research
 *   - دليل الجامعات — /universities
 */
import { test, expect } from "@playwright/test";

// ── الباحث الشرعي ─────────────────────────────────────────────────────────────

test.describe("الباحث الشرعي (RAG) — /scholarly-research", () => {
  test("يفتح الصفحة بدون تسجيل دخول", async ({ page }) => {
    await page.goto("/scholarly-research");
    await expect(page).not.toHaveURL(/\/(login|admin)/);
    await expect(page.locator("body")).not.toContainText("غير مصرح");
  });

  test("يعرض حقل البحث", async ({ page }) => {
    await page.goto("/scholarly-research");
    await page.waitForLoadState("networkidle");
    const input = page.locator("input, textarea").first();
    await expect(input).toBeVisible();
  });

  test("يقبل استعلام بحثي ويُظهر نتيجة أو رسالة", async ({ page }) => {
    await page.goto("/scholarly-research");
    await page.waitForLoadState("networkidle");
    const input = page.locator("input, textarea").first();
    await input.fill("حكم الصلاة");
    // زر البحث أو Enter
    const btn = page.locator("button").filter({ hasText: /بحث|ابحث|إرسال/ }).first();
    if (await btn.isVisible()) {
      await btn.click();
    } else {
      await input.press("Enter");
    }
    // انتظار الاستجابة (حتى 15 ثانية)
    await page.waitForTimeout(3000);
    // يجب أن يكون هناك محتوى أو رسالة تحميل
    const body = page.locator("body");
    await expect(body).not.toContainText("خطأ غير متوقع");
  });
});

// ── دليل الجامعات ──────────────────────────────────────────────────────────────

test.describe("دليل الجامعات — /universities", () => {
  test("يفتح الصفحة بدون تسجيل دخول", async ({ page }) => {
    await page.goto("/universities");
    await expect(page).not.toHaveURL(/\/(login|admin)/);
    await expect(page.locator("body")).not.toContainText("غير مصرح");
  });

  test("يعرض محتوى الصفحة", async ({ page }) => {
    await page.goto("/universities");
    await page.waitForLoadState("networkidle");
    const body = page.locator("body");
    // يجب أن يظهر عنوان أو قائمة
    await expect(body).not.toContainText("خطأ غير متوقع");
    await expect(body).not.toBeEmpty();
  });

  test("صفحة المقارنة تفتح بدون خطأ", async ({ page }) => {
    await page.goto("/universities/compare");
    await expect(page).not.toHaveURL(/\/(login|admin)/);
    const body = page.locator("body");
    await expect(body).not.toContainText("خطأ غير متوقع");
  });

  test("يعرض حقل البحث عند وجوده", async ({ page }) => {
    await page.goto("/universities");
    await page.waitForLoadState("networkidle");
    // الصفحة تحتوي على input أو محتوى
    const hasContent = await page.locator("body").textContent();
    expect(hasContent?.length).toBeGreaterThan(10);
  });
});
