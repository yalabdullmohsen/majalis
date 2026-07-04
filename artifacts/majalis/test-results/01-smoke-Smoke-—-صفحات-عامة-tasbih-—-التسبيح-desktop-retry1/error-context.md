# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-smoke.spec.ts >> Smoke — صفحات عامة >> [/tasbih] — التسبيح
- Location: tests/01-smoke.spec.ts:41:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/tasbih
Call log:
  - navigating to "http://localhost:5173/tasbih", waiting until "domcontentloaded"

```

# Test source

```ts
  1  | /**
  2  |  * Smoke tests — every public page must load without crashing.
  3  |  * Tests run on desktop only; mobile is handled in 08-responsive.spec.ts.
  4  |  */
  5  | import { test, expect } from "@playwright/test";
  6  | import { collectConsoleErrors, waitForContent } from "./helpers";
  7  | 
  8  | const PUBLIC_ROUTES = [
  9  |   { path: "/", name: "الرئيسية" },
  10 |   { path: "/lessons", name: "الدروس" },
  11 |   { path: "/hadith", name: "الحديث" },
  12 |   { path: "/adhkar", name: "الأذكار" },
  13 |   { path: "/quran", name: "المصحف" },
  14 |   { path: "/prayer-times", name: "مواقيت الصلاة" },
  15 |   { path: "/muezzins", name: "مكتبة المؤذنين" },
  16 |   { path: "/library", name: "المكتبة" },
  17 |   { path: "/fawaid", name: "الفوائد" },
  18 |   { path: "/stories", name: "القصص" },
  19 |   { path: "/miracles", name: "المعجزات" },
  20 |   { path: "/tasbih", name: "التسبيح" },
  21 |   { path: "/quran-radio", name: "راديو القرآن" },
  22 |   { path: "/topics", name: "الموضوعات" },
  23 |   { path: "/quiz", name: "الاختبارات" },
  24 |   { path: "/calendar", name: "التقويم" },
  25 |   { path: "/occasions", name: "المناسبات" },
  26 |   { path: "/search", name: "البحث" },
  27 |   { path: "/fiqh-council", name: "الفقه" },
  28 |   { path: "/about", name: "عن المنصة" },
  29 |   { path: "/settings", name: "الإعدادات" },
  30 |   { path: "/login", name: "تسجيل الدخول" },
  31 |   { path: "/register", name: "إنشاء حساب" },
  32 | ];
  33 | 
  34 | test.describe("Smoke — صفحات عامة", () => {
  35 |   test.beforeEach(async ({ page }) => {
  36 |     // Dismiss geolocation / notification dialogs automatically
  37 |     await page.context().grantPermissions([]);
  38 |   });
  39 | 
  40 |   for (const route of PUBLIC_ROUTES) {
  41 |     test(`[${route.path}] — ${route.name}`, async ({ page }) => {
  42 |       const errors = collectConsoleErrors(page);
> 43 |       await page.goto(route.path, { waitUntil: "domcontentloaded" });
     |                  ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/tasbih
  44 |       await waitForContent(page);
  45 | 
  46 |       // Page must not be a blank white screen
  47 |       const bodyText = await page.locator("body").innerText().catch(() => "");
  48 |       expect(bodyText.length, `الصفحة ${route.path} فارغة`).toBeGreaterThan(0);
  49 | 
  50 |       // No JS runtime errors
  51 |       expect(errors.map((e) => e.text()), `أخطاء JS في ${route.path}`).toHaveLength(0);
  52 | 
  53 |       // No "Error" heading visible to user
  54 |       const errorHeading = page.getByRole("heading", { name: /خطأ|Error|404|Something went wrong/i });
  55 |       await expect(errorHeading).toHaveCount(0);
  56 |     });
  57 |   }
  58 | });
  59 | 
```