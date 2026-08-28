/**
 * Smoke tests — every public page must load without crashing.
 * Tests run on desktop only; mobile is handled in 08-responsive.spec.ts.
 */
import { test, expect } from "@playwright/test";
import { collectConsoleErrors, waitForContent } from "./helpers";

const PUBLIC_ROUTES = [
  { path: "/", name: "الرئيسية" },
  { path: "/lessons", name: "الدروس" },
  { path: "/hadith", name: "الحديث" },
  { path: "/duas", name: "الأدعية" },
  { path: "/adhkar/morning", name: "أذكار الصباح" },
  { path: "/quran-hub", name: "مركز القرآن الكريم" },
  { path: "/mushaf", name: "المصحف" },
  { path: "/prayer-times", name: "مواقيت الصلاة" },
  { path: "/prayer", name: "اختصار الصلاة" },
  { path: "/library", name: "المكتبة" },
  { path: "/sections", name: "الأقسام" },
  { path: "/more", name: "الأقسام (تحويل)" },
  { path: "/tarikh-islami", name: "العلماء" },
  { path: "/fiqh", name: "الفقه" },
  { path: "/quiz", name: "الاختبارات" },
  { path: "/fawaid", name: "الفوائد" },
  { path: "/search", name: "البحث" },
  { path: "/about", name: "عن المنصة" },
  { path: "/settings", name: "الإعدادات" },
];

test.describe("Smoke — صفحات عامة", () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss geolocation / notification dialogs automatically
    await page.context().grantPermissions([]);
  });

  for (const route of PUBLIC_ROUTES) {
    test(`[${route.path}] — ${route.name}`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await waitForContent(page);

      // Page must not be a blank white screen
      const bodyText = await page.locator("body").innerText().catch(() => "");
      expect(bodyText.length, `الصفحة ${route.path} فارغة`).toBeGreaterThan(0);

      // No JS runtime errors
      expect(errors.map((e) => e.text()), `أخطاء JS في ${route.path}`).toHaveLength(0);

      // No "Error" heading visible to user
      const errorHeading = page.getByRole("heading", { name: /خطأ|Error|404|Something went wrong/i });
      await expect(errorHeading).toHaveCount(0);
    });
  }
});
